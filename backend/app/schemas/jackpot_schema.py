from pydantic import BaseModel, FutureDate
from datetime import date
from uuid import UUID

class JackpotCreateRequest(BaseModel):
    entry_fee: float
    currency_code: str
    event_date: date  

class JackpotResponse(BaseModel):
    jackpot_event_id: UUID
    game_date: date
    entry_amount: float
    currency_code: str
    status: str
    total_pool_amount: float