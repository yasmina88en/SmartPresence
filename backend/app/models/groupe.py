from sqlalchemy import Column, Integer, String,ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Groupe(Base):
    __tablename__ = "groupe"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False)
    etudiants = relationship("Etudiant", back_populates="groupe", foreign_keys="Etudiant.groupe_id")


