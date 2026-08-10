
import os
import sys
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.niveau import Niveau
from app.models.filiere import Filiere

db = SessionLocal()
try:
    # Get first filiere
    filiere = db.query(Filiere).first()
    if not filiere:
        print("No filiere found. Creating one...")
        filiere = Filiere(nom="Test Filiere")
        db.add(filiere)
        db.commit()
        db.refresh(filiere)
    
    print(f"Adding niveau to filiere: {filiere.nom} (ID: {filiere.id})")
    new_niveau = Niveau(nom="Test Niveau", filiere_id=filiere.id)
    db.add(new_niveau)
    db.commit()
    db.refresh(new_niveau)
    print(f"Successfully added niveau: {new_niveau.nom} (ID: {new_niveau.id})")
    
    # Clean up
    db.delete(new_niveau)
    db.commit()
    print("Cleaned up test niveau.")
except Exception as e:
    print(f"Error adding niveau: {e}")
finally:
    db.close()
