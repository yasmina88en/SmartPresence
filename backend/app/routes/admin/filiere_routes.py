# routes/filiere.py
import os
import re
import shutil
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.models.filiere import Filiere
from app.schemas.filiere_schema import FiliereCreate

router = APIRouter(prefix="/filieres", tags=["Filieres"])

UPLOAD_DIR = "emplois"


# =========================
# 🗂️ HELPER — dossier emploi
# =========================
def delete_emploi_folder(niveau_id: int, nom: str):
    safe_nom = re.sub(r'[^a-zA-Z0-9_]', '_', nom)
    folder_name = f"{niveau_id}_{safe_nom}"
    folder_path = os.path.join(UPLOAD_DIR, folder_name)
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)


# =========================
# CREATE
# =========================
@router.post("/")
def create_filiere(filiere: FiliereCreate, db: Session = Depends(get_db)):
    new_filiere = Filiere(nom=filiere.nom)
    db.add(new_filiere)
    db.commit()
    db.refresh(new_filiere)
    return new_filiere


# =========================
# READ ALL
# =========================
@router.get("/")
def get_filieres(db: Session = Depends(get_db)):
    return db.query(Filiere).all()


# =========================
# UPDATE
# =========================
@router.put("/{id}")
def update_filiere(id: int, filiere: FiliereCreate, db: Session = Depends(get_db)):
    f = db.query(Filiere).filter(Filiere.id == id).first()
    if not f:
        return {"error": "Filiere not found"}
    f.nom = filiere.nom
    db.commit()
    return f


# =========================
# DELETE
# =========================
@router.delete("/{id}")
def delete_filiere(id: int, db: Session = Depends(get_db)):
    f = db.query(Filiere).filter(Filiere.id == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Filière introuvable")

    # Récupérer toutes les niveaux AVANT suppression (pour les dossiers)
    niveaux = db.execute(
        text("SELECT id, nom FROM niveau WHERE filiere_id = :fid"),
        {"fid": id}
    ).fetchall()

    # 1. Présences
    db.execute(text("""
        DELETE FROM presence
        WHERE seance_id IN (
            SELECT s.id FROM seance s
            JOIN niveau c ON c.id = s.niveau_id
            WHERE c.filiere_id = :fid
        )
    """), {"fid": id})

    # 2. QRCodes
    db.execute(text("""
        DELETE FROM qrcode
        WHERE seance_id IN (
            SELECT s.id FROM seance s
            JOIN niveau c ON c.id = s.niveau_id
            WHERE c.filiere_id = :fid
        )
    """), {"fid": id})

    # 3. Séances
    db.execute(text("""
        DELETE FROM seance
        WHERE niveau_id IN (
            SELECT id FROM niveau WHERE filiere_id = :fid
        )
    """), {"fid": id})

    # 4. Creneau_groupe
    db.execute(text("""
        DELETE FROM creneau_groupe
        WHERE creneau_id IN (
            SELECT cr.id FROM creneau cr
            JOIN niveau c ON c.id = cr.niveau_id
            WHERE c.filiere_id = :fid
        )
    """), {"fid": id})

    # 5. Créneaux
    db.execute(text("""
        DELETE FROM creneau
        WHERE niveau_id IN (
            SELECT id FROM niveau WHERE filiere_id = :fid
        )
    """), {"fid": id})

    # 6. Étudiants
    db.execute(text("""
        DELETE FROM etudiant
        WHERE niveau_id IN (
            SELECT id FROM niveau WHERE filiere_id = :fid
        )
    """), {"fid": id})

    # 7. Groupes
    db.execute(text("""
        DELETE FROM groupe
        WHERE niveau_id IN (
            SELECT id FROM niveau WHERE filiere_id = :fid
        )
    """), {"fid": id})

    # 8. Niveaux
    db.execute(text("DELETE FROM niveau WHERE filiere_id = :fid"), {"fid": id})

    # 9. Filière
    db.execute(text("DELETE FROM filiere WHERE id = :fid"), {"fid": id})

    db.commit()

    # 10. Supprimer les dossiers emploi de chaque niveau
    for niveau_id, nom in niveaux:
        delete_emploi_folder(niveau_id, nom)

    return {"message": "Filière et toutes ses données supprimées avec succès"}