
import sys, os
sys.path.append(os.getcwd())
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("FKs pointing to 'seance':")
    res = conn.execute(text("""
        SELECT conname, relname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE confrelid = (SELECT oid FROM pg_class WHERE relname='seance')
    """)).fetchall()
    for row in res:
        print(f" - {row.conname} from table {row.relname}")
