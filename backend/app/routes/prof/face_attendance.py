"""
routes/prof/face_attendance.py
Endpoint de reconnaissance faciale en temps réel pour les profs.
À ajouter dans app/routes/prof/
"""
import cv2
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.db.session import get_db
from app.routes.admin.auth_routes import require_prof
from app.models.face_enrollment import FaceEnrollment
from app.models.etudiant import Etudiant
from app.models.seance import Seance
from app.models.presence import Presence
from app.models.enums import StatutPresence, StatutSeance
from app.services.facial_service import app_face

router = APIRouter(prefix="/prof", tags=["Prof - Face Attendance"])

# Seuil de similarité cosinus pour valider un match
SIMILARITY_THRESHOLD = 0.45


@router.post("/seance/{seance_id}/face-scan")
async def face_scan_attendance(
    seance_id: int,
    frame: UploadFile = File(...),
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """
    Reçoit un frame vidéo du PC du prof, détecte tous les visages,
    compare avec la base d'embeddings et marque les étudiants présents.
    Retourne la liste des étudiants reconnus dans ce frame.
    """
    prof_id = int(payload.get("sub"))

    # 1. Vérifier que la séance existe et est ACTIVE
    seance = db.query(Seance).filter(
        Seance.id == seance_id,
        Seance.prof_id == prof_id,
        Seance.statut == StatutSeance.ACTIVE
    ).first()

    if not seance:
        raise HTTPException(
            status_code=404,
            detail="Séance introuvable ou non active"
        )

    # 2. Lire et décoder l'image
    contents = await frame.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Image invalide")

    # 3. Détecter tous les visages dans le frame
    faces = app_face.get(img)

    if not faces:
        return {
            "recognized": [],
            "face_count": 0,
            "message": "Aucun visage détecté"
        }

    # 4. Récupérer tous les embeddings "global" des étudiants de ce niveau
    niveau_id = seance.niveau_id
    groupe_id = seance.groupe_id

    # Requête des étudiants du niveau (et groupe si applicable)
    query = db.query(Etudiant).filter(Etudiant.niveau_id == niveau_id)
    if groupe_id:
        query = query.filter(Etudiant.groupe_id == groupe_id)
    etudiants = query.all()

    etudiant_ids = [e.id for e in etudiants]
    etudiant_map = {e.id: e for e in etudiants}

    # Récupérer les embeddings globaux
    enrollments = db.query(FaceEnrollment).filter(
        FaceEnrollment.etudiant_id.in_(etudiant_ids),
        FaceEnrollment.position == "global"
    ).all()

    if not enrollments:
        return {
            "recognized": [],
            "face_count": len(faces),
            "message": "Aucun étudiant enrôlé dans ce niveau"
        }

    # Préparer les embeddings stockés
    stored_embeddings = []
    for enrollment in enrollments:
        emb = np.array(enrollment.embedding, dtype=np.float32)
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        stored_embeddings.append((enrollment.etudiant_id, emb))

    # 5. Pour chaque visage détecté, chercher le meilleur match
    now = datetime.now(timezone.utc)
    recognized = []
    already_present = set()

    for face in faces:
        # Extraire et normaliser l'embedding du visage détecté
        face_emb = face.embedding.astype(np.float32)
        norm = np.linalg.norm(face_emb)
        if norm > 0:
            face_emb = face_emb / norm

        # Calculer la similarité avec tous les étudiants enrôlés
        best_score = -1
        best_etudiant_id = None

        for etudiant_id, stored_emb in stored_embeddings:
            similarity = float(np.dot(face_emb, stored_emb))
            if similarity > best_score:
                best_score = similarity
                best_etudiant_id = etudiant_id

        # Si le score dépasse le seuil, c'est un match
        if best_score >= SIMILARITY_THRESHOLD and best_etudiant_id:
            if best_etudiant_id in already_present:
                continue
            already_present.add(best_etudiant_id)

            etudiant = etudiant_map.get(best_etudiant_id)
            if not etudiant:
                continue

            # 6. Marquer la présence
            existing = db.query(Presence).filter(
                Presence.etudiant_id == best_etudiant_id,
                Presence.seance_id == seance_id
            ).first()

            status_action = "already_present"

            if existing:
                if existing.statut != StatutPresence.PRESENT:
                    existing.statut = StatutPresence.PRESENT
                    existing.date_scan = now.isoformat()
                    existing.localisation = "Reconnaissance faciale"
                    db.commit()
                    status_action = "marked_present"
            else:
                presence = Presence(
                    statut=StatutPresence.PRESENT,
                    date_scan=now.isoformat(),
                    localisation="Reconnaissance faciale",
                    etudiant_id=best_etudiant_id,
                    seance_id=seance_id,
                    qrcode_id=None
                )
                db.add(presence)
                db.commit()
                status_action = "marked_present"

            # Extraire la bounding box pour affichage
            bbox = face.bbox.tolist() if hasattr(face, 'bbox') else []

            recognized.append({
                "etudiant_id": best_etudiant_id,
                "nom": etudiant.nom,
                "prenom": etudiant.prenom,
                "score": round(best_score * 100, 1),
                "action": status_action,
                "bbox": bbox,
                "heure_scan": now.isoformat()
            })

    return {
        "recognized": recognized,
        "face_count": len(faces),
        "message": f"{len(recognized)} étudiant(s) reconnu(s) sur {len(faces)} visage(s) détecté(s)"
    }


@router.get("/seance/{seance_id}/face-presences")
def get_face_presences(
    seance_id: int,
    payload: dict = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """
    Retourne la liste complète des présences pour une séance,
    compatible avec la liste QR code (même format).
    """
    prof_id = int(payload.get("sub"))

    seance = db.query(Seance).filter(
        Seance.id == seance_id,
        Seance.prof_id == prof_id
    ).first()

    if not seance:
        raise HTTPException(status_code=404, detail="Séance introuvable")

    etudiants = db.query(Etudiant).filter(
        Etudiant.niveau_id == seance.niveau_id
    ).all()

    presences = db.query(Presence).filter(
        Presence.seance_id == seance_id
    ).all()

    presence_map = {p.etudiant_id: p for p in presences}

    result = []
    for etu in etudiants:
        p = presence_map.get(etu.id)
        result.append({
            "etudiant_id": etu.id,
            "nom": etu.nom,
            "prenom": etu.prenom,
            "statut": p.statut.value if p else "ABSENT",
            "heure_scan": p.date_scan if p else None,
            "methode": "face" if p and p.localisation == "Reconnaissance faciale" else "qr" if p else None
        })

    return result