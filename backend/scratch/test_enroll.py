import requests
import json
import io

url = "http://localhost:8000/auth/login"
data = {"email": "test@student.com", "password": "password123"}
response = requests.post(url, json=data)
if response.status_code == 200:
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # send a dummy image
    image = io.BytesIO(b"dummy image data")
    files = {"photo": ("test.jpg", image, "image/jpeg")}
    
    enroll_url = "http://localhost:8000/etudiant/enroll/face"
    res = requests.post(enroll_url, headers=headers, files=files)
    print(res.status_code)
    print(res.text)
else:
    print("Login failed:", response.status_code, response.text)
