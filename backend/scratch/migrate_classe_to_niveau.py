
import os
import sys
sys.path.append(os.getcwd())

from app.db.session import engine
from sqlalchemy import text

sql_commands = [
    "ALTER TABLE classe RENAME TO niveau;",
    "ALTER TABLE niveau RENAME COLUMN niveau TO nom;",
    "ALTER TABLE groupe RENAME COLUMN classe_id TO niveau_id;",
    "ALTER TABLE etudiant RENAME COLUMN classe_id TO niveau_id;",
    "ALTER TABLE creneau RENAME COLUMN classe_id TO niveau_id;",
    "ALTER TABLE seance RENAME COLUMN classe_id TO niveau_id;",
    "DROP VIEW IF EXISTS vue_emploi_du_temps;",
    """CREATE VIEW vue_emploi_du_temps AS
SELECT
    cr.id                        AS creneau_id,
    cg.id                        AS creneau_groupe_id,
    f.nom                        AS filiere,
    cl.nom                       AS niveau,
    cr.semestre,
    cr.annee_universitaire,
    cr.jour,
    cr.heure_debut,
    cr.heure_fin,
    m.nom                        AS matiere,
    cg.nature,
    p.nom || ' ' || p.prenom     AS professeur,
    cg.salle,
    COALESCE(g.nom,'Niveau entière') AS groupe
FROM  creneau cr
JOIN  niveau   cl ON cl.id = cr.niveau_id
JOIN  filiere  f  ON f.id  = cl.filiere_id
JOIN  creneau_groupe cg ON cg.creneau_id = cr.id
JOIN  matiere  m  ON m.id  = cg.matiere_id
LEFT JOIN  prof     p  ON p.id  = cg.prof_id
LEFT JOIN groupe g ON g.id = cg.groupe_id
ORDER BY cr.jour, cr.heure_debut, cl.nom, g.nom;""",
    """CREATE OR REPLACE FUNCTION check_seance_coherence()
RETURNS TRIGGER AS $$
DECLARE
    cg_prof_id   INT;
    cg_niveau_id INT;
    cg_groupe_id INT;
BEGIN
    SELECT cg.prof_id, cr.niveau_id, cg.groupe_id
    INTO   cg_prof_id, cg_niveau_id, cg_groupe_id
    FROM   creneau_groupe cg
    JOIN   creneau cr ON cr.id = cg.creneau_id
    WHERE  cg.id = NEW.creneau_groupe_id;

    IF NEW.prof_id != cg_prof_id THEN
        RAISE EXCEPTION 'Prof incohérent (attendu: %)', cg_prof_id;
    END IF;
    IF NEW.niveau_id != cg_niveau_id THEN
        RAISE EXCEPTION 'Niveau incohérente (attendu: %)', cg_niveau_id;
    END IF;
    IF NEW.groupe_id IS DISTINCT FROM cg_groupe_id THEN
        RAISE EXCEPTION 'Groupe incohérent (attendu: %)', cg_groupe_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;""",
    """CREATE OR REPLACE FUNCTION check_presence_coherence()
RETURNS TRIGGER AS $$
DECLARE
    s_niveau_id INT;
    s_groupe_id INT;
    e_niveau_id INT;
    e_groupe_id INT;
BEGIN
    -- infos séance
    SELECT niveau_id, groupe_id
    INTO s_niveau_id, s_groupe_id
    FROM seance
    WHERE id = NEW.seance_id;

    -- infos étudiant
    SELECT niveau_id, groupe_id
    INTO e_niveau_id, e_groupe_id
    FROM etudiant
    WHERE id = NEW.etudiant_id;

    -- vérification niveau
    IF e_niveau_id != s_niveau_id THEN
        RAISE EXCEPTION 'Étudiant hors niveau';
    END IF;

    -- vérification groupe
    IF s_groupe_id IS NOT NULL 
       AND e_groupe_id IS DISTINCT FROM s_groupe_id THEN
        RAISE EXCEPTION 'Étudiant hors groupe';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;"""
]

with engine.connect() as connection:
    transaction = connection.begin()
    try:
        for cmd in sql_commands:
            print(f"Executing: {cmd[:50]}...")
            connection.execute(text(cmd))
        transaction.commit()
        print("Migration successful!")
    except Exception as e:
        transaction.rollback()
        print(f"Migration failed: {e}")
