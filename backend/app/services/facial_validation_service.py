# services/facial_validation_service.py
import cv2
import numpy as np
from app.services.facial_service import app_face

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTES DE VALIDATION
#
# Ces seuils correspondent à la géométrie réelle d'InsightFace (kps 5 points) :
#   kps[0] = œil gauche   kps[1] = œil droit   kps[2] = nez
#   kps[3] = bouche gauche kps[4] = bouche droite
#
# CONVENTION ANGLES :
#   yaw_ratio  = (nose_x - eye_center_x) / eye_dist
#                positif → nez vers la droite de l'image (étudiant tourne à gauche)
#                négatif → nez vers la gauche de l'image (étudiant tourne à droite)
#
#   pitch_ratio = (nose_y - eye_center_y) / eye_dist
#                 positif → nez sous les yeux (regard normal / vers le haut)
#                 négatif → nez au-dessus des yeux (tête très inclinée vers l'avant)
#
# CAMÉRA EN HAUTEUR (~20-30° au-dessus) :
#   En classe, l'étudiant regarde vers le haut → pitch_ratio naturel ≈ 0.35–0.55
#   On enrôle avec ce même offset pour que les embeddings matchent.
# ─────────────────────────────────────────────────────────────────────────────

# Offset naturel caméra en hauteur (à ajuster après tests réels avec print debug)
PITCH_CAMERA_OFFSET = 0.45   # ratio nose_dy/eye_dist quand on regarde vers la caméra

SEUILS = {
    "face": {
        "yaw_max":         0.25,   # Plus large
        "pitch_min":       0.25,
        "pitch_max":       0.70,
        "center_margin":   0.20,
    },
    "gauche": {
        "yaw_min":         0.20,
        "yaw_max":         0.85,  # Augmenté (était 0.65)
        "pitch_min":       0.15,
        "pitch_max":       0.80,
    },
    "droite": {
        "yaw_min":        -0.85,  # Augmenté (était -0.65)
        "yaw_max":        -0.20,
        "pitch_min":       0.15,
        "pitch_max":       0.80,
    },
    "haut": {
        "yaw_max":         0.30,
        "pitch_min":       0.05,  # Pitch faible = tête levée
        "pitch_max":       0.40,
    },
    "bas": {
        "yaw_max":         0.30,
        "pitch_min":       0.55,  # Pitch élevé = tête baissée
        "pitch_max":       0.95,
    },
}


def validate_face_capture(img: np.ndarray, position_demandee: str) -> dict:
    """
    Valide une image avant de l'accepter pour l'enrollment.
    Retourne : { "valid": bool, "error": str | None, "embedding": list | None, "debug": dict }
    """

    faces = app_face.get(img)

    # ── 1. Un seul visage détecté ─────────────────────────────────────────────
    if len(faces) == 0:
        return _reject("Aucun visage détecté — centrez votre visage")

    if len(faces) > 1:
        return _reject("Plusieurs visages détectés — soyez seul dans le cadre")

    face = faces[0]
    img_h, img_w = img.shape[:2]

    # ── 2. Score de confiance ─────────────────────────────────────────────────
    if face.det_score < 0.60:
        return _reject(f"Visage peu visible (score {face.det_score:.2f}) — améliorez l'éclairage")

    # ── 3. Taille du visage ───────────────────────────────────────────────────
    x1, y1, x2, y2 = face.bbox
    face_width  = x2 - x1
    face_ratio  = face_width / img_w

    if face_ratio < 0.12:
        return _reject("Trop loin — rapprochez-vous de la caméra")

    if face_ratio > 0.85:
        return _reject("Trop proche — éloignez-vous un peu")

    # ── 4. Netteté (Laplacian variance sur la ROI du visage) ─────────────────
    # On teste sur la ROI du visage, pas l'image entière (fond flou = faux négatif)
    y1c = max(0, int(y1))
    y2c = min(img_h, int(y2))
    x1c = max(0, int(x1))
    x2c = min(img_w, int(x2))
    face_roi = img[y1c:y2c, x1c:x2c]

    if face_roi.size > 0:
        gray_roi     = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray_roi, cv2.CV_64F).var()
    else:
        laplacian_var = 999.0  # ne pas bloquer si ROI invalide

    if laplacian_var < 80:
        return _reject("Image floue — tenez votre appareil stable")

    # ── 5. Calcul des ratios de pose (stable, sans arctan2 approximatif) ─────
    kps = face.kps   # shape (5, 2)

    left_eye  = kps[0]
    right_eye = kps[1]
    nose      = kps[2]

    eye_center_x = (left_eye[0] + right_eye[0]) / 2
    eye_center_y = (left_eye[1] + right_eye[1]) / 2

    # Distance inter-oculaire (normalisateur de référence)
    eye_dist = max(right_eye[0] - left_eye[0], 1.0)

    # yaw_ratio : déplacement horizontal du nez / distance inter-oculaire
    yaw_ratio   = (nose[0] - eye_center_x) / eye_dist

    # pitch_ratio : déplacement vertical du nez / distance inter-oculaire
    # (normalisé par eye_dist et NON par nose_dy pour être cohérent avec yaw)
    pitch_ratio = (nose[1] - eye_center_y) / eye_dist

    # ── 6. Validation de la position demandée ────────────────────────────────
    error = _check_position(position_demandee, yaw_ratio, pitch_ratio, eye_center_x, img_w)
    if error:
        return _reject(error, debug=_debug_info(face, face_ratio, laplacian_var, yaw_ratio, pitch_ratio))

    # ── 7. Embedding L2-normalisé ─────────────────────────────────────────────
    # InsightFace retourne déjà un embedding normalisé, mais on renormalise
    # pour être sûr (une interpolation ou resize peut légèrement dériver).
    emb = face.embedding.astype(np.float32)
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm

    return {
        "valid":     True,
        "error":     None,
        "embedding": emb.tolist(),
        "debug":     _debug_info(face, face_ratio, laplacian_var, yaw_ratio, pitch_ratio),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _check_position(position: str, yaw: float, pitch: float, eye_cx: float, img_w: int) -> str | None:
    """
    Retourne un message d'erreur si la pose ne correspond pas à la position attendue,
    ou None si tout est bon.
    """
    s = SEUILS.get(position)
    if s is None:
        return f"Position inconnue : {position}"

    if position == "face":
        if abs(yaw) > s["yaw_max"]:
            return "Regardez bien droit en face"
        if not (s["pitch_min"] <= pitch <= s["pitch_max"]):
            return "Levez légèrement la tête vers la caméra" if pitch < s["pitch_min"] else "Baissez un peu la tête"
        if not (s["center_margin"] <= eye_cx / img_w <= 1 - s["center_margin"]):
            return "Centrez votre visage dans le cadre"

    elif position == "gauche":
        if yaw < s["yaw_min"]:
            return "Tournez davantage à gauche"
        if yaw > s["yaw_max"]:
            return "Vous avez trop tourné à gauche"
        if not (s["pitch_min"] <= pitch <= s["pitch_max"]):
            return "Gardez la tête à hauteur normale"

    elif position == "droite":
        if yaw > s["yaw_max"]:
            return "Tournez davantage à droite"
        if yaw < s["yaw_min"]:
            return "Vous avez trop tourné à droite"
        if not (s["pitch_min"] <= pitch <= s["pitch_max"]):
            return "Gardez la tête à hauteur normale"

    elif position == "haut":
        if abs(yaw) > SEUILS["face"]["yaw_max"] + 0.05:
            return "Regardez vers le haut sans tourner la tête"
        if pitch < s["pitch_min"]:
            return "Levez encore un peu la tête"
        if pitch > s["pitch_max"]:
            return "Ne levez pas autant la tête"

    elif position == "bas":
        if abs(yaw) > SEUILS["face"]["yaw_max"] + 0.05:
            return "Regardez vers le bas sans tourner la tête"
        if pitch > s["pitch_max"]:
            return "Baissez encore un peu la tête"
        if pitch < s["pitch_min"]:
            return "Ne baissez pas autant la tête"

    return None  # position correcte


def _reject(error: str, debug: dict = None) -> dict:
    return {"valid": False, "error": error, "embedding": None, "debug": debug or {}}


def _debug_info(face, face_ratio: float, lap_var: float, yaw: float, pitch: float) -> dict:
    return {
        "det_score":   float(face.det_score),
        "face_ratio":  round(float(face_ratio), 3),
        "laplacian":   round(float(lap_var), 1),
        "yaw_ratio":   round(float(yaw), 3),
        "pitch_ratio": round(float(pitch), 3),
    }