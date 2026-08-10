from sqlalchemy import Column, Integer, String
from app.db.base import Base


class Admin(Base):
    __tablename__ = "admin"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
