
import os
import sys
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.services.emploi_service import parse_and_save

db = SessionLocal()
file_path = "emplois/1_GI3/emploi_du_temps_S1_2025_2026_GI3.xlsx"

try:
    print(f"Testing parser on {file_path}...")
    parse_and_save(file_path, db, 1)
    print("Success!")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
finally:
    db.close()
