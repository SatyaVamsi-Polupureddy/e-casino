from pydantic import BaseModel, EmailStr
from datetime import date
from uuid import UUID

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str 


class UpdateUserStatusRequest(BaseModel):
    email: EmailStr
    status: str 

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str

class UpdatePlayerStatusRequest(BaseModel):
    email: EmailStr
    status: str 

class AddGameRequest(BaseModel):
    platform_game_id: str
    custom_name: str = None
    min_bet: float
    max_bet: float

class UpdateGameRequest(BaseModel):
    tenant_game_id: str
    min_bet: float
    max_bet: float
    is_active: bool

class CampaignCreate(BaseModel):
    name: str
    bonus_amount: float
    bonus_type: str 
    wagering_requirement: float = 10.0
    expiry_days: int = 30


class KYCUpdateRequest(BaseModel):
    email: str
    status: str 

class JackpotCreateRequest(BaseModel):
    entry_fee: float
    currency_code: str = "USD"
    event_date: date

class JackpotResponse(BaseModel):
    jackpot_event_id: UUID
    game_date: date
    entry_amount: float
    currency_code: str
    status: str
    total_pool_amount: float