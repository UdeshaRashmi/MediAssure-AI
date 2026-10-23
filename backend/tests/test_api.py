"""PostgreSQL integration tests. Every test runs inside a rolled-back transaction.
Run migrations first; no fixtures or accounts survive the test run.
"""
import asyncio
from datetime import UTC, datetime, timedelta
import json
import unittest
from unittest.mock import patch
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import engine, get_db
from app.models.user import User, UserRole
from app.models.inventory import Inventory
from app.models.reservation import Reservation
from app.core.security import hash_password, verify_password
from app.routers.auth import issue_session

async def asgi_request(method, path, data=None, token=None):
    path, _, query = path.partition("?")
    body = json.dumps(data).encode() if data is not None else b""
    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
             "method": method, "scheme": "http", "path": path, "raw_path": path.encode(),
             "query_string": query.encode(), "root_path": "",
             "headers": [(b"content-type", b"application/json")] + ([(b"authorization", f"Bearer {token}".encode())] if token else []),
             "server": ("testserver", 80), "client": ("127.0.0.1", 1234)}
    messages = []

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)
    status = next(message["status"] for message in messages if message["type"] == "http.response.start")
    content = b"".join(message.get("body", b"") for message in messages if message["type"] == "http.response.body")
    return status, json.loads(content) if content else None


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self.db = Session(bind=self.connection, join_transaction_mode="create_savepoint")
        app.dependency_overrides[get_db] = lambda: self.db
        self.token = None

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        self.transaction.rollback()
        self.connection.close()

    def request(self, method, path, data=None, token=None):
        return asyncio.run(asgi_request(method, path, data, self.token if token is None else token))

    def signup(self, role="Patient", email="integration@example.test"):
        return self.request("POST", "/auth/signup", {"name": "??????? User", "email": email,
                            "password": "secret123", "role": role})

    def admin(self):
        user = User(name="Test Admin", email="admin-integration@example.test", role=UserRole.ADMIN,
                    is_approved=True, password_hash=hash_password("admin-secret"))
        self.db.add(user); self.db.flush()
        return issue_session(self.db, user)["access_token"]

    def operator(self, email="operator@example.test"):
        status, payload = self.signup("Pharmacist", email)
        self.assertEqual(status, 201)
        token = payload["access_token"]
        self.assertEqual(self.request("POST", f"/admin/users/{payload['user']['id']}/approve", token=self.admin_token)[0], 200)
        return token

    def inventory(self, **changes):
        data = {"medicine": "??????? Medicine", "generic": "Test generic", "stock": 3,
                "pharmacy_name": "Test Pharmacy", "area": "Real entered address", "contact_number": "0111234567",
                "latitude": 6.9271, "longitude": 79.8612, "is_open": True, "reorder_level": 1}
        data.update(changes)
        return self.request("POST", "/inventory", data)

    def setup_stock(self):
        self.admin_token = self.admin()
        self.pharmacist = self.operator()
        self.token = self.pharmacist
        status, self.stock = self.inventory()
        self.assertEqual(status, 201)
        _, patient = self.signup()
        self.patient = patient["access_token"]
        self.token = self.patient

    def reserve(self, quantity=1):
        return self.request("POST", "/reservations", {"inventory_id": self.stock["id"], "quantity": quantity})

    def test_signup_persists_hash_and_login_requires_matching_role(self):
        status, result = self.signup()
        self.assertEqual(status, 201)
        user = self.db.get(User, result["user"]["id"])
        self.assertTrue(verify_password("secret123", user.password_hash))
        self.assertNotIn("password_hash", result["user"])
        credentials = {"email": "INTEGRATION@example.test", "password": "secret123", "role": "Patient"}
        self.assertEqual(self.request("POST", "/auth/login", credentials)[0], 200)
        credentials["role"] = "Admin"
        self.assertEqual(self.request("POST", "/auth/login", credentials)[0], 401)
        self.assertEqual(self.signup()[0], 409)

    def test_public_admin_signup_is_forbidden(self):
        self.assertEqual(self.signup("Admin")[0], 403)

    def test_staff_approval_is_enforced(self):
        _, result = self.signup("Pharmacist")
        self.token = result["access_token"]
        self.assertFalse(result["user"]["approved"])
        self.assertEqual(self.request("GET", "/inventory")[0], 403)
        admin = self.admin()
        self.assertEqual(self.request("POST", f"/admin/users/{result['user']['id']}/approve", token=admin)[0], 200)
        self.assertEqual(self.request("GET", "/inventory")[0], 200)

    def test_unauthenticated_and_patient_operational_access(self):
        self.assertEqual(self.request("GET", "/inventory")[0], 401)
        _, result = self.signup(); self.token = result["access_token"]
        self.assertEqual(self.request("GET", "/inventory")[0], 403)
        self.assertEqual(self.request("GET", "/admin/users")[0], 403)
        self.assertEqual(self.request("GET", "/dashboard/summary")[0], 403)

    def test_logout_revokes_persisted_token(self):
        _, result = self.signup(); self.token = result["access_token"]
        self.assertEqual(self.request("GET", "/auth/me")[0], 200)
        self.assertEqual(self.request("POST", "/auth/logout")[0], 204)
        self.assertEqual(self.request("GET", "/auth/me")[0], 401)

    def test_inventory_validation_and_duplicate_rejection(self):
        self.setup_stock(); self.token = self.pharmacist
        self.assertEqual(self.inventory()[0], 409)
        self.assertEqual(self.inventory(medicine=" ")[0], 422)
        self.assertEqual(self.inventory(latitude=91)[0], 422)
        self.assertEqual(self.inventory(reserved=1)[0], 422)
        self.assertEqual(self.inventory(stock=-1)[0], 422)

    def test_reservation_stock_and_cancellation(self):
        self.setup_stock()
        status, row = self.reserve(2); self.assertEqual(status, 201)
        self.assertEqual(self.reserve(2)[0], 409)
        self.assertEqual(self.request("PATCH", f"/reservations/{row['id']}", {"status": "confirmed"})[0], 403)
        self.assertEqual(self.request("PATCH", f"/reservations/{row['id']}", {"status": "cancelled"})[0], 200)
        self.assertEqual(self.db.get(Inventory, self.stock["id"]).reserved_stock, 0)
        self.assertEqual(self.reserve(3)[0], 201)

    def test_confirmation_and_pickup_adjust_stock_once(self):
        self.setup_stock(); _, row = self.reserve(2)
        self.token = self.pharmacist
        for state in ("confirmed", "completed"):
            self.assertEqual(self.request("PATCH", f"/reservations/{row['id']}", {"status": state})[0], 200)
        self.assertEqual(self.request("PATCH", f"/reservations/{row['id']}", {"status": "completed"})[0], 409)
        item = self.db.get(Inventory, self.stock["id"])
        self.assertEqual((item.current_stock, item.reserved_stock), (1, 0))

    def test_expiry_releases_stock_once(self):
        self.setup_stock(); _, row = self.reserve(2)
        self.db.get(Reservation, int(row["id"])).expires_at = datetime.now(UTC)-timedelta(minutes=1)
        self.db.commit()
        for _ in range(2):
            self.assertEqual(self.request("GET", "/reservations")[0], 200)
        item = self.db.get(Inventory, self.stock["id"])
        self.assertEqual(item.reserved_stock, 0)

    def test_ownership_isolation(self):
        self.setup_stock(); _, reservation = self.reserve()
        _, other = self.signup(email="other@example.test"); self.token = other["access_token"]
        self.assertEqual(self.request("GET", "/reservations")[1], [])
        self.assertEqual(self.request("PATCH", f"/reservations/{reservation['id']}", {"status": "cancelled"})[0], 404)
        self.token = self.operator("other-operator@example.test")
        self.assertEqual(self.request("GET", "/inventory")[1], [])
        self.assertEqual(self.request("PATCH", f"/inventory/{self.stock['id']}", {"stock": 9, "reorder_level": 2})[0], 404)

    def test_real_medicine_search_and_recommendations(self):
        self.setup_stock()
        status, medicines = self.request("GET", "/medicines/search?query=Medicine")
        self.assertEqual(status, 200); self.assertEqual(len(medicines), 1)
        path = f"/pharmacies/recommendations?medicine_id={medicines[0]['id']}&latitude=6.9271&longitude=79.8612"
        self.assertEqual(self.request("GET", path)[1][0]["id"], self.stock["id"])
        self.reserve(3)
        self.assertEqual(self.request("GET", path)[1], [])
        self.assertEqual(self.request("GET", path+"&quantity=0")[0], 422)

    def test_hospital_role_and_persistence_across_sessions(self):
        self.admin_token = self.admin()
        _, staff = self.signup("Hospital Staff")
        self.request("POST", f"/admin/users/{staff['user']['id']}/approve", token=self.admin_token)
        self.token = staff["access_token"]
        self.assertEqual(self.request("GET", "/pharmacies")[0], 200)
        self.assertEqual(self.inventory()[0], 403)
        self.db.close()
        self.db = Session(bind=self.connection, join_transaction_mode="create_savepoint")
        self.assertEqual(self.request("GET", "/auth/me")[0], 200)

    def test_readiness_hides_database_errors(self):
        with patch("app.routers.health.engine") as mocked:
            mocked.connect.side_effect = OperationalError("connect", {}, Exception("private"))
            status, result = self.request("GET", "/health/ready")
        self.assertEqual(status, 503)
        self.assertNotIn("private", result["detail"])


if __name__ == "__main__":
    unittest.main()
