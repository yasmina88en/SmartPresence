from sqlalchemy.orm import Session
from app.models.etudiant import Etudiant

def get_etudiant_by_email(db: Session, email: str):
    return db.query(Etudiant).filter(Etudiant.email == email).first()

def update_etudiant_password(db: Session, etudiant: Etudiant, new_hash: str):
    etudiant.password_hash = new_hash
    etudiant.must_change_password = False
    db.commit()
    db.refresh(etudiant)
    return etudiant