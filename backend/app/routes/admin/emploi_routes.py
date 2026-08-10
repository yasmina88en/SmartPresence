import os
import re
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import shutil

from datetime import datetime
from app.db.session import get_db
from app.services.emploi_service import parse_and_save

router = APIRouter()

UPLOAD_DIR = "emplois"

@router.get("/ping")
def ping():
    return {"message": "pong", "status": "active", "version": "1.1"}


# =========================
# 🔎 NIVEAU
# =========================
def get_niveau_nom(niveau_id: int, db: Session):
    result = db.execute(
        text("SELECT nom FROM niveau WHERE id = :id"),
        {"id": niveau_id}
    ).fetchone()

    return result[0] if result else None


# =========================
# 📤 UPLOAD EXCEL
# =========================
@router.post("/upload-emploi/{niveau_id}")
async def upload_emploi(
    niveau_id: int,
    file: UploadFile = File(...),
    semestre: str = "S1",
    annee: str = "2025-2026",
    db: Session = Depends(get_db)
):
    nom = get_niveau_nom(niveau_id, db)
    if not nom:
        return {"error": "Niveau introuvable"}

    safe_nom = re.sub(r'[^a-zA-Z0-9_]', '_', nom)
    folder_name = f"{niveau_id}_{safe_nom}"
    folder_path = os.path.join(UPLOAD_DIR, folder_name)

    try:
        # 1. Détacher les séances existantes de l'ancien emploi du temps (pour garder l'historique)
        db.execute(text("""
            UPDATE seance 
            SET creneau_groupe_id = NULL 
            WHERE niveau_id = :cid
        """), {"cid": niveau_id})
        
        # 2. Supprimer uniquement le planning (créneaux)
        db.execute(text("""
            DELETE FROM creneau_groupe
            WHERE creneau_id IN (
                SELECT id FROM creneau WHERE niveau_id = :cid
            )
        """), {"cid": niveau_id})

        db.execute(text("DELETE FROM creneau WHERE niveau_id = :cid"), {"cid": niveau_id})
        
        db.commit()

        os.makedirs(folder_path, exist_ok=True)

        safe_annee = annee.replace("-", "_")
        file_path = os.path.join(
            folder_path,
            f"emploi_du_temps_{semestre}_{safe_annee}_{safe_nom}.xlsx"
        )

        with open(file_path, "wb") as f:
            f.write(await file.read())

        parse_and_save(file_path, db, niveau_id)
        return {"message": "OK", "path": file_path}
    except Exception as e:
        db.rollback()
        import traceback
        with open("error_log.txt", "a") as log_file:
            log_file.write(f"\n[{datetime.now()}] ERROR: {str(e)}\n")
            log_file.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# 📥 GET FICHIER
# =========================
@router.get("/emploi-file/{niveau_id}")
def get_file(niveau_id: int, db: Session = Depends(get_db)):

    nom = get_niveau_nom(niveau_id, db)

    if not nom:
        return {"url": None}

    # On vérifie d'abord si on a des données en base pour ce niveau
    count = db.execute(
        text("SELECT COUNT(*) FROM creneau WHERE niveau_id = :id"),
        {"id": niveau_id}
    ).scalar()

    if not count or count == 0:
        return {"url": None}

    safe_nom = re.sub(r'[^a-zA-Z0-9_]', '_', nom)
    folder_name = f"{niveau_id}_{safe_nom}"
    folder_path = os.path.join(UPLOAD_DIR, folder_name)

    if not os.path.exists(folder_path):
        return {"url": None}

    files = [f for f in os.listdir(folder_path) if f.endswith('.xlsx')]

    if not files:
        return {"url": None}

    filename = files[0]

    return {
        "url": f"/app/emplois/{folder_name}/{filename}"
    }



# =========================
# 🗑️ DELETE EMPLOI
# =========================
@router.delete("/emploi/{niveau_id}")
def delete_emploi(niveau_id: int, db: Session = Depends(get_db)):
    nom = get_niveau_nom(niveau_id, db)

    if not nom :
        raise HTTPException(status_code=404, detail="Niveau introuvable")

    safe_nom = re.sub(r'[^a-zA-Z0-9_]', '_', nom)
    folder_name = f"{niveau_id}_{safe_nom}"
    folder_path = os.path.join(UPLOAD_DIR, folder_name)

    try:
        # 1. Détacher les séances existantes (pour garder l'historique des présences)
        db.execute(text("""
            UPDATE seance 
            SET creneau_groupe_id = NULL 
            WHERE niveau_id = :cid
        """), {"cid": niveau_id})
        
        # 2. Supprimer uniquement le planning (créneaux)
        db.execute(text("""
            DELETE FROM creneau_groupe
            WHERE creneau_id IN (
                SELECT id FROM creneau WHERE niveau_id = :cid
            )
        """), {"cid": niveau_id})

        # 3. Supprimer les créneaux
        db.execute(text("DELETE FROM creneau WHERE niveau_id = :cid"), {"cid": niveau_id})

        db.commit()

        # 4. Supprimer le dossier physique
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path, ignore_errors=True)

        return {"message": "Emploi du temps supprimé avec succès"}
    except Exception as e:
        db.rollback()
        import traceback
        with open("error_log.txt", "a") as log_file:
            log_file.write(f"\n[{datetime.now()}] DELETE ERROR: {str(e)}\n")
            log_file.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))