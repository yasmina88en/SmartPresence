from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.session import get_db
from app.core.security import decode_access_token
from app.schemas.auth_schema import LoginRequest, TokenResponse, ChangePasswordRequest
from app.services import auth_service
from app.models import Filiere, Niveau, Prof, Etudiant
from app.models.creneau import Creneau  # Assure we import Creneau correctly

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = HTTPBearer()

from jose import JWTError, ExpiredSignatureError

# ── helper réutilisable : récupérer le payload du token ───────────────────
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
) -> dict:
    token = credentials.credentials
    try:
        return decode_access_token(token)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, data.email, data.password)

# ── changement de mot de passe (prof + etudiant) ───────────────────────────
@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email = payload.get("email")
    role = payload.get("role")
    
    return auth_service.change_password(
        db, email, role, data.old_password, data.new_password
    )

def require_admin(payload: dict = Depends(get_current_user)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'admin")
    return payload

def require_prof(payload: dict = Depends(get_current_user)):
    if payload.get("role") != "prof":
        raise HTTPException(status_code=403, detail="Accès réservé aux profs")
    return payload

def require_etudiant(payload: dict = Depends(get_current_user)):
    if payload.get("role") != "etudiant":
        raise HTTPException(status_code=403, detail="Accès réservé aux étudiants")
    return payload

def get_current_etudiant(
    payload: dict = Depends(require_etudiant),
    db: Session = Depends(get_db)
) -> Etudiant:
    etudiant_id = payload.get("sub")
    if not etudiant_id:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    etudiant = db.query(Etudiant).filter(Etudiant.id == int(etudiant_id)).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    return etudiant

@router.get("/admin-stats")
def get_admin_stats(db: Session = Depends(get_db)):
    # Returns dashboard stats including creneaux (sessions) to verify schedule import
    try:
        filieres_count = db.query(Filiere).count()
        niveaux_count = db.query(Niveau).count()
        profs_count = db.query(Prof).count()
        etudiants_count = db.query(Etudiant).count()
        
        # This will answer the user's question: "is the schedule stored?"
        # Counting the amount of scheduled slots (creneau)
        creneaux_count = db.query(Creneau).count() if 'Creneau' in globals() else 0
        
        return {
            "filieres": filieres_count,
            "niveaux": niveaux_count,
            "professeurs": profs_count,
            "etudiants": etudiants_count,
            "creneaux": creneaux_count
        }
    except Exception as e:
        print(f"Error getting stats: {e}")
        return { "filieres": 0, "classes": 0, "professeurs": 0, "etudiants": 0, "creneaux": 0 }