from pydantic import BaseModel
from typing import Optional


class EtudiantBase(BaseModel):
    nom: str
    prenom: str
    email: str
    niveau_id: int
    groupe_id: Optional[int] = None


class EtudiantCreate(EtudiantBase):
    pass


class EtudiantUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    niveau_id: Optional[int] = None
    groupe_id: Optional[int] = None


class GroupeInfo(BaseModel):
    id: int
    nom: str

    class Config:
        from_attributes = True


class EtudiantResponse(EtudiantBase):
    id: int
    must_change_password: bool
    groupe: Optional[GroupeInfo] = None

    class Config:
        from_attributes = True