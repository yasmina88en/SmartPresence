# main.py
from app.db.base import Base
from app.db.session import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- Imports des Routers ---
from app.routes.admin import (
    auth_routes, filiere_routes, niveau_routes, 
    etudiant_routes, emploi_routes, prof_routes, groupe_routes
)
from app.routes.prof.prof_routes import router as prof_router
from app.routes.etudiant import (
    auth as etudiant_auth, 
    dashboard as etudiant_dash, 
    scanner as etudiant_scan, 
    enrollment as etudiant_enroll
)
from app.routes.prof.face_attendance import router as face_attendance_router
app = FastAPI(title="SmartPresence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes Admin & Auth ---
app.include_router(auth_routes.router)
app.include_router(filiere_routes.router)
app.include_router(niveau_routes.router)
app.include_router(etudiant_routes.router)
app.include_router(prof_routes.router) 
app.include_router(emploi_routes.router)
app.include_router(groupe_routes.router)

# --- Routes Étudiant PWA ---
app.include_router(etudiant_auth.router)
app.include_router(etudiant_dash.router)
app.include_router(etudiant_scan.router)
app.include_router(etudiant_enroll.router)
# --- Routes prof ---
app.include_router(prof_router)
app.include_router(face_attendance_router)

# Mount Static Files for schedules (Excel)
app.mount("/app/emplois", StaticFiles(directory="emplois"), name="emplois")
