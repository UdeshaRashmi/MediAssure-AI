from datetime import UTC, datetime, timedelta
from hashlib import sha256

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.demo_data import USERS


router = APIRouter()
ALLOWED_ROLES = {"Patient", "Pharmacist", "Hospital Staff", "Admin"}


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = "Pharmacist"


class SignupRequest(LoginRequest):
    name: str
    phone: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: dict[str, str]


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Unsupported role")
    if len(payload.password.strip()) < 6:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    saved_user = USERS.get(payload.email.lower())
    if not saved_user or saved_user["password"] != payload.password or saved_user["role"] != payload.role:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(hours=8)
    token_seed = f"{payload.email}:{payload.role}:{expires_at.isoformat()}:{settings.jwt_secret}"
    access_token = sha256(token_seed.encode("utf-8")).hexdigest()

    return LoginResponse(
        access_token=access_token,
        expires_at=expires_at,
        user={
            "name": "City Care Operator" if payload.role != "Patient" else "Emergency User",
            "name": saved_user["name"],
            "email": payload.email,
            "role": payload.role,
        },
    )


@router.post("/signup", response_model=LoginResponse)
def signup(payload: SignupRequest) -> LoginResponse:
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Unsupported role")
    if len(payload.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name is required")
    if len(payload.password.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if payload.email.lower() in USERS:
        raise HTTPException(status_code=409, detail="User already exists")

    USERS[payload.email.lower()] = {
        "name": payload.name,
        "email": payload.email,
        "password": payload.password,
        "phone": payload.phone or "",
        "role": payload.role,
    }

    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(hours=8)
    token_seed = f"signup:{payload.email}:{payload.role}:{expires_at.isoformat()}:{settings.jwt_secret}"
    access_token = sha256(token_seed.encode("utf-8")).hexdigest()

    return LoginResponse(
        access_token=access_token,
        expires_at=expires_at,
        user={
            "name": payload.name,
            "email": payload.email,
            "role": payload.role,
        },
    )
