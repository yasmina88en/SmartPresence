from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Matiere(Base):
    __tablename__ = "matiere"

    id = Column(Integer, primary_key=True)
    nom = Column(String, unique=True, nullable=False)
