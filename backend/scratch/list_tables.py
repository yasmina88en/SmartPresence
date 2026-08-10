
import os
import sys
sys.path.append(os.getcwd())

from app.db.session import engine
from sqlalchemy import inspect

inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")
