from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    # Optional: If you want to tell login type
    login_type: Optional[str] = "PLAYER" 

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str