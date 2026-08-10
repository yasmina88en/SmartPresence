from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.session import get_db
from app.models import Etudiant, Seance, QRCode, Presence
from app.routes.admin.auth_routes import get_current_etudiant
from app.services import etudiant_service

router = APIRouter(prefix="/api/etudiant", tags=["Étudiant"])

@router.get("/me")
def me(
    etudiant: Etudiant = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    return etudiant_service.get_etudiant_me(db, etudiant)


@router.get("/seances")
def seances(
    etudiant: Etudiant = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    return etudiant_service.get_seances_etudiant(db, etudiant)


class ScanRequest(BaseModel):
    token: str
    localisation: str | None = None

@router.post("/scanner/{seance_id}")
def scanner_qrcode(
    seance_id: int,
    body:      ScanRequest,
    db:        Session = Depends(get_db),
    etudiant:  Etudiant = Depends(get_current_etudiant)
):
    # Delegate scanning logic to service for consistency
    return etudiant_service.scan_qrcode(db, etudiant, body.token, body.localisation)