# models/qrcode.py
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.dialects.postgresql import UUID

class QRCode(Base):
    __tablename__ = "qrcode"

    id = Column(Integer, primary_key=True)
    token = Column(UUID(as_uuid=True), unique=True, server_default=func.gen_random_uuid())
    date_generation = Column(String, server_default=func.now())
    expiration = Column(String, nullable=False)

    seance_id = Column(Integer, ForeignKey("seance.id"), nullable=False)
