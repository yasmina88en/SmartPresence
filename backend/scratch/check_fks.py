
import sys, os
sys.path.append(os.getcwd())
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("FKs pointing to 'creneau':")
    res = conn.execute(text("""
        SELECT conname, relname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE confrelid = (SELECT oid FROM pg_class WHERE relname='creneau')
    """)).fetchall()
    for row in res:
        print(f" - {row.conname} from table {row.relname}")

    print("\nFKs pointing to 'creneau_groupe':")
    res = conn.execute(text("""
        SELECT conname, relname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE confrelid = (SELECT oid FROM pg_class WHERE relname='creneau_groupe')
    """)).fetchall()
    for row in res:
        print(f" - {row.conname} from table {row.relname}")
