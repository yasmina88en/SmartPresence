from sqlalchemy import Column, Integer, Date, Time, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import StatutSeance


class Seance(Base):
    __tablename__ = "seance"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    salle = Column(String)
    statut = Column(Enum(StatutSeance), default=StatutSeance.ACTIVE)

    creneau_groupe_id = Column(Integer, ForeignKey("creneau_groupe.id"), nullable=True)

    prof_id = Column(Integer, ForeignKey("prof.id"), nullable=False)
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False)
    matiere_id = Column(Integer, ForeignKey("matiere.id"), nullable=False)
    groupe_id = Column(Integer, ForeignKey("groupe.id"))

