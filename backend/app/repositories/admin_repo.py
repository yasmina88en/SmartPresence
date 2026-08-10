from app.models.admin import Admin

def get_admin_by_email(db, email: str):
    return db.query(Admin).filter(Admin.email == email).first()