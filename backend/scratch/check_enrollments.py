import sys
import os

# Add the parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.face_enrollment import FaceEnrollment
from app.models.etudiant import Etudiant

db = SessionLocal()
try:
    enrollments = db.query(FaceEnrollment).all()
    print(f"Nombre d'enregistrements trouvés : {len(enrollments)}")
    print("-" * 50)
    for e in enrollments:
        etudiant = db.query(Etudiant).filter(Etudiant.id == e.etudiant_id).first()
        nom = f"{etudiant.prenom} {etudiant.nom}" if etudiant else f"ID:{e.etudiant_id}"
        
        # Check embedding length
        emb_len = len(e.embedding) if e.embedding else 0
        
        print(f"Etudiant: {nom:20} | Position: {e.position:10} | Embedding Size: {emb_len} | Date: {e.created_at}")
    print("-" * 50)
finally:
    db.close()
