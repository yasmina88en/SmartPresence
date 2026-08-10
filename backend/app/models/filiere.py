# models/filiere.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base

class Filiere(Base):
    __tablename__ = "filiere"

    id = Column(Integer, primary_key=True)
    nom = Column(String, unique=True, nullable=False)

    niveaux = relationship("Niveau", back_populates="filiere")