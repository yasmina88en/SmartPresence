from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    must_change_password: bool

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str