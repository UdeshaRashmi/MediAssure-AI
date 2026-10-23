from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.access import require_roles, user_data
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.records import audit

router = APIRouter(dependencies=[Depends(require_roles(UserRole.ADMIN))])


@router.get("/users")
def users(db: Session = Depends(get_db)):
    return [user_data(user) for user in db.scalars(select(User).order_by(User.id))]


@router.post("/users/{user_id}/approve")
def approve(user_id: int, actor: User = Depends(require_roles(UserRole.ADMIN)), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    user.is_approved = True
    audit(db, actor, "Approved staff account", user.email)
    db.commit()
    return user_data(user)
