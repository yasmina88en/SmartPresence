from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.core.security import verify_password, hash_password, create_access_token
from app.repositories.admin_repo import get_admin_by_email
from app.repositories.prof_repo import (
    get_prof_by_email, update_prof_password
)
from app.repositories.etudiant_repo import (
    get_etudiant_by_email, update_etudiant_password
)


def login(db: Session, email: str, password: str, role_target: str = None) -> dict:
    """
    Essaie de connecter l'utilisateur. Si role_target est fourni, cherche directement.
    Sinon, essaie admin → prof → etudiant dans l'ordre.
    """
    email = email.lower().strip()

    if role_target == "etudiant":
        etudiant = get_etudiant_by_email(db, email)
        if not etudiant: 
            raise HTTPException(status_code=401, detail="Email étudiant introuvable")
        
        if not verify_password(password, etudiant.password_hash):
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        
        token = create_access_token({"sub": str(etudiant.id), "email": etudiant.email, "role": "etudiant", "must_change_password": etudiant.must_change_password})
        return {"access_token": token, "token_type": "bearer", "role": "etudiant", "must_change_password": etudiant.must_change_password}

    if role_target == "prof":
        prof = get_prof_by_email(db, email)
        if not prof: raise HTTPException(status_code=401, detail="Email professeur introuvable")
        if not verify_password(password, prof.password_hash):
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        token = create_access_token({"sub": str(prof.id), "email": prof.email, "role": "prof", "must_change_password": prof.must_change_password})
        return {"access_token": token, "token_type": "bearer", "role": "prof", "must_change_password": prof.must_change_password}

    # --- CAS GÉNÉRIQUE (Admin ou inconnu) ---
    admin = get_admin_by_email(db, email)
    if admin:
        if not verify_password(password, admin.password_hash):
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        token = create_access_token({"sub": str(admin.id), "email": admin.email, "role": "admin"})
        return {"access_token": token, "token_type": "bearer", "role": "admin", "must_change_password": False}

    # Si pas admin, on cherche prof puis étudiant (fallback)
    if not role_target:
        prof = get_prof_by_email(db, email)
        if prof: return login(db, email, password, "prof")
        etudiant = get_etudiant_by_email(db, email)
        if etudiant: return login(db, email, password, "etudiant")

    raise HTTPException(status_code=401, detail="Email introuvable")


def change_password(db: Session, email: str, role: str,
                    old_password: str, new_password: str) -> dict:
    """
    Vérifie l'ancien mot de passe et enregistre le nouveau.
    Disponible pour prof et etudiant uniquement.
    """

    if len(new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Le nouveau mot de passe doit avoir au moins 6 caractères"
        )

    if role == "prof":
        prof = get_prof_by_email(db, email)
        if not prof:
            raise HTTPException(status_code=404, detail="Prof introuvable")
        if not verify_password(old_password, prof.password_hash):
            raise HTTPException(status_code=401, detail="Ancien mot de passe incorrect")
        update_prof_password(db, prof, hash_password(new_password))
        return {"message": "Mot de passe mis à jour avec succès"}

    if role == "etudiant":
        etudiant = get_etudiant_by_email(db, email)
        if not etudiant:
            raise HTTPException(status_code=404, detail="Etudiant introuvable")
        if not verify_password(old_password, etudiant.password_hash):
            raise HTTPException(status_code=401, detail="Ancien mot de passe incorrect")
        update_etudiant_password(db, etudiant, hash_password(new_password))
        return {"message": "Mot de passe mis à jour avec succès"}

    raise HTTPException(
        status_code=403,
        detail="L'admin ne peut pas changer son mot de passe via cet endpoint"
    )


def generate_first_password(nom: str, prenom: str = "") -> str:
    """
    Génère : PrenomNom + année  ex: MohammedBenali2026
    """
    import unicodedata, re

    def clean(s):
        s = unicodedata.normalize("NFD", s)
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        s = re.sub(r"[^a-zA-Z0-9]", "", s)
        return s.capitalize()

    annee = datetime.now().year
    return f"{clean(prenom)}{clean(nom)}{annee}"