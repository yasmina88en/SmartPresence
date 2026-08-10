# backend/app/routes/etudiant/enrollment.py
import cv2
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routes.admin.auth_routes import require_etudiant, get_current_user
from app.models.face_enrollment import FaceEnrollment
from app.services.facial_service import app_face
from app.services.facial_validation_service import validate_face_capture

router = APIRouter(prefix="/etudiant", tags=["Etudiant - Enrollment"])

POSITIONS_VALIDES = ["face", "droite", "gauche", "haut", "bas"]


@router.post("/enroll/{position}")
async def enroll_face(
    position: str,
    photos: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    etudiant = Depends(require_etudiant)
):
    if position not in POSITIONS_VALIDES:
        raise HTTPException(400, f"Position invalide. Valeurs acceptées : {POSITIONS_VALIDES}")

    all_embeddings = []
    
    for photo in photos:
        img_bytes = await photo.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            continue

        # Validation de la position
        validation = validate_face_capture(img, position)
        if validation["valid"]:
            all_embeddings.append(validation["embedding"])

    if len(all_embeddings) < 1:
        raise HTTPException(400, "Aucune des images n'est valide pour cette position")

    # 1. Calculer la moyenne des vecteurs (Embedding Averaging)
    vec_sum = np.mean(all_embeddings, axis=0)
    
    # 2. RENORMALISATION L2 (Crucial pour la comparaison cosinus en classe)
    # Sans cette étape, la similarité calculée par la caméra de classe sera faussée.
    norm = np.linalg.norm(vec_sum)
    if norm > 1e-6:
        mean_embedding = (vec_sum / norm).tolist()
    else:
        mean_embedding = vec_sum.tolist()

    existing = db.query(FaceEnrollment).filter(
        FaceEnrollment.etudiant_id == int(etudiant["sub"]),
        FaceEnrollment.position == position
    ).first()

    if existing:
        existing.embedding = mean_embedding
    else:
        enrollment = FaceEnrollment(
            etudiant_id = int(etudiant["sub"]),
            position    = position,
            embedding   = mean_embedding
        )
        db.add(enrollment)
    db.commit()

    # vérifier combien de positions sont complètes
    all_pos = db.query(FaceEnrollment).filter(
        FaceEnrollment.etudiant_id == int(etudiant["sub"])
    ).all()
    total = len(all_pos)

    # SI ENRÔLEMENT COMPLET : Générer le Vecteur Maître (Global Profile)
    if total == 5:
        # On calcule la moyenne de tous les embeddings enregistrés
        embeddings_list = [np.array(e.embedding) for e in all_pos]
        global_centroid = np.mean(embeddings_list, axis=0)
        # Normalisation L2 finale
        norm = np.linalg.norm(global_centroid)
        if norm > 1e-6:
            global_centroid = (global_centroid / norm).tolist()
        
        # On peut soit créer une position spéciale "global" soit mettre à jour un champ sur l'étudiant
        # Ici on utilise une position "global" pour ne pas changer le schéma de la DB
        existing_global = db.query(FaceEnrollment).filter(
            FaceEnrollment.etudiant_id == int(etudiant["sub"]),
            FaceEnrollment.position == "global"
        ).first()
        
        if existing_global:
            existing_global.embedding = global_centroid
        else:
            db.add(FaceEnrollment(
                etudiant_id = int(etudiant["sub"]),
                position    = "global",
                embedding   = global_centroid
            ))
        db.commit()

    return {
        "message":             f"Position '{position}' enregistrée",
        "positions_completes": total,
        "positions_restantes": 5 - total,
        "enrollment_complet":  total == 5
    }


@router.get("/enroll/status")
def enrollment_status(
    db: Session = Depends(get_db),
    etudiant = Depends(require_etudiant)
):
    """Retourne quelles positions sont déjà enregistrées."""
    enrollments = db.query(FaceEnrollment).filter(
        FaceEnrollment.etudiant_id == int(etudiant["sub"]),
        FaceEnrollment.position != "global"
    ).all()

    positions_faites = [e.position for e in enrollments]
    positions_manquantes = [p for p in POSITIONS_VALIDES if p not in positions_faites]

    return {
        "positions_faites":    positions_faites,
        "positions_manquantes": positions_manquantes,
        "enrollment_complet":  len(positions_faites) == 5
    }

@router.delete("/enroll/reset")
def reset_enrollment(
    db: Session = Depends(get_db),
    etudiant = Depends(require_etudiant)
):
    """Supprime toutes les positions enregistrées pour l'étudiant."""
    db.query(FaceEnrollment).filter(
        FaceEnrollment.etudiant_id == int(etudiant["sub"])
    ).delete()
    db.commit()
    return {"message": "Enrôlement réinitialisé"}

@router.post("/enroll/verify/")
async def verify_face_id(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    etudiant: dict = Depends(get_current_user)
):
    """Compare une photo en temps réel avec le profil global de l'étudiant."""
    # 1. Extraire l'embedding de la nouvelle photo
    contents = await photo.read()
    
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Utiliser InsightFace pour l'extraction
    faces = app_face.get(img)
    
    if not faces:
        raise HTTPException(status_code=400, detail="Aucun visage détecté. Assurez-vous d'être bien visible.")
    
    face = faces[0]
    # Normalisation L2 manuelle pour garantir la précision
    emb = face.embedding.astype(np.float32)
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm
        
    current_embedding = emb
    print("[VERIFY] Embedding extrait avec succès")

    # 2. Récupérer le profil global en base
    enrollment = db.query(FaceEnrollment).filter(
        FaceEnrollment.etudiant_id == int(etudiant["sub"]),
        FaceEnrollment.position == "global"
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Profil global non trouvé. Terminez l'enrôlement d'abord.")

    stored_embedding = np.array(enrollment.embedding)

    # 3. Calculer la similarité cosinus (Produit scalaire puisque normalisés L2)
    similarity = np.dot(current_embedding, stored_embedding)
    
    # Conversion en pourcentage pour l'utilisateur
    score_pct = float(similarity * 100)
    
    status = "EXCELLENT" if score_pct > 70 else "BON" if score_pct > 55 else "MOYEN"
    message = f"Match à {score_pct:.1f}% ({status})"

    return {
        "success":    score_pct > 55, # Seuil de sécurité minimum pour un match
        "score":      score_pct,
        "message":    message,
        "status":     status
    }
