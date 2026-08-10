from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.creneau import Creneau
from app.models.creneau_group import CreneauGroupe
from app.models.seance import Seance
from app.models.qrcode import QRCode
from app.models.presence import Presence
from app.models.enums import JourSemaine, StatutSeance
from app.models.filiere import Filiere
from app.models.niveau import Niveau
from app.models.matiere import Matiere
from app.models.etudiant import Etudiant
import uuid
from fastapi import HTTPException


JOURS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]


def jour_to_str(jour) -> str:
    """Convertit un Enum JourSemaine ou une string en string."""
    if hasattr(jour, 'value'):
        return jour.value
    return str(jour)


def get_next_date_for_jour(jour) -> object:
    """Retourne la prochaine date correspondant au jour donné (y compris aujourd'hui)."""
    jour_str = jour_to_str(jour)
    today = datetime.now().date()
    today_idx = today.weekday()
    if jour_str not in JOURS:
        return today
    target_idx = JOURS.index(jour_str)
    days_ahead = (target_idx - today_idx) % 7
    return today + timedelta(days=days_ahead)


def _auto_close_expired_sessions(db: Session, prof_id: int):
    """Ferme automatiquement les séances actives dont l'heure de fin est dépassée."""
    now_dt = datetime.now()
    today = now_dt.date()
    current_time = now_dt.time()

    expired_seances = db.query(Seance).filter(
        Seance.prof_id == prof_id,
        Seance.statut == StatutSeance.ACTIVE,
        Seance.date <= today
    ).all()

    updated = False
    for s in expired_seances:
        # Si c'était hier ou plus tôt, ou si c'est aujourd'hui et l'heure est passée
        if s.date < today or (s.date == today and current_time > s.heure_fin):
            s.statut = StatutSeance.TERMINEE
            updated = True
    
    if updated:
        db.commit()


def get_prof_sessions_today(db: Session, prof_id: int):
    _auto_close_expired_sessions(db, prof_id)
    today = datetime.now().date()
    today_name = JOURS[today.weekday()]

    if today_name == "DIMANCHE":
        return []

    creneaux = db.query(CreneauGroupe, Creneau, Niveau, Matiere)\
        .join(Creneau, CreneauGroupe.creneau_id == Creneau.id)\
        .join(Niveau, Creneau.niveau_id == Niveau.id)\
        .join(Matiere, CreneauGroupe.matiere_id == Matiere.id)\
        .filter(CreneauGroupe.prof_id == prof_id, Creneau.jour == today_name)\
        .distinct(CreneauGroupe.id)\
        .all()

    result = []
    for cg, cr, cl, mat in creneaux:
        seance = db.query(Seance).filter(
            Seance.creneau_groupe_id == cg.id,
            Seance.date == today
        ).first()

        result.append({
            "id": cg.id,
            "matiere": mat.nom,
            "matiere_id": mat.id,
            "niveau": cl.nom,
            "niveau_id": cl.id,
            "heure_debut": cr.heure_debut.strftime("%H:%M"),
            "heure_fin": cr.heure_fin.strftime("%H:%M"),
            "salle": cg.salle,
            "nature": cg.nature.value,
            "date": today.isoformat(),
            "jour": today_name,
            "seance_id": seance.id if seance else None,
            "statut": seance.statut.value if seance else "PLANIFIEE"
        })

    manual_sessions = db.query(Seance, Niveau, Matiere)\
        .join(Niveau, Seance.niveau_id == Niveau.id)\
        .join(Matiere, Seance.matiere_id == Matiere.id)\
        .filter(
            Seance.prof_id == prof_id,
            Seance.date == today,
            Seance.creneau_groupe_id == None
        ).all()

    for seance, cl, mat in manual_sessions:
        result.append({
            "id": f"manual_{seance.id}",
            "matiere": mat.nom,
            "matiere_id": mat.id,
            "niveau": cl.nom,
            "niveau_id": cl.id,
            "heure_debut": seance.heure_debut.strftime("%H:%M"),
            "heure_fin": seance.heure_fin.strftime("%H:%M"),
            "salle": seance.salle,
            "nature": "Hors Planning",
            "date": seance.date.isoformat(),
            "jour": today_name,
            "seance_id": seance.id,
            "statut": seance.statut.value
        })

    result.sort(key=lambda s: s["heure_debut"])
    return result


def get_prof_all_sessions(db: Session, prof_id: int):
    _auto_close_expired_sessions(db, prof_id)
    today = datetime.now().date()

    creneaux = db.query(CreneauGroupe, Creneau,Niveau, Matiere)\
        .join(Creneau, CreneauGroupe.creneau_id == Creneau.id)\
        .join(Niveau, Creneau.niveau_id == Niveau.id)\
        .join(Matiere, CreneauGroupe.matiere_id == Matiere.id)\
        .filter(CreneauGroupe.prof_id == prof_id)\
        .distinct(CreneauGroupe.id)\
        .all()

    result = []
    for cg, cr, cl, mat in creneaux:
        jour_str = jour_to_str(cr.jour)
        next_date = get_next_date_for_jour(cr.jour)

        seance = db.query(Seance).filter(
            Seance.creneau_groupe_id == cg.id,
            Seance.date == next_date
        ).first()

        statut = seance.statut.value if seance else "PLANIFIEE"
        seance_id = seance.id if seance else None

        result.append({
            "id": cg.id,
            "matiere": mat.nom,
            "matiere_id": mat.id,
            "niveau": cl.nom,
            "niveau_id": cl.id,
            "jour": jour_str,
            "date": next_date.isoformat(),
            "heure_debut": cr.heure_debut.strftime("%H:%M"),
            "heure_fin": cr.heure_fin.strftime("%H:%M"),
            "salle": cg.salle,
            "nature": cg.nature.value,
            "statut": statut,
            "seance_id": seance_id,
        })

    manual_sessions = db.query(Seance, Niveau, Matiere)\
        .join(Niveau, Seance.niveau_id == Niveau.id)\
        .join(Matiere, Seance.matiere_id == Matiere.id)\
        .filter(
            Seance.prof_id == prof_id,
            Seance.creneau_groupe_id == None,
            Seance.date >= today
        ).all()

    for seance, cl, mat in manual_sessions:
        result.append({
            "id": f"manual_{seance.id}",
            "matiere": mat.nom,
            "matiere_id": mat.id,
            "niveau": cl.nom,
            "niveau_id": cl.id,
            "jour": JOURS[seance.date.weekday()],
            "date": seance.date.isoformat(),
            "heure_debut": seance.heure_debut.strftime("%H:%M"),
            "heure_fin": seance.heure_fin.strftime("%H:%M"),
            "salle": seance.salle,
            "nature": "Hors Planning",
            "statut": seance.statut.value,
            "seance_id": seance.id,
        })

    result.sort(key=lambda s: (
        JOURS.index(s["jour"]) if s["jour"] in JOURS else 99,
        s["heure_debut"]
    ))
    return result


def get_prof_sessions_history(db: Session, prof_id: int):
    seances = db.query(Seance, Niveau, Matiere)\
        .join(Niveau, Seance.niveau_id == Niveau.id)\
        .join(Matiere, Seance.matiere_id == Matiere.id)\
        .filter(
            Seance.prof_id == prof_id,
            func.extract('dow', Seance.date) != 0
        )\
        .order_by(Seance.date.desc(), Seance.heure_debut.desc())\
        .all()

    result = []
    for seance, cl, mat in seances:
        result.append({
            "id": f"manual_{seance.id}",
            "matiere": mat.nom,
            "matiere_id": mat.id,
            "niveau": cl.nom,
            "niveau_id": cl.id,
            "heure_debut": seance.heure_debut.strftime("%H:%M"),
            "heure_fin": seance.heure_fin.strftime("%H:%M"),
            "salle": seance.salle,
            "date": seance.date.isoformat(),
            "jour": JOURS[seance.date.weekday()],
            "statut": seance.statut.value,
            "seance_id": seance.id,
            "nature": "Hors Planning" if seance.creneau_groupe_id is None else "Cours"
        })

    return result


def start_seance(db: Session, prof_id: int, identifier: str):
    if str(identifier).startswith("manual_"):
        seance_id = int(identifier.split("_")[1])
        seance = db.query(Seance).filter(
            Seance.id == seance_id,
            Seance.prof_id == prof_id
        ).first()
        if not seance:
            return None
        if seance.statut == StatutSeance.TERMINEE:
            raise HTTPException(status_code=400, detail="Cette séance a déjà été clôturée.")
        seance.statut = StatutSeance.ACTIVE
        db.commit()
        db.refresh(seance)
        return seance

    try:
        creneau_groupe_id = int(identifier)
    except (ValueError, TypeError):
        return None

    cg = db.query(CreneauGroupe).filter(
        CreneauGroupe.id == creneau_groupe_id,
        CreneauGroupe.prof_id == prof_id
    ).first()
    if not cg:
        return None

    today = datetime.now().date()
    seance = db.query(Seance).filter(
        Seance.creneau_groupe_id == cg.id,
        Seance.date == today
    ).first()

    if seance:
        if seance.statut == StatutSeance.TERMINEE:
            raise HTTPException(status_code=400, detail="Cette séance a déjà été clôturée.")
        
        # Vérification si l'heure est déjà passée
        if seance.date == today and datetime.now().time() > seance.heure_fin:
            seance.statut = StatutSeance.TERMINEE
            db.commit()
            raise HTTPException(status_code=400, detail="L'heure de fin de cette séance est déjà passée.")

        if seance.statut == StatutSeance.PLANIFIEE:
            seance.statut = StatutSeance.ACTIVE
            db.commit()
            db.refresh(seance)
        return seance

    cr = db.query(Creneau).get(cg.creneau_id)
    
    # Vérification si l'heure est déjà passée pour un nouveau lancement
    if datetime.now().time() > cr.heure_fin:
        raise HTTPException(status_code=400, detail="Impossible de lancer une séance dont l'heure de fin est déjà passée.")
    seance = Seance(
        date=today,
        heure_debut=cr.heure_debut,
        heure_fin=cr.heure_fin,
        salle=cg.salle,
        statut=StatutSeance.ACTIVE,
        creneau_groupe_id=cg.id,
        prof_id=prof_id,
        niveau_id=cr.niveau_id,
        matiere_id=cg.matiere_id,
        groupe_id=cg.groupe_id
    )
    db.add(seance)
    db.commit()
    db.refresh(seance)
    return seance


def get_seance_stats(db: Session, seance_id: int):
    count = db.query(func.count(Presence.id)).filter(
        Presence.seance_id == seance_id
    ).scalar()
    return {"attendance_count": count or 0}


def get_or_refresh_qrcode(db: Session, seance_id: int, prof_id: int, force: bool = False):
    seance = db.query(Seance).filter(
        Seance.id == seance_id,
        Seance.prof_id == prof_id
    ).first()
    if not seance or seance.statut != StatutSeance.ACTIVE:
        return None, 0

    now = datetime.now()
    if seance.date != now.date() or now.time() > seance.heure_fin:
        seance.statut = StatutSeance.TERMINEE
        db.commit()
        return None, 0

    now = datetime.now()
    qr = db.query(QRCode).filter(
        QRCode.seance_id == seance_id,
        QRCode.expiration > now.isoformat()
    ).order_by(QRCode.id.desc()).first()

    should_refresh = not qr or force
    if qr and not force:
        expire_dt = datetime.fromisoformat(str(qr.expiration)).replace(tzinfo=None)
        if (expire_dt - now).total_seconds() < 5:
            should_refresh = True

    if should_refresh:
        expiration_time = now + timedelta(seconds=120)
        qr = QRCode(
            token=uuid.uuid4(),
            date_generation=now.isoformat(),
            expiration=expiration_time.isoformat(),
            seance_id=seance_id
        )
        db.add(qr)
        db.commit()
        db.refresh(qr)

    attendance = get_seance_stats(db, seance_id)
    return qr, attendance["attendance_count"]


def end_seance(db: Session, seance_id: int, prof_id: int):
    seance = db.query(Seance).filter(
        Seance.id == seance_id,
        Seance.prof_id == prof_id
    ).first()
    if not seance:
        return None
    seance.statut = StatutSeance.TERMINEE
    db.commit()
    db.refresh(seance)
    return seance


def get_prof_metadata(db: Session, prof_id: int):
    matieres_ids = db.query(CreneauGroupe.matiere_id)\
        .filter(CreneauGroupe.prof_id == prof_id).distinct().all()
    matieres_ids = [m[0] for m in matieres_ids]

    if not matieres_ids:
        matieres = db.query(Matiere).all()
    else:
        matieres = db.query(Matiere).filter(Matiere.id.in_(matieres_ids)).all()

    niveaux = db.query(Niveau).all()

    return {
        "subjects": [{"id": m.id, "nom": m.nom} for m in matieres],
        "niveaux": [{"id": c.id, "nom": c.nom} for c in niveaux]
    }


def create_manual_seance(db: Session, prof_id: int, data: dict):
    c_id_raw = data.get('niveau_id')
    m_id_raw = data.get('matiere_id')
    date_raw = data.get('date')
    h_debut_raw = data.get('heure_debut')
    h_fin_raw = data.get('heure_fin')

    if not all([c_id_raw, m_id_raw, date_raw, h_debut_raw, h_fin_raw]):
        raise HTTPException(
            status_code=400,
            detail="Tous les champs obligatoires doivent être remplis."
        )

    try:
        c_id = int(c_id_raw)
        m_id = int(m_id_raw)
        date_obj = datetime.fromisoformat(date_raw).date()
        h_debut_obj = datetime.strptime(h_debut_raw, "%H:%M").time()
        h_fin_obj = datetime.strptime(h_fin_raw, "%H:%M").time()

        if date_obj.weekday() == 6:
            raise HTTPException(
                status_code=400,
                detail="La création de séances le dimanche n'est pas autorisée."
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Format de données invalide.")

    seance = Seance(
        date=date_obj,
        heure_debut=h_debut_obj,
        heure_fin=h_fin_obj,
        salle=data.get('salle'),
        statut=StatutSeance.PLANIFIEE,
        creneau_groupe_id=None,
        prof_id=prof_id,
        niveau_id=c_id,
        matiere_id=m_id
    )
    db.add(seance)
    db.commit()
    db.refresh(seance)
    return seance


def get_seance_presences(db: Session, seance_id: int, prof_id: int):
    seance = db.query(Seance).filter(
        Seance.id == seance_id,
        Seance.prof_id == prof_id
    ).first()
    if not seance:
        return None

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
            "heure_scan": p.date_scan if p else None
        })

    return result


def get_subject_attendance_matrix(db: Session, prof_id: int, matiere_id: int,niveau_id: int):
    seances = db.query(Seance).filter(
        Seance.matiere_id == matiere_id,
        Seance.niveau_id == niveau_id
    ).order_by(Seance.date.asc(), Seance.heure_debut.asc()).all()

    if not seances:
        return {"sessions": [], "students": []}

    etudiants = db.query(Etudiant).filter(
        Etudiant.niveau_id == niveau_id
    ).order_by(Etudiant.nom.asc()).all()

    matiere = db.query(Matiere).get(matiere_id)
    niveau = db.query(Niveau).get(niveau_id)

    matrix_data = []
    for etu in etudiants:
        student_presences = []
        for s in seances:
            p = db.query(Presence).filter(
                Presence.seance_id == s.id,
                Presence.etudiant_id == etu.id
            ).first()
            student_presences.append({
                "seance_id": s.id,
                "statut": p.statut.value if p else "ABSENT"
            })
        matrix_data.append({
            "id": etu.id,
            "nom": etu.nom,
            "prenom": etu.prenom,
            "presences": student_presences
        })

    return {
        "matiere_name": matiere.nom if matiere else "Inconnue",
        "niveau_name": niveau.nom if niveau else "Inconnue",
        "sessions": [
            {
                "id": s.id,
                "date": s.date.isoformat(),
                "heure": f"{s.heure_debut.strftime('%H:%M')}-{s.heure_fin.strftime('%H:%M')}"
            } for s in seances
        ],
        "students": matrix_data
    }
    