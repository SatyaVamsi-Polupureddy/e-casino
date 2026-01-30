from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class StaffPlayerRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    country_id: int

class WithdrawalInitRequest(BaseModel):
    player_email: EmailStr
    amount: float

class WithdrawalVerifyRequest(BaseModel):
    player_email: EmailStr
    otp_code: str


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class KYCUploadRequest(BaseModel):
    player_email: str
    doc_url: str