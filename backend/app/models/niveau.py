from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Niveau(Base):
    __tablename__ = "niveau"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    filiere_id = Column(Integer, ForeignKey("filiere.id"), nullable=False)

    filiere = relationship("Filiere", back_populates="niveaux")
    etudiants = relationship("Etudiant", back_populates="niveau")