
import os
import sys
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.admin import Admin

db = SessionLocal()
try:
    admins = db.query(Admin).all()
    if not admins:
        print("No admins found in database.")
    else:
        for admin in admins:
            print(f"Admin found: {admin.email}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
