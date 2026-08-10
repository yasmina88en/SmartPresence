from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.routes.admin.auth_routes import get_current_etudiant
from app.models import Presence

router = APIRouter(prefix="/api/etudiant", tags=["Étudiant Dashboard"])

@router.get("/dash-stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    etudiant = Depends(get_current_etudiant)
):
    total_presence = db.query(Presence).filter(
        Presence.etudiant_id == etudiant.id,
        Presence.statut == "PRESENT"
    ).count()

    total_absence = db.query(Presence).filter(
        Presence.etudiant_id == etudiant.id,
        Presence.statut == "ABSENT"
    ).count()

    return {
        "nom": etudiant.nom,
        "prenom": etudiant.prenom,
        "stats": {
            "presence": total_presence,
            "absence": total_absence
        }
    }