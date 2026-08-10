# models/presence.py
from app import models
import enum
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import StatutPresence

class Presence(Base):
    __tablename__ = "presence"

    id = Column(Integer, primary_key=True)
    statut = Column(Enum(StatutPresence), default=StatutPresence.ABSENT)
    date_scan = Column(String)
    localisation = Column(String)

    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False)
    seance_id = Column(Integer, ForeignKey("seance.id"), nullable=False)
    qrcode_id = Column(Integer, ForeignKey("qrcode.id"))
