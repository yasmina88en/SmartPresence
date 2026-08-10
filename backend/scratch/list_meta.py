import sys
import os

# Add the parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models import Niveau, Groupe

def list_data():
    db = SessionLocal()
    try:
        print("--- Niveaux ---")
        niveaux = db.query(Niveau).all()
        for n in niveaux:
            print(f"ID: {n.id} | Nom: {n.nom}")
        
        print("\n--- Groupes ---")
        groupes = db.query(Groupe).all()
        for g in groupes:
            print(f"ID: {g.id} | Nom: {g.nom} | Niveau ID: {g.niveau_id}")
    finally:
        db.close()

if __name__ == "__main__":
    list_data()
