from pydantic import BaseModel

class NiveauBase(BaseModel):
    nom: str
    filiere_id: int


class NiveauCreate(NiveauBase):
    pass


# Niveau utilisée pour la réponse API (GET /filieres)
# → ce que le backend renvoie au frontend
class NiveauResponse(NiveauBase):
    id: int

    class Config:
    
        from_attributes = True