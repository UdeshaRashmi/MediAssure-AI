"""API regression checks using ASGI directly; no running server or database needed."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy.exc import OperationalError

from app.main import app
from app.routers.auth import verify_password
from app.routers.reservations import create_reservation
from app.schemas.demo import ReservationCreate
from app.services import demo_data as store


async def asgi_request(method, path, data=None):
    path, _, query = path.partition("?")
    body = json.dumps(data).encode() if data is not None else b""
    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
             "method": method, "scheme": "http", "path": path, "raw_path": path.encode(),
             "query_string": query.encode(), "root_path": "",
             "headers": [(b"content-type", b"application/json")],
             "server": ("testserver", 80), "client": ("127.0.0.1", 1234)}
    messages = []

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)
    status = next(message["status"] for message in messages if message["type"] == "http.response.start")
    content = b"".join(message.get("body", b"") for message in messages if message["type"] == "http.response.body")
    return status, json.loads(content)


class ApiTests(unittest.TestCase):
    def setUp(self):
        for name in ("USERS", "INVENTORY", "RECOMMENDATIONS", "RESERVATIONS", "TRANSFERS",
                     "FORECASTS", "NETWORK", "ALERTS", "AUDIT_EVENTS", "VERIFIED_ALTERNATIVES"):
            getattr(store, name).clear()

    def request(self, method, path, data=None):
        return asyncio.run(asgi_request(method, path, data))

    def inventory(self, **overrides):
        data = {"medicine": "Medicine A", "stock": 10, "pharmacy_name": "Pharmacy A"}
        data.update(overrides)
        return self.request("POST", "/inventory", data)

    def reserve(self, **overrides):
        data = {"medicine": "Medicine A", "pharmacy_name": "Pharmacy A", "quantity": 2}
        data.update(overrides)
        return self.request("POST", "/reservations", data)

    def test_inventory_validation(self):
        for change in ({"reserved": 11}, {"medicine": "  "}, {"latitude": 91}, {"longitude": -181}, {"stock": -1}):
            with self.subTest(change=change):
                self.assertEqual(self.inventory(**change)[0], 422)
        self.assertEqual(store.INVENTORY, [])

    def test_duplicate_inventory_and_pharmacy_network(self):
        self.assertEqual(self.inventory()[0], 201)
        self.assertEqual(self.inventory(medicine=" medicine a ")[0], 409)
        self.assertEqual(self.inventory(medicine="Medicine B")[0], 201)
        self.assertEqual(len(store.NETWORK), 1)
        self.assertEqual(len(store.INVENTORY), 2)

    def test_dashboard_uses_real_medicine_count(self):
        self.assertEqual(self.request("GET", "/dashboard/summary")[1]["active_medicines"], 0)
        self.inventory()
        self.inventory(pharmacy_name="Pharmacy B")
        self.assertEqual(self.request("GET", "/dashboard/summary")[1]["active_medicines"], 1)

    def test_reservations_saved_and_stock_enforced(self):
        self.inventory(stock=3)
        status, first = self.reserve()
        self.assertEqual(status, 201)
        self.assertEqual(self.reserve(quantity=2)[0], 409)
        status, second = self.reserve(quantity=1)
        self.assertEqual(status, 201)
        self.assertNotEqual(first["id"], second["id"])
        self.assertEqual(len(self.request("GET", "/reservations")[1]), 2)
        self.assertEqual(store.INVENTORY[0].reserved, 3)
        self.assertEqual(store.NETWORK[0].urgent_gaps, 10)
        self.assertEqual(self.reserve(pharmacy_name="Other")[0], 404)

    def test_concurrent_reservations_do_not_oversell(self):
        self.inventory(stock=1)
        payload = ReservationCreate(medicine="Medicine A", pharmacy_name="Pharmacy A")

        def reserve_one(_):
            try:
                create_reservation(payload)
                return 201
            except HTTPException as error:
                return error.status_code

        with ThreadPoolExecutor(max_workers=4) as executor:
            statuses = list(executor.map(reserve_one, range(4)))
        self.assertEqual(statuses.count(201), 1)
        self.assertEqual(statuses.count(409), 3)

    def test_recommendations_filter_medicine_quantity_and_distance(self):
        self.inventory()
        self.inventory(medicine="Medicine B", pharmacy_name="Other")
        self.inventory(pharmacy_name="Far", latitude=7.2)
        path = "/pharmacies/recommendations?medicine_id=1&latitude=6.9271&longitude=79.8612"
        status, matches = self.request("GET", path)
        self.assertEqual(status, 200)
        self.assertEqual([item["name"] for item in matches], ["Pharmacy A", "Far"])
        self.assertEqual(matches[0]["distance_km"], 0)
        self.assertFalse(matches[0]["verified"])
        self.reserve(quantity=10)
        self.assertEqual(len(self.request("GET", path)[1]), 1)
        self.assertEqual(self.request("GET", path + "&quantity=11")[1], [])
        self.assertEqual(self.request("GET", path + "&quantity=0")[0], 422)
        self.assertEqual(self.request("GET", path.replace("medicine_id=1", "medicine_id=99"))[0], 404)

    def test_signup_normalizes_email_and_hashes_password(self):
        payload = {"name": " Test User ", "email": " USER@example.com ", "password": "secret123", "role": "Patient"}
        status, response = self.request("POST", "/auth/signup", payload)
        self.assertEqual(status, 201)
        self.assertEqual(response["user"]["email"], "user@example.com")
        self.assertEqual(response["user"]["name"], "Test User")
        saved = store.USERS["user@example.com"]
        self.assertNotIn("password", saved)
        self.assertTrue(verify_password("secret123", saved["password_hash"]))
        self.assertNotIn("password_hash", response["user"])
        self.assertEqual(self.request("POST", "/auth/signup", payload)[0], 409)
        credentials = {key: payload[key] for key in ("email", "password", "role")}
        self.assertEqual(self.request("POST", "/auth/login", credentials)[0], 200)
        credentials["password"] = "incorrect"
        self.assertEqual(self.request("POST", "/auth/login", credentials)[0], 401)

    def test_signup_rejects_invalid_email_and_role(self):
        payload = {"name": "Test", "email": "not-an-email", "password": "secret123"}
        self.assertEqual(self.request("POST", "/auth/signup", payload)[0], 422)
        payload.update(email="test@example.com", role="Unknown")
        self.assertEqual(self.request("POST", "/auth/signup", payload)[0], 422)

    def test_readiness_reports_database_failure(self):
        with patch("app.routers.health.engine") as engine:
            engine.connect.side_effect = OperationalError("connect", {}, Exception("private connection details"))
            status, response = self.request("GET", "/health/ready")
        self.assertEqual(status, 503)
        self.assertNotIn("private", response["detail"])
        self.assertEqual(self.request("GET", "/health")[0], 200)


if __name__ == "__main__":
    unittest.main()
