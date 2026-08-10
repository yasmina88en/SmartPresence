# Import de BaseModel depuis Pydantic
# → sert à créer des modèles de validation des données (API)
from pydantic import BaseModel


# Niveau de base pour une Filière
# → contient les champs communs (utilisé pour créer et modifier)
class FiliereBase(BaseModel):
    # nom de la filière (ex: "Génie Informatique")
    nom: str


# Niveau utilisée lors de la création (POST /filieres)
# → hérite de FiliereBase donc elle a déjà "nom"
class FiliereCreate(FiliereBase):
    # pass = aucune modification supplémentaire
    # → on garde exactement les mêmes champs que FiliereBase
    pass


# Niveau utilisée pour la réponse API (GET /filieres)
# → ce que le backend renvoie au frontend
class FiliereResponse(FiliereBase):
    # id généré automatiquement par la base de données
    id: int

    # Configuration Pydantic
    class Config:
        # permet de convertir un objet SQLAlchemy en modèle Pydantic
        # ex: Filiere(id=1, nom="GI") → JSON
        from_attributes = True