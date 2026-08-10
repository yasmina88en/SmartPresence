from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from app.db.base import Base
from app.models.enums import *


class CreneauGroupe(Base):
    __tablename__ = "creneau_groupe"

    id = Column(Integer, primary_key=True)
    creneau_id = Column(Integer, ForeignKey("creneau.id"), nullable=False)
    groupe_id = Column(Integer, ForeignKey("groupe.id"))
    matiere_id = Column(Integer, ForeignKey("matiere.id"), nullable=False)
    prof_id = Column(Integer, ForeignKey("prof.id"), nullable=False)
    salle = Column(String)
    nature = Column(Enum(NatureSeance), default=NatureSeance.Cours)
