import enum


class JourSemaine(enum.Enum):
    LUNDI = "LUNDI"
    MARDI = "MARDI"
    MERCREDI = "MERCREDI"
    JEUDI = "JEUDI"
    VENDREDI = "VENDREDI"
    SAMEDI = "SAMEDI"


class Semestre(enum.Enum):
    S1 = "S1"
    S2 = "S2"


class StatutSeance(enum.Enum):
    PLANIFIEE = "PLANIFIEE"
    ACTIVE = "ACTIVE"
    TERMINEE = "TERMINEE"


class StatutPresence(enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"

class NatureSeance(enum.Enum):
    Cours = "Cours"
    TD = "TD"
    TP = "TP"
    Cours_TD = "Cours/TD"
    Cours_TP = "Cours/TP"
    Cours_TD_TP = "Cours/TD/TP"