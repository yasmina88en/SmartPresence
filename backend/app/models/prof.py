from sqlalchemy import Column, Integer, String, Boolean
from app.db.base import Base

class Prof(Base):
    __tablename__ = "prof"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=True)
