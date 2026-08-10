import sys
import os

# Add the parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.etudiant import Etudiant
from app.core.security import hash_password

def reset_student_password(email, new_password):
    db = SessionLocal()
    try:
        student = db.query(Etudiant).filter(Etudiant.email == email).first()
        if student:
            student.password_hash = hash_password(new_password)
            student.must_change_password = False # Set to False for easier testing
            db.commit()
            print(f"Password for {email} reset to '{new_password}'")
        else:
            print(f"Student with email {email} not found")
    finally:
        db.close()

if __name__ == "__main__":
    reset_student_password("ahmed.alami@ump.ac.ma", "password123")
