from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class PlayGameRequest(BaseModel):
    session_id: str
    bet_amount: float
    prediction: str = None
    wallet_type: str = "REAL"

class GameSessionInit(BaseModel):
    game_id: str


class SessionEndRequest(BaseModel):
    session_id: str


class KYCSubmission(BaseModel):
    document_url: str

class PlayerRegisterRequest(BaseModel):
    tenant_id: UUID
    username: str
    email: EmailStr
    password: str
    country_id: int
    referral_code: Optional[str] = None

class TransactionRequest(BaseModel):
    amount: float

class JackpotEntryRequest(BaseModel):
    jackpot_event_id: str
    wallet_type: str = "REAL" 

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str 