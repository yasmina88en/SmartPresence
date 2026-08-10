import os
import re
import shutil
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.models.niveau import Niveau
from app.schemas.niveau_schema import NiveauCreate

router = APIRouter(prefix="/niveaux", tags=["Niveaux"])

UPLOAD_DIR = "emplois"


# =========================
# 🗂️ HELPER — dossier emploi
# =========================
def get_emploi_folder(niveau_id: int, nom: str) -> str:
    safe_nom = re.sub(r'[^a-zA-Z0-9_]', '_', nom)
    folder_name = f"{niveau_id}_{safe_nom}"
    return os.path.join(UPLOAD_DIR, folder_name)


def delete_emploi_folder(niveau_id: int, nom: str):
    folder_path = get_emploi_folder(niveau_id, nom)
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)


# =========================
# GET niveaux par filière
# =========================
@router.get("/filieres/{id}")
def get_niveaux_by_filiere(id: int, db: Session = Depends(get_db)):
    return db.query(Niveau).filter(Niveau.filiere_id == id).all()


# =========================
# GET single niveau
# =========================
@router.get("/{id}")
def get_niveau(id: int, db: Session = Depends(get_db)):
    db_niveau = db.query(Niveau).filter(Niveau.id == id).first()
    if not db_niveau:
        return {"error": "not found"}
    return db_niveau


# =========================
# CREATE
# =========================
@router.post("/")
def create_niveau(niveau: NiveauCreate, db: Session = Depends(get_db)):
    new_niveau =Niveau(**niveau.dict())
    db.add(new_niveau)
    db.commit()
    db.refresh(new_niveau)
    return new_niveau


# =========================
# UPDATE
# =========================
@router.put("/{id}")
def update_niveau(id: int, niveau: NiveauCreate, db: Session = Depends(get_db)):
    db_niveau = db.query(Niveau).filter(Niveau.id == id).first()
    if not db_niveau:
        return {"error": "not found"}
    db_niveau.nom = niveau.nom
    db.commit()
    db.refresh(db_niveau)
    return db_niveau


# =========================
# DELETE
# =========================
@router.delete("/{id}")
def delete_niveau(id: int, db: Session = Depends(get_db)):
    db_niveau = db.query(Niveau).filter(Niveau.id == id).first()
    if not db_niveau:
        raise HTTPException(status_code=404, detail="Niveau introuvable")

    nom = db_niveau.nom # récupérer avant suppression

    # 1. Présences
    db.execute(text("""
        DELETE FROM presence
        WHERE seance_id IN (
            SELECT id FROM seance WHERE niveau_id = :cid
        )
    """), {"cid": id})

    # 2. QRCodes
    db.execute(text("""
        DELETE FROM qrcode
        WHERE seance_id IN (
            SELECT id FROM seance WHERE niveau_id = :cid
        )
    """), {"cid": id})

    # 3. Séances
    db.execute(text("DELETE FROM seance WHERE niveau_id = :cid"), {"cid": id})

    # 4. Creneau_groupe
    db.execute(text("""
        DELETE FROM creneau_groupe
        WHERE creneau_id IN (
            SELECT id FROM creneau WHERE niveau_id = :cid
        )
    """), {"cid": id})

    # 5. Créneaux
    db.execute(text("DELETE FROM creneau WHERE niveau_id = :cid"), {"cid": id})

    # 6. Étudiants
    db.execute(text("DELETE FROM etudiant WHERE niveau_id = :cid"), {"cid": id})

    # 7. Groupes
    db.execute(text("DELETE FROM groupe WHERE niveau_id = :cid"), {"cid": id})

    # 8. Niveau
    db.execute(text("DELETE FROM niveau WHERE id = :cid"), {"cid": id})

    db.commit()

    # 9. Supprimer le dossier emploi physique
    delete_emploi_folder(id, nom)

    return {"message": "Niveau et toutes ses données supprimées avec succès"}