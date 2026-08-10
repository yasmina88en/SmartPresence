import insightface

# Initialisation du modèle InsightFace (une seule fois pour toute l'application)
app_face = insightface.app.FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
app_face.prepare(ctx_id=0, det_size=(640, 640))
