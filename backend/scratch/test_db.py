
import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.getcwd())

try:
    from app.db.session import engine
    from sqlalchemy import text
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Database connection successful!")
except Exception as e:
    print(f"Database connection failed: {e}")
