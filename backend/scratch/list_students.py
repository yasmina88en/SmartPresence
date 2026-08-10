import sys
import os

# Add the parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.etudiant import Etudiant

def list_students():
    db = SessionLocal()
    try:
        students = db.query(Etudiant).all()
        print("ID | Email | Nom | Prenom")
        print("-" * 40)
        for s in students:
            print(f"{s.id} | {s.email} | {s.nom} | {s.prenom}")
    finally:
        db.close()

if __name__ == "__main__":
    list_students()
