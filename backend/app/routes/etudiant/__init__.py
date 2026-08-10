# app/routes/etudiant/__init__.py
# routes/etudiant/__init__.py
from .auth       import router as auth_router
from .dashboard  import router as dashboard_router
from .scanner    import router as scanner_router
from .enrollment import router as enrollment_router