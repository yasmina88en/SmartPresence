
import sys, os
sys.path.append(os.getcwd())
from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
niveau_id = 1

try:
    print(f"Testing delete for niveau {niveau_id}...")
    # 1. 
    db.execute(text("""
        DELETE FROM presence WHERE seance_id IN (
            SELECT id FROM seance WHERE niveau_id = :cid
        )
    """), {"cid": niveau_id})
    print("Deleted presence")
    
    db.execute(text("""
        DELETE FROM qrcode WHERE seance_id IN (
            SELECT id FROM seance WHERE niveau_id = :cid
        )
    """), {"cid": niveau_id})
    print("Deleted qrcode")
    
    db.execute(text("DELETE FROM seance WHERE niveau_id = :cid"), {"cid": niveau_id})
    print("Deleted seance")

    # 2. 
    db.execute(text("""
        DELETE FROM creneau_groupe
        WHERE creneau_id IN (
            SELECT id FROM creneau WHERE niveau_id = :cid
        )
    """), {"cid": niveau_id})
    print("Deleted creneau_groupe")

    # 3. 
    db.execute(text("DELETE FROM creneau WHERE niveau_id = :cid"), {"cid": niveau_id})
    print("Deleted creneau")

    db.commit()
    print("Committed successfully!")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
