from sqlalchemy.orm import Session
from app.models.prof import Prof

def get_prof_by_email(db: Session, email: str):
    return db.query(Prof).filter(Prof.email == email).first()

def update_prof_password(db: Session, prof: Prof, new_hash: str):
    prof.password_hash = new_hash
    prof.must_change_password = False
    db.commit()
    db.refresh(prof)
    return prof