# models/__init__.py
# l'ordre est important — importer dans l'ordre des dépendances

from app.models.admin import Admin
from app.models.filiere import Filiere
from app.models.niveau import Niveau         # ← doit être avant Etudiant
from app.models.prof import Prof              # ← doit être avant Matiere
from app.models.matiere import Matiere
from app.models.etudiant import Etudiant     
from app.models.seance import Seance
from app.models.qrcode import QRCode
from app.models.presence import Presence
from app.models.groupe import Groupe
from app.models.creneau import Creneau
from app.models.creneau_group import CreneauGroupe
from app.models.face_enrollment import FaceEnrollment