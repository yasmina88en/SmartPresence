from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Etudiant, Seance, QRCode, Presence
from app.models.enums import StatutPresence, StatutSeance

def get_etudiant_me(db: Session, etudiant: Etudiant) -> dict:
    row = db.execute(text("""
        SELECT
            e.id, e.nom, e.prenom, e.email,
            f.nom          AS filiere,
            cl.nom         AS niveau,
            g.nom          AS groupe,
            cr.semestre,
            cr.annee_universitaire AS annee
        FROM etudiant e
        JOIN niveau  cl ON cl.id = e.niveau_id
        JOIN filiere  f  ON f.id  = cl.filiere_id
        LEFT JOIN groupe  g  ON g.id  = e.groupe_id
        LEFT JOIN (
            SELECT DISTINCT ON (niveau_id) niveau_id, semestre, annee_universitaire
            FROM creneau
            ORDER BY niveau_id, annee_universitaire DESC, semestre DESC
        ) cr ON cr.niveau_id = e.niveau_id
        WHERE e.id = :id
    """), {"id": etudiant.id}).fetchone()

    if not row:
        return {
            "id": etudiant.id, "nom": etudiant.nom,
            "prenom": etudiant.prenom, "email": etudiant.email,
            "filiere": None, "niveau": None, "groupe": None,
            "semestre": None, "annee": None,
        }

    return {
        "id":      row.id,
        "nom":     row.nom,
        "prenom":  row.prenom,
        "email":   row.email,
        "filiere": row.filiere,
        "niveau":  row.niveau,
        "groupe":  row.groupe,
        "semestre":row.semestre,
        "annee":   row.annee,
    }

def get_seances_etudiant(db: Session, etudiant: Etudiant) -> list[dict]:
    """
    All séances for this student's niveau (+ groupe filter).
    Includes their presence status per séance.
    """
    rows = db.execute(text("""
        SELECT
            s.id,
            s.date,
            s.heure_debut,
            s.heure_fin,
            s.salle,
            s.statut,
            m.nom          AS matiere,
            cg.nature,
            p.nom || ' ' || p.prenom AS prof,
            pr.statut      AS presence,
            pr.id          AS presence_id
        FROM seance s
JOIN matiere        m  ON m.id   = s.matiere_id
LEFT JOIN creneau_groupe cg ON cg.id = s.creneau_groupe_id
LEFT JOIN prof      p  ON p.id   = COALESCE(cg.prof_id, s.prof_id)
        LEFT JOIN presence  pr ON pr.seance_id   = s.id
                               AND pr.etudiant_id = :etudiant_id
        WHERE s.niveau_id = :niveau_id
          AND (s.groupe_id IS NULL OR s.groupe_id = :groupe_id)
        ORDER BY s.date DESC, s.heure_debut DESC
    """), {
        "etudiant_id": etudiant.id,
        "niveau_id":   etudiant.niveau_id,
        "groupe_id":   etudiant.groupe_id,
    }).fetchall()

    return [
        {
            "id":          r.id,
            "date":        r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date),
            "heure_debut": str(r.heure_debut)[:5],
            "heure_fin":   str(r.heure_fin)[:5],
            "salle":       r.salle,
            "statut":      r.statut,
            "matiere":     r.matiere,
            "nature":      r.nature,
            "prof":        r.prof,
            "presence":    r.presence,   # "PRESENT" | "ABSENT" | None
        }
        for r in rows
    ]


def scan_qrcode(db: Session, etudiant: Etudiant, token: str, localisation: str | None) -> dict:
    """Validate QR token and mark presence."""

    # 1. Find QR code
    qr = db.query(QRCode).filter(QRCode.token == token).first()
    if not qr:
        raise HTTPException(status_code=404, detail="QR code invalide")

    now = datetime.now(timezone.utc)

    # 2. Check expiration (handle string vs datetime)
    expiration = qr.expiration
    if isinstance(expiration, str):
        expiration = datetime.fromisoformat(expiration.replace('Z', '+00:00'))
    
    if expiration < now:
        raise HTTPException(status_code=400, detail="QR code expiré")

    # 3. Load séance
    seance = db.query(Seance).filter(Seance.id == qr.seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Séance introuvable")

    # 4. Séance must be ACTIVE
    if seance.statut != StatutSeance.ACTIVE:
        raise HTTPException(status_code=400, detail="La séance n'est pas en cours")

    # 5. Student must belong to the niveau
    if seance.niveau_id != etudiant.niveau_id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas dans ce niveau")

    # 6. Groupe check (if séance is groupe-specific)
    if seance.groupe_id and seance.groupe_id != etudiant.groupe_id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas dans ce groupe")

    # 7. Already marked?
    existing = db.query(Presence).filter(
        Presence.etudiant_id == etudiant.id,
        Presence.seance_id   == seance.id,
    ).first()

    if existing:
        if existing.statut == StatutPresence.PRESENT:
             raise HTTPException(status_code=409, detail="Présence déjà enregistrée")
        
        # Was ABSENT → update to PRESENT
        existing.statut       = StatutPresence.PRESENT
        existing.date_scan    = now.isoformat()
        existing.localisation = localisation
        existing.qrcode_id    = qr.id
        db.commit()
    else:
        presence = Presence(
            statut       = StatutPresence.PRESENT,
            date_scan    = now.isoformat(),
            localisation = localisation,
            etudiant_id  = etudiant.id,
            seance_id    = seance.id,
            qrcode_id    = qr.id,
        )
        db.add(presence)
        db.commit()

    return {
        "success": True,
        "message": "Présence enregistrée ✓",
        "matiere": seance.creneau_groupe.matiere.nom if seance.creneau_groupe else "Séance",
        "heure":   str(seance.heure_debut)[:5],
    }