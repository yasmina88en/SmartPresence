from sqlalchemy import text
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
import secrets
import io
import re
import pandas as pd
from passlib.context import CryptContext

from app.db.session import get_db
from app.models.etudiant import Etudiant
from app.models.groupe import Groupe
from app.models.presence import Presence
from app.models.face_enrollment import FaceEnrollment
from app.schemas.etudiant_schema import EtudiantCreate, EtudiantUpdate, EtudiantResponse

router = APIRouter(prefix="/etudiants", tags=["Étudiants"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


from datetime import datetime

def generate_temp_password(nom: str, prenom: str) -> str:
    """Génère : PrenomNom + année courante  ex: MohammedBenali2026"""
    import unicodedata

    def clean(s):
        s = unicodedata.normalize("NFD", s)
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        s = re.sub(r"[^a-zA-Z0-9]", "", s)
        return s.capitalize()

    annee = datetime.now().year
    return f"{clean(prenom)}{clean(nom)}{annee}"


def generate_email(nom: str, prenom: str) -> str:
    import unicodedata

    def clean(s):
        s = unicodedata.normalize("NFD", s)
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        s = s.lower().strip().replace(" ", "")
        s = re.sub(r"[^a-z0-9]", "", s)
        return s

    return f"{clean(nom)}.{clean(prenom)}@ump.ac.ma"


# ─── GET all étudiants d'un niveau ──────────────────────────────────────────
@router.get("/niveau/{niveau_id}", response_model=list[EtudiantResponse])
def get_etudiants_by_niveau(niveau_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Etudiant)
        .options(joinedload(Etudiant.groupe))
        .filter(Etudiant.niveau_id == niveau_id)
        .order_by(Etudiant.nom)
        .all()
    )


# ─── GET single étudiant ─────────────────────────────────────────────────────
@router.get("/{id}", response_model=EtudiantResponse)
def get_etudiant(id: int, db: Session = Depends(get_db)):
    etudiant = (
        db.query(Etudiant)
        .options(joinedload(Etudiant.groupe))
        .filter(Etudiant.id == id)
        .first()
    )
    if not etudiant:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    return etudiant


# ─── IMPORT EXCEL ─────────────────────────────────────────────────────────────
@router.post("/import-excel", status_code=201)
async def import_etudiants_excel(
    niveau_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Le fichier doit être un fichier Excel (.xlsx ou .xls)")

    contents = await file.read()

    # ── Lire sans header pour détecter la ligne d'en-tête automatiquement ──
    try:
        raw = pd.read_excel(io.BytesIO(contents), header=None)
    except Exception:
        raise HTTPException(status_code=400, detail="Impossible de lire le fichier Excel")

    # Chercher la ligne qui contient "nom" ET "prenom" (insensible à la casse)
    header_row = None
    for i, row in raw.iterrows():
        row_vals = [str(v).strip().lower() for v in row.values]
        if "nom" in row_vals and "prenom" in row_vals:
            header_row = i
            break

    if header_row is None:
        raise HTTPException(
            status_code=400,
            detail="En-tête introuvable : colonnes 'nom' et 'prenom' non trouvées dans le fichier",
        )

    # Relire avec le bon numéro de ligne comme header
    df = pd.read_excel(io.BytesIO(contents), header=header_row)
    df.columns = [str(c).strip().lower() for c in df.columns]

    # ── 1. S'assurer que Groupe 1 et Groupe 2 existent pour ce niveau ──────
    def get_or_create_groupe(nom_groupe: str) -> Groupe:
        g = db.query(Groupe).filter(
            Groupe.nom == nom_groupe,
            Groupe.niveau_id == niveau_id
        ).first()
        if not g:
            g = Groupe(nom=nom_groupe, niveau_id=niveau_id)
            db.add(g)
            db.flush()
        return g

    groupe1 = get_or_create_groupe("Groupe 1")
    groupe2 = get_or_create_groupe("Groupe 2")

    # ── 2. Filtrer les lignes valides et trier par nom ──────────────────────
    valid_rows = []
    errors = []

    for i, row in df.iterrows():
        nom    = str(row.get("nom", "")).strip()
        prenom = str(row.get("prenom", "")).strip()

        if not nom or not prenom or nom.lower() == "nan" or prenom.lower() == "nan":
            continue

        email = generate_email(nom, prenom)
        existing = db.query(Etudiant).filter(Etudiant.email == email).first()
        if existing:
            errors.append(f"Ligne {i+2} : '{nom} {prenom}' → email '{email}' déjà utilisé — ignoré")
            continue

        valid_rows.append({"nom": nom, "prenom": prenom, "email": email})

    # Tri alphabétique par nom puis prénom
    valid_rows.sort(key=lambda r: (r["nom"].lower(), r["prenom"].lower()))

    # ── 3. Diviser en deux moitiés et affecter les groupes ─────────────────
    total_valid = len(valid_rows)
    mid = (total_valid + 1) // 2  # arrondi supérieur si impair → Groupe 1 plus grand

    inserted = 0
    for idx, data in enumerate(valid_rows):
        groupe_id = groupe1.id if idx < mid else groupe2.id

        hashed = pwd_context.hash(generate_temp_password(data["nom"], data["prenom"]))
        etudiant = Etudiant(
            nom=data["nom"],
            prenom=data["prenom"],
            email=data["email"],
            password_hash=hashed,
            must_change_password=True,
            niveau_id=niveau_id,
            groupe_id=groupe_id,
        )
        db.add(etudiant)
        inserted += 1

    db.commit()

    g1_count = min(mid, inserted)
    g2_count = max(0, inserted - mid)
    skipped  = total_valid - inserted

    return {
        "message": (
            f"{inserted} étudiant(s) importé(s) — "
            f"Groupe 1 : {g1_count}, Groupe 2 : {g2_count}"
        ),
        "inserted": inserted,
        "skipped":  skipped,
        "errors":   errors,
    }


# ─── DELETE all étudiants d'un niveau ───────────────────────────────────────
# [FIX] Même problème potentiel que pour la suppression individuelle : si des
# présences existent pour ces étudiants, la suppression en masse échouera
# aussi avec une IntegrityError non gérée. On applique la même logique de
# cascade explicite ici, par cohérence et pour éviter la même erreur 500.
@router.delete("/niveau/{niveau_id}/all")
def delete_all_etudiants_by_niveau(niveau_id: int, db: Session = Depends(get_db)):
    etudiant_ids = [
        row[0] for row in
        db.query(Etudiant.id).filter(Etudiant.niveau_id == niveau_id).all()
    ]

    if not etudiant_ids:
        return {"message": f"0 étudiant(s) supprimé(s) du niveau {niveau_id}"}

    try:
        db.query(Presence).filter(Presence.etudiant_id.in_(etudiant_ids)).delete(synchronize_session=False)
        db.query(FaceEnrollment).filter(FaceEnrollment.etudiant_id.in_(etudiant_ids)).delete(synchronize_session=False)

        deleted = (
            db.query(Etudiant)
            .filter(Etudiant.niveau_id == niveau_id)
            .delete(synchronize_session=False)
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer ces étudiants : des données liées l'empêchent encore.",
        )

    return {"message": f"{deleted} étudiant(s) supprimé(s) du niveau {niveau_id}"}


# ─── UPDATE ───────────────────────────────────────────────────────────────────
@router.put("/{id}", response_model=EtudiantResponse)
def update_etudiant(id: int, data: EtudiantUpdate, db: Session = Depends(get_db)):
    etudiant = db.query(Etudiant).filter(Etudiant.id == id).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    if data.email and data.email != etudiant.email:
        existing = db.query(Etudiant).filter(Etudiant.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(etudiant, field, value)

    db.commit()
    db.refresh(etudiant)
    return etudiant


# ─── DELETE ───────────────────────────────────────────────────────────────────
# [FIX] L'ancienne version ne gérait aucune exception : si l'étudiant avait des
# présences enregistrées (FK ON DELETE RESTRICT), PostgreSQL refusait la
# suppression, l'IntegrityError remontait non interceptée, et FastAPI répondait
# par un 500 brut — réponse qui, en plus, ne porte pas les headers CORS
# habituels, ce qui faisait apparaître une erreur CORS trompeuse côté navigateur
# alors que le vrai problème était cette contrainte d'intégrité référentielle.
#
# Comportement choisi : suppression en CASCADE explicite. On efface d'abord les
# présences et l'enrôlement facial de l'étudiant, puis l'étudiant lui-même,
# dans une seule transaction (tout réussit, ou tout est annulé).
@router.delete("/{id}")
def delete_etudiant(id: int, db: Session = Depends(get_db)):
    etudiant = db.query(Etudiant).filter(Etudiant.id == id).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    try:
        presences_deleted = (
            db.query(Presence)
            .filter(Presence.etudiant_id == id)
            .delete(synchronize_session=False)
        )
        enrollments_deleted = (
            db.query(FaceEnrollment)
            .filter(FaceEnrollment.etudiant_id == id)
            .delete(synchronize_session=False)
        )

        db.delete(etudiant)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Impossible de supprimer cet étudiant : des données liées "
                "l'empêchent encore (vérifier les contraintes de la base)."
            ),
        )

    return {
        "message": "Étudiant supprimé avec succès",
        "presences_supprimees": presences_deleted,
        "enrollments_supprimes": enrollments_deleted,
    }


# ─── DETAIL étudiant ─────────────────────────────────────────────────────────
@router.get("/{etudiant_id}/detail")
def get_etudiant_detail(etudiant_id: int, db: Session = Depends(get_db)):
    etudiant = db.execute(text("""
        SELECT e.id, e.nom, e.prenom, e.email,
               n.nom AS niveau, f.nom AS filiere, g.nom AS groupe
        FROM etudiant e
        JOIN niveau n ON n.id = e.niveau_id
        JOIN filiere f ON f.id = n.filiere_id
        LEFT JOIN groupe g ON g.id = e.groupe_id
        WHERE e.id = :id
    """), {"id": etudiant_id}).fetchone()

    if not etudiant:
        raise HTTPException(404, "Étudiant introuvable")

    rows = db.execute(text("""
        SELECT
            m.nom                          AS matiere,
            COUNT(p.id)                    AS total_seances,
            SUM(CASE WHEN p.statut='PRESENT' THEN 1 ELSE 0 END) AS presents,
            SUM(CASE WHEN p.statut='ABSENT'  THEN 1 ELSE 0 END) AS absents
        FROM presence p
        JOIN seance s   ON s.id = p.seance_id
        JOIN matiere m  ON m.id = s.matiere_id
        WHERE p.etudiant_id = :id
        GROUP BY m.nom
        ORDER BY m.nom
    """), {"id": etudiant_id}).fetchall()

    seances = db.execute(text("""
        SELECT
            s.date, s.heure_debut, s.heure_fin,
            m.nom       AS matiere,
            p.statut,
            p.date_scan
        FROM presence p
        JOIN seance s  ON s.id = p.seance_id
        JOIN matiere m ON m.id = s.matiere_id
        WHERE p.etudiant_id = :id
        ORDER BY s.date DESC, s.heure_debut
    """), {"id": etudiant_id}).fetchall()

    total    = sum(r.total_seances for r in rows)
    presents = sum(r.presents      for r in rows)
    absents  = sum(r.absents       for r in rows)

    return {
        "etudiant": dict(etudiant._mapping),
        "stats_globales": {
            "total":         total,
            "presents":      presents,
            "absents":       absents,
            "taux_presence": round(presents / total * 100, 1) if total else 0,
        },
        "par_matiere": [dict(r._mapping) for r in rows],
        "seances":     [dict(r._mapping) for r in seances],
    }