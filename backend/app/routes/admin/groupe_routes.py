from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.groupe import Groupe

router = APIRouter(prefix="/groupes", tags=["Groupes"])

@router.get("/niveau/{niveau_id}")
def get_groupes_by_niveau(niveau_id: int, db: Session = Depends(get_db)):
    return db.query(Groupe).filter(Groupe.niveau_id == niveau_id).all()