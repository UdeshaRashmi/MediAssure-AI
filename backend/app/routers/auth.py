from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.access import ROLE_VALUES, current_user, user_data
from app.core.security import DUMMY_HASH, hash_password, verify_password
from app.db.session import get_db
from app.models.session import AuthSession
from app.models.user import User, UserRole
from pydantic import BaseModel, Field, field_validator

router = APIRouter()
ALLOWED_ROLES = set(ROLE_VALUES)


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



def issue_session(db: Session, user: User) -> dict:
    token = token_urlsafe(32)
    expires = datetime.now(UTC) + timedelta(hours=8)
    db.add(AuthSession(token_hash=sha256(token.encode()).hexdigest(), user_id=user.id, expires_at=expires))
    db.commit()
    return {"access_token": token, "token_type": "bearer", "expires_at": expires, "user": user_data(user)}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    valid = verify_password(payload.password, user.password_hash if user and user.password_hash else DUMMY_HASH)
    if not user or not valid or ROLE_VALUES[payload.role] != user.role:
        raise HTTPException(401, "Invalid credentials or selected role")
    return issue_session(db, user)


@router.post("/signup", status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if payload.role == "Admin":
        raise HTTPException(403, "Administrator accounts cannot be created through public signup")
    user = User(name=payload.name, email=payload.email, phone=payload.phone,
                password_hash=hash_password(payload.password), role=ROLE_VALUES[payload.role],
                is_approved=payload.role == "Patient")
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "User already exists") from None
    return issue_session(db, user)


@router.get("/me")
def me(user: User = Depends(current_user)):
    return user_data(user)


@router.post("/logout", status_code=204)
def logout(user: User = Depends(current_user), db: Session = Depends(get_db), credentials=Depends(__import__("app.core.access", fromlist=["bearer"]).bearer)):
    db.execute(delete(AuthSession).where(AuthSession.token_hash == sha256(credentials.credentials.encode()).hexdigest()))
    db.commit()
