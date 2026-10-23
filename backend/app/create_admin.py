"""Explicit local administrator setup; never run automatically or seed sample data."""
from getpass import getpass
from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.routers.auth import SignupRequest


def main():
    payload = SignupRequest(name=input("Name: "), email=input("Email: "),
                            password=getpass("Password: "), role="Admin")
    if payload.password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == payload.email)):
            raise SystemExit("Email already exists; no changes made")
        db.add(User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password),
                    role=UserRole.ADMIN, is_approved=True))
        db.commit()
    print("Administrator created. Sign in using the Admin role.")


if __name__ == "__main__":
    main()
