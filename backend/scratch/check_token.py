import requests

url = "http://localhost:8000/auth/login"
data = {"email": "test@student.com", "password": "password123"}
response = requests.post(url, json=data)
if response.status_code == 200:
    print(response.json())
else:
    print("Login failed:", response.status_code, response.text)
