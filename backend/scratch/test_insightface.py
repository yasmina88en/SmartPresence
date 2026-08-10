import cv2
import numpy as np
from app.services.facial_service import app_face

# create a blank image
img = np.zeros((640, 640, 3), dtype=np.uint8)
try:
    faces = app_face.get(img)
    print("InsightFace is working. Detected faces:", len(faces))
except Exception as e:
    print("InsightFace error:", e)
