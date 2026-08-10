from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.routes.admin.auth_routes import get_current_user, require_prof
from app.services import prof_service
from app.models.seance import Seance
from datetime import datetime

router = APIRouter(prefix="/prof", tags=["Professor"])

@router.get("/sessions")
def get_sessions(
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    return prof_service.get_prof_sessions_today(db, prof_id)

@router.get("/sessions/all")
def get_all_sessions(
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    return prof_service.get_prof_all_sessions(db, prof_id)  

@router.get("/sessions/history")
def get_sessions_history(
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    return prof_service.get_prof_sessions_history(db, prof_id)

@router.post("/sessions/{creneau_groupe_id}/start")
def start_seance(
    creneau_groupe_id: str,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    seance = prof_service.start_seance(db, prof_id, creneau_groupe_id)
    if not seance:
        raise HTTPException(status_code=404, detail="Session non trouvée ou non autorisée")
    return {"id": seance.id, "statut": seance.statut.value}

@router.get("/seance/{seance_id}/qrcode")
def get_qrcode(
    seance_id: int,
    force: bool = False,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    token, count = prof_service.get_or_refresh_qrcode(db, seance_id, prof_id, force)
    # Note: we fetch the seance separately to get the status even if it's not active
    seance = db.query(Seance).filter(Seance.id == seance_id, Seance.prof_id == prof_id).first()
    
    if not seance:
        raise HTTPException(status_code=404, detail="Séance non trouvée")
    
    res = {
        "statut": seance.statut.value,
        "attendance_count": count
    }
    
    if token:
        res.update({
            "token": str(token.token),
            "expiration": token.expiration,
            "seconds_left": max(0, int((datetime.fromisoformat(str(token.expiration)).replace(tzinfo=None) - datetime.now()).total_seconds())),
        })
    
    return res

@router.post("/seance/{seance_id}/end")
def end_seance(
    seance_id: int,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    seance = prof_service.end_seance(db, seance_id, prof_id)
    if not seance:
        raise HTTPException(status_code=404, detail="Séance non trouvée ou non autorisée")
    return {"message": "Séance terminée", "statut": seance.statut.value}

@router.get("/seance/{seance_id}/presences")
def get_presences(
    seance_id: int,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    presences = prof_service.get_seance_presences(db, seance_id, prof_id)
    if presences is None:
        raise HTTPException(status_code=404, detail="Séance non trouvée ou non autorisée")
    return presences

@router.get("/metadata")
def get_metadata(
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    return prof_service.get_prof_metadata(db, prof_id)

@router.post("/seance/manual")
def create_manual_seance(
    data: dict,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    seance = prof_service.create_manual_seance(db, prof_id, data)
    return seance



@router.get("/matiere/{matiere_id}/niveau/{niveau_id}/matrix")
def get_presence_matrix(
    matiere_id: int,
    niveau_id: int,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db)
):
    prof_id = int(payload.get("sub"))
    return prof_service.get_subject_attendance_matrix(db, prof_id, matiere_id, niveau_id)
