from pydantic import BaseModel
from typing import Optional


class ProfBase(BaseModel):
    nom: str
    prenom: str
    email: str


class ProfCreate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None

class ProfUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None


class ProfResponse(ProfBase):
    id: int
    must_change_password: bool

    class Config:
        from_attributes = True