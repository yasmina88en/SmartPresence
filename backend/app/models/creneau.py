from sqlalchemy import Column, Integer, String, ForeignKey, Enum,Time
from app.db.base import Base
from app.models.enums import *

class Creneau(Base):
    __tablename__ = "creneau"

    id = Column(Integer, primary_key=True)
    jour = Column(Enum(JourSemaine), nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    semestre = Column(Enum(Semestre), nullable=False)
    annee_universitaire = Column(String, nullable=False)

    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False)
