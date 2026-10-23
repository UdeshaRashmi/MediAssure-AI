from datetime import UTC, datetime
from hashlib import sha256

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.session import AuthSession
from app.models.user import User, UserRole

bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise HTTPException(401, "Sign in required", headers={"WWW-Authenticate": "Bearer"})
    session = db.get(AuthSession, sha256(credentials.credentials.encode()).hexdigest())
    now = datetime.now(UTC)
    if session is None or session.expires_at.replace(tzinfo=UTC) <= now:
        raise HTTPException(401, "Session expired; sign in again", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(401, "Account unavailable")
    return user


def approved_user(user: User = Depends(current_user)) -> User:
    if not user.is_approved:
        raise HTTPException(403, "Account awaiting administrator approval")
    return user


def require_roles(*roles: UserRole):
    def check(user: User = Depends(approved_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, "Your role cannot perform this action")
        return user
    return check


ROLE_LABELS = {UserRole.USER: "Patient", UserRole.PHARMACIST: "Pharmacist", UserRole.HOSPITAL_STAFF: "Hospital Staff", UserRole.ADMIN: "Admin"}
ROLE_VALUES = {value: key for key, value in ROLE_LABELS.items()}


def user_data(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email,
            "role": ROLE_LABELS[user.role], "approved": user.is_approved}
