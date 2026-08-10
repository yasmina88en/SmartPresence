
import os
import sys
sys.path.append(os.getcwd())

from app.db.session import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('classe')
print(f"Columns in 'classe': {[c['name'] for c in columns]}")

columns_groupe = inspector.get_columns('groupe')
print(f"Columns in 'groupe': {[c['name'] for c in columns_groupe]}")
