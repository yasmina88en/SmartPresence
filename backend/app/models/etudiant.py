# models/etudiant.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class Etudiant(Base):
    __tablename__ = "etudiant"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=True)

    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False)
    groupe_id = Column(Integer, ForeignKey("groupe.id"))

    niveau = relationship("Niveau", back_populates="etudiants")
    groupe = relationship("Groupe", foreign_keys=[groupe_id])