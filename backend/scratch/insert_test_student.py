import sys
import os

# Add the parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models import Etudiant
from app.core.security import hash_password

def insert_test_student():
    db = SessionLocal()
    try:
        email = "test@student.com"
        # Check if already exists
        existing = db.query(Etudiant).filter(Etudiant.email == email).first()
        if existing:
            db.delete(existing)
            db.commit()
            print(f"Deleted existing student {email}")

        student = Etudiant(
            nom="TEST",
            prenom="Student",
            email=email,
            password_hash=hash_password("password123"),
            must_change_password=False,
            niveau_id=1,
            groupe_id=1
        )
        db.add(student)
        db.commit()
        print(f"Inserted student {email} with password 'password123'")
    finally:
        db.close()

if __name__ == "__main__":
    insert_test_student()
