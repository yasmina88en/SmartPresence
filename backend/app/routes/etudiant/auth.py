from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schema import LoginRequest, TokenResponse, ChangePasswordRequest as ChangePasswordSchema
from app.routes.admin.auth_routes import get_current_user
from app.services import auth_service

router = APIRouter(prefix="/auth/etudiant", tags=["Auth — Étudiant"])


@router.post("/login", response_model=TokenResponse)
def etudiant_login(body: LoginRequest, db: Session = Depends(get_db)):
    result = auth_service.login(db, body.email, body.password, role_target="etudiant")
    if not result:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    return result


@router.post("/change-password")
def etudiant_change_password(
    body:      ChangePasswordSchema,
    payload =  Depends(get_current_user),
    db:        Session = Depends(get_db),
):
    email = payload.get("email")
    role  = payload.get("role")
    return auth_service.change_password(db, email, role, body.old_password, body.new_password)