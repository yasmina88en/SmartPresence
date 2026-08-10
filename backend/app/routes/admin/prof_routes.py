from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets
from passlib.context import CryptContext

from app.db.session import get_db
from app.models.prof import Prof
from app.models.creneau_group import CreneauGroupe 
from app.models.seance import Seance  
from app.schemas.prof_schema import ProfCreate, ProfUpdate, ProfResponse

router = APIRouter(prefix="/profs", tags=["Professeurs"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_temp_password() -> str:
    return secrets.token_urlsafe(10)


# ─── GET all profs ────────────────────────────────────────────────────────────
@router.get("/", response_model=list[ProfResponse])
def get_all_profs(db: Session = Depends(get_db)):
    return db.query(Prof).order_by(Prof.nom).all()


# ─── GET single prof ──────────────────────────────────────────────────────────
@router.get("/{id}", response_model=ProfResponse)
def get_prof(id: int, db: Session = Depends(get_db)):
    prof = db.query(Prof).filter(Prof.id == id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professeur introuvable")
    return prof

#----create prof ---
from datetime import datetime

@router.post("/", status_code=201)
def create_prof(prof: ProfCreate, db: Session = Depends(get_db)):
    year = datetime.now().year
    nom_clean = prof.nom.strip().lower().replace(" ", "") if prof.nom else ""
    prenom_clean = prof.prenom.strip().lower().replace(" ", "") if prof.prenom else ""

    identity = ".".join(p for p in [prenom_clean, nom_clean] if p)
    email = prof.email or f"{identity}@ump.ac.ma"
    temp_password = f"{nom_clean}{prenom_clean}{year}"

    existing = db.query(Prof).filter(Prof.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    hashed = pwd_context.hash(temp_password)

    new_prof = Prof(
        nom=prof.nom,
        prenom=prof.prenom,
        email=email,
        password_hash=hashed,
        must_change_password=True,
    )
    db.add(new_prof)
    db.commit()
    db.refresh(new_prof)
    return {
        "id": new_prof.id,
        "nom": new_prof.nom,
        "prenom": new_prof.prenom,
        "email": new_prof.email,
        "must_change_password": new_prof.must_change_password,
        "temp_password": temp_password
    }
# ─── UPDATE ───────────────────────────────────────────────────────────────────
@router.put("/{id}", response_model=ProfResponse)
def update_prof(id: int, data: ProfUpdate, db: Session = Depends(get_db)):
    prof = db.query(Prof).filter(Prof.id == id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professeur introuvable")

    if data.email and data.email != prof.email:
        existing = db.query(Prof).filter(Prof.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prof, field, value)

    db.commit()
    db.refresh(prof)
    return prof


# ─── DELETE ───────────────────────────────────────────────────────────────────
 # adapte l'import selon ton modèle

@router.delete("/{id}")
def delete_prof(id: int, db: Session = Depends(get_db)):
    prof = db.query(Prof).filter(Prof.id == id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professeur introuvable")

    # 1. Supprimer toutes les séances liées directement au prof
    db.query(Seance).filter(Seance.prof_id == id).delete(synchronize_session=False)

    # 2. Trouver les créneaux du prof
    creneau_ids = [c.id for c in db.query(CreneauGroupe).filter(CreneauGroupe.prof_id == id).all()]

    # 3. Supprimer les séances liées aux créneaux
    if creneau_ids:
        db.query(Seance).filter(Seance.creneau_groupe_id.in_(creneau_ids)).delete(synchronize_session=False)

    # 4. Supprimer les créneaux
    db.query(CreneauGroupe).filter(CreneauGroupe.prof_id == id).delete(synchronize_session=False)

    # 5. Supprimer le prof
    db.delete(prof)
    db.commit()
    return {"message": "Professeur supprimé avec succès"}

@router.post("/fix-auto-passwords")
def fix_auto_passwords(db: Session = Depends(get_db)):
    from datetime import datetime
    year = datetime.now().year
    profs = db.query(Prof).filter(Prof.password_hash == 'auto').all()
    result = []
    for p in profs:
        nom_clean = p.nom.lower().replace(" ", "")
        prenom_clean = p.prenom.lower().replace(" ", "")
        temp_password = f"{nom_clean}{prenom_clean}{year}"
        p.password_hash = pwd_context.hash(temp_password)
        p.must_change_password = True
        result.append({"email": p.email, "temp_password": temp_password})
    db.commit()
    return result