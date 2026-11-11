# SmartPresence

Système intelligent d'émargement par **reconnaissance faciale** et **QR code dynamique anti-fraude**, réalisé dans le cadre du PFA en Génie Informatique à l'ENSAO (Université Mohammed Premier, Oujda), année 2025 / 2026.

## Le problème

À l'ENSAO, la présence repose encore sur l'appel nominal et les feuilles papier. Cela entraîne :
- du temps de cours perdu à chaque séance ;
- un risque de fraude par procuration (un étudiant signe pour un absent) ;
- l'impossibilité d'exploiter les données de présence automatiquement.

## La solution

Pour chaque séance, le professeur choisit **une** des deux méthodes :

1. **QR code dynamique** : un jeton est régénéré toutes les 120 secondes (ou manuellement par le professeur). Un jeton expiré est rejeté, donc une capture d'écran transmise à un absent devient inutile.
2. **Reconnaissance faciale** : une caméra filme la salle, le système détecte tous les visages et identifie les étudiants automatiquement.

Aucun matériel dédié n'est nécessaire : seuls les téléphones et ordinateurs déjà possédés sont utilisés.

## Fonctionnalités

**Administrateur**
- Gestion de la structure pédagogique (filières, niveaux, groupes)
- Import des listes d'étudiants et de l'emploi du temps depuis Excel
- Création automatique des comptes avec mot de passe temporaire (changement obligatoire à la première connexion)
- Consultation de l'historique et des statistiques de présence

**Professeur**
- Consultation des séances du jour, création d'une séance hors planning
- Démarrage et clôture de séance, choix de la méthode (QR code ou reconnaissance faciale)
- Liste de présence en temps réel
- Export des feuilles de présence vers Excel

**Étudiant**
- Application PWA installable sur iOS et Android
- Enrôlement du visage guidé (face, droite, gauche, haut, bas)
- Scan du QR code en séance
- Consultation de l'historique et du taux d'assiduité

## Architecture

Architecture en trois tiers, composée de trois applications :

| Dossier | Rôle | Technologies |
|---|---|---|
| `backend` | API REST, logique métier, sécurité, reconnaissance faciale | FastAPI, PostgreSQL, InsightFace, NumPy, OpenCV |
| `frontendAdmin-Prof` | Interface administrateur et professeur | React, Vite |
| `frontend-student` | Application mobile des étudiants (PWA) | React, Vite, face-api |

## Comment fonctionne la reconnaissance faciale

**Enrôlement (étudiant)**
1. L'étudiant enregistre 5 positions de la tête. Le navigateur détecte la pose et déclenche la capture automatiquement.
2. Le serveur vérifie la netteté de l'image (variance du Laplacien ≥ 80), puis InsightFace (modèle `buffalo_l`) extrait un vecteur de 512 valeurs (embedding).
3. La moyenne des 5 vecteurs est stockée dans la base. Les photos brutes sont supprimées.

**Identification (professeur)**
1. Une caméra externe est connectée (en test : un smartphone avec IP Webcam ).
2. Toutes les 2 secondes, une image du flux est envoyée au serveur.
3. Tous les visages sont détectés et chaque embedding est comparé, par similarité cosinus, à ceux des étudiants **du niveau de la séance**.
4. Au-dessus du seuil de **0,45**, l'étudiant est reconnu, sa présence est enregistrée et son nom s'affiche sur la vidéo.

## Sécurité et protection des données

- Mots de passe hachés avec **bcrypt** (jamais stockés en clair)
- Authentification par **JWT** et contrôle d'accès par rôle (admin, prof, étudiant) vérifié côté serveur
- QR code dynamique : jeton UUID régénéré toutes les 120 secondes
- Deux **triggers PostgreSQL** (`check_seance_coherence`, `check_presence_coherence`) garantissent la cohérence des données, même en cas d'accès direct à la base
- Données biométriques : seuls les vecteurs sont conservés, les images brutes sont supprimées immédiatement

## Captures d'écran

### Connexion
![Connexion](screenshots/01-connexion.png)

### Administrateur
![Dashboard administrateur](screenshots/02-admin-dashboard.png)
![Import de l'emploi du temps](screenshots/03-admin-import-emploi-du-temps.png)
![Import des étudiants](screenshots/04-admin-import-etudiants.png)
![Historique de présence](screenshots/05-admin-historique-presence.png)

### Professeur
![Tableau de bord professeur](screenshots/07-prof-tableau-de-bord.png)
![QR code dynamique](screenshots/09-prof-qr-code.png)
![Reconnaissance faciale](screenshots/10-prof-reconnaissance-faciale.png)

### Étudiant
![Tableau de bord étudiant](screenshots/11-etudiant-tableau-de-bord.png)
![Configuration Face ID](screenshots/12-etudiant-face-id.png)

## Installation

### Prérequis
- Python 3.10
- Node.js 
- PostgreSQL

### 1. Base de données
Créez une base PostgreSQL, par exemple `[smartpresence]`. 

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS
pip install -r requirements.txt
```
Créez un fichier `.env` à partir de `.env.example` et renseignez vos valeurs (URL de la base, clé JWT).

Lancez le serveur :
```bash
uvicorn main:app --reload
```
Le modèle InsightFace `buffalo_l` est téléchargé automatiquement au premier lancement.

### 3. Frontends
```bash
cd frontendAdmin-Prof
npm install
npm run dev
```
```bash
cd frontend-student
npm install
npm run dev
```

> **Remarque :** l'accès à la caméra dans le navigateur exige HTTPS. Pour tester l'application étudiante sur un téléphone, nous avons utilisé un tunnel HTTPS (ngrok) pour le frontend et un tunnel pour l'API.

## Équipe

Projet réalisé en groupe de trois :
- Yasmina Ait Ben Addi
- Hanane Aissaoui
- Maryam Chtioui

Encadrant : Pr. Mohammed Saber, ENSAO.

**Ma contribution (Yasmina Ait Ben Addi) :**
- API REST de gestion des professeurs et des étudiants, avec import en masse depuis Excel et génération automatique des comptes
- Module de reconnaissance faciale en temps réel : capture vidéo, détection de plusieurs visages, comparaison des embeddings par similarité cosinus

## Limites et perspectives

- Pas de détection de vivacité (anti-spoofing) : une photo présentée à la caméra pourrait tromper le système
- Pondération de l'embedding global selon la qualité de chaque capture
- Notifications en temps réel en cas d'assiduité anormalement basse
- Intégration à l'annuaire de l'établissement (SSO / LDAP)
- Déploiement HTTPS pérenne, au lieu des tunnels de développement
