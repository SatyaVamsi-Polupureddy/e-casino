from pydantic import BaseModel, EmailStr
from typing import Optional,Union

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_id: Optional[Union[int, str]] = None
    login_type: str

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str