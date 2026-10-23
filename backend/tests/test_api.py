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
from app.models.session import AuthSession
from hashlib import sha256
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
        return self.request("POST", "/auth/signup", {"name": "Integration User", "email": email,
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
        data = {"medicine": "Integration Medicine", "generic": "Test generic", "category": "Test category", "stock": 3,
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
        self.assertEqual(self.inventory(pharmacy_name="Test Hospital")[0], 201)
        self.db.close()
        self.db = Session(bind=self.connection, join_transaction_mode="create_savepoint")
        self.assertEqual(self.request("GET", "/auth/me")[0], 200)

    def test_expired_and_forged_sessions_are_rejected(self):
        _, result = self.signup(); self.token = result["access_token"]
        session = self.db.get(AuthSession, sha256(self.token.encode()).hexdigest())
        session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        self.db.commit()
        self.assertEqual(self.request("GET", "/auth/me")[0], 401)
        self.assertEqual(self.request("GET", "/auth/me", token="invented-token")[0], 401)

    def test_closed_pharmacy_cannot_accept_reservations(self):
        self.setup_stock()
        self.assertEqual(self.request("PATCH", "/pharmacies/mine", {"is_open": False}, token=self.pharmacist)[0], 200)
        self.assertEqual(self.reserve()[0], 409)

    def test_stock_update_cannot_overwrite_reserved_units(self):
        self.setup_stock(); self.reserve(2)
        self.assertEqual(self.request("PATCH", f"/inventory/{self.stock['id']}",
                                     {"stock": 1, "reorder_level": 0}, token=self.pharmacist)[0], 409)

    def test_unicode_names_round_trip_through_database(self):
        name = "\u0d96\u0dc2\u0db0"
        self.admin_token = self.admin(); self.token = self.operator()
        status, row = self.inventory(medicine=name)
        self.assertEqual(status, 201)
        self.assertEqual(row["medicine"], name)
        self.assertEqual(self.request("GET", "/inventory")[1][0]["medicine"], name)

    def hospital(self, email="hospital@example.test"):
        _, payload = self.signup("Hospital Staff", email)
        response = self.request("POST", f"/admin/users/{payload['user']['id']}/approve", token=self.admin_token)
        self.assertEqual(response[0], 200)
        return payload["access_token"]

    def test_hospital_owns_its_stock_and_cannot_update_pharmacy_stock(self):
        self.setup_stock()
        hospital = self.hospital()
        self.token = hospital
        self.assertEqual(self.request("GET", "/inventory")[1], [])
        status, stock = self.inventory(pharmacy_name="Test Hospital", stock=8)
        self.assertEqual(status, 201)
        self.assertEqual(self.request("GET", "/pharmacies/mine")[1]["location_type"], "Hospital")
        self.assertEqual(self.request("PATCH", f"/inventory/{stock['id']}", {"stock": 9, "reorder_level": 1})[0], 200)
        self.assertEqual(self.request("PATCH", f"/inventory/{self.stock['id']}", {"stock": 99, "reorder_level": 1})[0], 404)
        self.assertEqual(self.request("PATCH", f"/inventory/{stock['id']}", {"stock": 99, "reorder_level": 1}, token=self.pharmacist)[0], 404)
        other = self.hospital("another-hospital@example.test")
        self.assertEqual(self.request("PATCH", f"/inventory/{stock['id']}", {"stock": 99, "reorder_level": 1}, token=other)[0], 404)
        self.assertEqual(self.request("GET", "/inventory", token=other)[1], [])
        self.assertEqual(self.db.get(Inventory, stock["id"]).current_stock, 9)

    def test_hospital_stock_search_and_reservation_lifecycle(self):
        self.setup_stock()
        hospital = self.hospital()
        self.token = hospital
        _, stock = self.inventory(pharmacy_name="Test Hospital", stock=4)
        self.token = self.patient
        medicines = self.request("GET", "/medicines/search?query=Medicine")[1]
        path = f"/pharmacies/recommendations?medicine_id={medicines[0]['id']}&latitude=6.9271&longitude=79.8612"
        matches = self.request("GET", path)[1]
        hospitals = [row for row in matches if row["location_type"] == "Hospital"]
        self.assertEqual(len(hospitals), 1)
        self.assertEqual(hospitals[0]["id"], stock["id"])
        self.assertEqual(hospitals[0]["latitude"], 6.9271)
        self.assertIn("updated_at", hospitals[0])
        _, reservation = self.request("POST", "/reservations", {"inventory_id": stock["id"], "quantity": 2})
        hospital_reservations = self.request("GET", "/reservations", token=hospital)[1]
        self.assertEqual(hospital_reservations[0]["id"], reservation["id"])
        self.assertTrue(hospital_reservations[0]["can_manage"])
        for state in ("confirmed", "completed"):
            self.assertEqual(self.request("PATCH", f"/reservations/{reservation['id']}", {"status": state}, token=hospital)[0], 200)
        self.assertEqual(self.db.get(Inventory, stock["id"]).current_stock, 2)
        self.request("PATCH", f"/inventory/{stock['id']}", {"stock": 0, "reorder_level": 1}, token=hospital)
        self.assertFalse(any(row["id"] == stock["id"] for row in self.request("GET", path)[1]))

    def test_hospital_cannot_confirm_reservation_created_at_another_institution(self):
        self.setup_stock()
        hospital = self.hospital()
        _, row = self.request("POST", "/reservations", {"inventory_id": self.stock["id"], "quantity": 1}, token=hospital)
        self.assertFalse(row["can_manage"])
        self.assertEqual(self.request("PATCH", f"/reservations/{row['id']}", {"status": "confirmed"}, token=hospital)[0], 403)

    def test_own_location_edit_updates_search_without_changing_other_locations(self):
        self.setup_stock()
        hospital = self.hospital()
        self.token = hospital
        _, stock = self.inventory(pharmacy_name="Test Hospital", stock=8)
        changes = {"is_open": True, "name": "Updated Hospital", "area": "Updated Address", "contact_number": "0771234567", "latitude": 7.0, "longitude": 80.0}
        self.assertEqual(self.request("PATCH", "/pharmacies/mine", changes)[0], 200)
        own = self.request("GET", "/pharmacies/mine")[1]
        self.assertEqual((own["name"], own["latitude"]), ("Updated Hospital", 7.0))
        pharmacy = self.request("GET", "/pharmacies/mine", token=self.pharmacist)[1]
        self.assertEqual(pharmacy["name"], "Test Pharmacy")
        path = f"/pharmacies/recommendations?medicine_id={stock['medicine_id']}&latitude=7&longitude=80"
        result = next(row for row in self.request("GET", path, token=self.patient)[1] if row["id"] == stock["id"])
        self.assertEqual((result["name"], result["area"], result["distance_km"]), ("Updated Hospital", "Updated Address", 0))
        self.assertEqual(self.request("PATCH", "/pharmacies/mine", {"is_open": True, "latitude": 91})[0], 422)
        self.assertEqual(self.request("GET", "/pharmacies/mine", token=self.patient)[0], 403)

    def test_map_stock_shows_available_units_without_private_records(self):
        self.setup_stock()
        self.reserve(2)
        status, rows = self.request("GET", f"/pharmacies/{self.stock['pharmacy_id']}/stock")
        self.assertEqual(status, 200)
        self.assertEqual(rows[0]["available"], 1)
        self.assertEqual(set(rows[0]), {"id", "medicine", "generic", "strength", "available", "updated_at"})
        self.reserve(1)
        self.assertEqual(self.request("GET", f"/pharmacies/{self.stock['pharmacy_id']}/stock")[1], [])

    def test_map_stock_requires_authentication_and_existing_location(self):
        self.assertEqual(self.request("GET", "/pharmacies/1/stock")[0], 401)
        _, patient = self.signup(); self.token = patient["access_token"]
        self.assertEqual(self.request("GET", "/pharmacies/2147483647/stock")[0], 404)

    def test_inventory_edit_and_delete_permissions_and_history(self):
        self.setup_stock()
        path = f"/inventory/{self.stock['id']}"
        patch_data = {"medicine": "Corrected medicine", "generic": "Corrected generic", "strength": "10 mg",
                      "category": "Corrected category", "requires_prescription": False, "stock": 8, "reorder_level": 2}
        self.assertEqual(self.request("PATCH", path, patch_data)[0], 403)
        self.assertEqual(self.request("DELETE", path)[0], 403)
        other = self.operator("other-edit@example.test")
        self.assertEqual(self.request("PATCH", path, patch_data, token=other)[0], 404)
        self.assertEqual(self.request("DELETE", path, token=other)[0], 404)
        # A second supplier shares the original medicine; editing must leave it intact.
        self.token = other
        _, other_stock = self.inventory()
        status, changed = self.request("PATCH", path, patch_data, token=self.pharmacist)
        self.assertEqual(status, 200)
        self.assertEqual(changed["medicine"], "Corrected medicine 10 mg")
        self.assertFalse(changed["requires_prescription"])
        self.assertEqual(self.request("GET", "/inventory")[1][0]["medicine"], "Integration Medicine")
        self.assertEqual(self.request("DELETE", path, token=self.pharmacist)[0], 204)
        self.assertEqual(self.request("DELETE", path, token=self.pharmacist)[0], 404)
        self.assertEqual(self.request("GET", "/inventory")[1][0]["id"], other_stock["id"])

    def test_inventory_edit_rejects_duplicate_identity(self):
        self.setup_stock()
        self.token = self.pharmacist
        _, second = self.inventory(medicine="Second medicine")
        status, _ = self.request("PATCH", f"/inventory/{second['id']}", {
            "medicine": "integration medicine", "generic": "Test generic", "strength": "",
            "category": "Different category", "stock": 3, "reorder_level": 1})
        self.assertEqual(status, 409)
        self.assertEqual(len(self.request("GET", "/inventory")[1]), 2)

    def test_inventory_active_reservations_protect_delete_and_medicine_changes(self):
        self.setup_stock()
        _, reservation = self.reserve()
        path = f"/inventory/{self.stock['id']}"
        self.assertEqual(self.request("DELETE", path, token=self.pharmacist)[0], 409)
        self.assertEqual(self.request("PATCH", path, {"medicine": "Changed", "stock": 3, "reorder_level": 1}, token=self.pharmacist)[0], 409)
        self.assertEqual(self.request("PATCH", path, {"stock": 9, "reorder_level": 1}, token=self.pharmacist)[0], 200)
        self.request("PATCH", f"/reservations/{reservation['id']}", {"status": "cancelled"})
        self.assertEqual(self.request("DELETE", path, token=self.pharmacist)[0], 204)
        self.assertEqual(self.request("GET", "/reservations")[1][0]["status"], "Cancelled")

    def test_profile_update_persists_and_uses_new_login_email(self):
        _, result = self.signup()
        self.token = result["access_token"]
        payload = {"name": "  Updated Person  ", "email": " NEW-PROFILE@example.test ", "phone": "+94 77 123 4567"}
        status, saved = self.request("PATCH", "/auth/me", payload)
        self.assertEqual(status, 200)
        self.assertEqual(saved["name"], "Updated Person")
        self.assertEqual(saved["email"], "new-profile@example.test")
        self.assertEqual(saved["phone"], "+94 77 123 4567")
        self.assertEqual(saved["id"], result["user"]["id"])
        self.assertEqual(saved["role"], "Patient")
        self.assertEqual(self.request("GET", "/auth/me")[1], saved)
        self.assertEqual(self.request("POST", "/auth/login", {"email": "integration@example.test", "password": "secret123", "role": "Patient"})[0], 401)
        self.assertEqual(self.request("POST", "/auth/login", {"email": saved["email"], "password": "secret123", "role": "Patient"})[0], 200)
        self.assertEqual(self.request("PATCH", "/auth/me", {**payload, "phone": ""})[1]["phone"], None)

    def test_profile_validation_uniqueness_and_privilege_protection(self):
        data = {"name": "Updated Person", "email": "updated@example.test", "phone": ""}
        self.assertEqual(self.request("PATCH", "/auth/me", data)[0], 401)
        _, first = self.signup()
        self.token = first["access_token"]
        _, other = self.signup(email="other-profile@example.test")
        for field, value in [("name", " "), ("email", "bad-email"), ("phone", "123"), ("role", "Admin"), ("approved", True), ("id", other["user"]["id"])]:
            self.assertEqual(self.request("PATCH", "/auth/me", {**data, field: value})[0], 422)
        self.assertEqual(self.request("PATCH", "/auth/me", {**data, "email": "OTHER-PROFILE@example.test"})[0], 409)
        self.assertEqual(self.request("GET", "/auth/me")[1]["email"], "integration@example.test")
        self.assertEqual(self.request("GET", "/auth/me", token=other["access_token"])[1]["email"], "other-profile@example.test")

    def test_readiness_hides_database_errors(self):
        with patch("app.routers.health.engine") as mocked:
            mocked.connect.side_effect = OperationalError("connect", {}, Exception("private"))
            status, result = self.request("GET", "/health/ready")
        self.assertEqual(status, 503)
        self.assertNotIn("private", result["detail"])


if __name__ == "__main__":
    unittest.main()
