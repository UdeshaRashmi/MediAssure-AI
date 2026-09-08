from datetime import UTC, datetime, timedelta
from hashlib import sha256

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings


router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = "Pharmacist"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: dict[str, str]


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if len(payload.password.strip()) < 6:
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
            "email": payload.email,
            "role": payload.role,
        },
    )
