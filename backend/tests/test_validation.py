import unittest
from pydantic import ValidationError
from app.routers.auth import LoginRequest, SignupRequest
from app.routers.inventory import StockUpdate
from app.routers.reservations import ReservationCreate
from app.schemas.inventory import InventoryCreate
from app.schemas.validation import MAX_STOCK


class ValidationTests(unittest.TestCase):
    def inventory(self, **changes):
        data = dict(medicine="Medicine", generic="Generic", category="Category", pharmacy_name="Pharmacy",
                    area="Address", contact_number="+94 77 123 4567", stock=0, latitude=0, longitude=0)
        data.update(changes)
        return InventoryCreate(**data)

    def test_inventory_rejects_whitespace_phone_and_coordinate_errors(self):
        for fields in ({"medicine": " "}, {"generic": " "}, {"area": " "}, {"category": "x"*101},
                       {"contact_number": "abc1234567"}, {"contact_number": "123"},
                       {"latitude": 91}, {"longitude": float("inf")}, {"stock": MAX_STOCK+1},
                       {"stock": True}, {"stock": 1.5}, {"stock": "3"}):
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                self.inventory(**fields)
        self.assertEqual(self.inventory().latitude, 0)

    def test_password_and_phone_signup_rules(self):
        data = dict(name="Test User", email=" USER@example.com ", password="secret123")
        user = SignupRequest(**data, phone=" +94 (77) 123-4567 ")
        self.assertEqual(user.email, "user@example.com")
        self.assertEqual(user.phone, "+94 (77) 123-4567")
        self.assertIsNone(SignupRequest(**data, phone=" ").phone)
        for fields in ({"name": " "}, {"password": "      "}, {"phone": "not-a-phone"}, {"email": "a@b..com"}):
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                SignupRequest(**(data | fields))
        with self.assertRaises(ValidationError):
            LoginRequest(email=1234, password="secret123")

    def test_quantities_and_stock_bounds(self):
        for value in (0, -1, 1.5, True, "2", MAX_STOCK+1):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                ReservationCreate(inventory_id=1, quantity=value)
        for value in (0, -1, True, "1"):
            with self.subTest(inventory_id=value), self.assertRaises(ValidationError):
                ReservationCreate(inventory_id=value, quantity=1)
        self.assertEqual(StockUpdate(stock=0, reorder_level=MAX_STOCK).stock, 0)
        with self.assertRaises(ValidationError):
            StockUpdate(stock=MAX_STOCK+1, reorder_level=0)
