from datetime import UTC, datetime, timedelta
from hashlib import pbkdf2_hmac
from hmac import compare_digest
from secrets import token_hex, token_urlsafe

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.services.demo_data import STORE_LOCK, USERS

router = APIRouter()
ALLOWED_ROLES = {"Patient", "Pharmacist", "Hospital Staff", "Admin"}


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=1024)
    role: str = "Pharmacist"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        local, separator, domain = value.partition("@")
        if not separator or not local or "." not in domain or domain.startswith(".") or domain.endswith(".") or "@" in domain or any(char.isspace() for char in value):
            raise ValueError("A valid email address is required")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in ALLOWED_ROLES:
            raise ValueError("Unsupported role")
        return value


class SignupRequest(LoginRequest):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def reject_blank_password(cls, value: str) -> str:
        if len(value.strip()) < 6:
            raise ValueError("Password must contain at least 6 non-padding characters")
        return value


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: dict[str, str]


def hash_password(password: str) -> str:
    salt = token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 600_000).hex()
    return f"pbkdf2_sha256$600000${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, rounds, salt, expected = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual = pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds)).hex()
        return compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def login_response(user: dict[str, str]) -> LoginResponse:
    # Prototype session token. Authorization is not enforced by operational routes yet.
    return LoginResponse(
        access_token=token_urlsafe(32), expires_at=datetime.now(UTC) + timedelta(hours=8),
        user={key: user[key] for key in ("name", "email", "role")},
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    with STORE_LOCK:
        user = USERS.get(payload.email)
        stored = user["password_hash"] if user else hash_password("dummy-password")
        valid = verify_password(payload.password, stored)
        if not user or not valid or user["role"] != payload.role:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return login_response(user)


@router.post("/signup", response_model=LoginResponse, status_code=201)
def signup(payload: SignupRequest) -> LoginResponse:
    password_hash = hash_password(payload.password)
    with STORE_LOCK:
        if payload.email in USERS:
            raise HTTPException(status_code=409, detail="User already exists")
        user = {"name": payload.name, "email": payload.email,
                "password_hash": password_hash, "phone": payload.phone or "", "role": payload.role}
        USERS[payload.email] = user
        return login_response(user)
