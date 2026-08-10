from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint, Float
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from app.db.base import Base

class FaceEnrollment(Base):
    __tablename__ = "face_enrollment"

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False)
    position = Column(String(20), nullable=False)  # "face", "droite", "gauche", "haut", "bas"
    embedding = Column(ARRAY(Float), nullable=False)   # PostgreSQL FLOAT8[]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('etudiant_id', 'position', name='unique_etudiant_position'),
    )
