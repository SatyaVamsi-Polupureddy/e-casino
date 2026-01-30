from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class DepositRequest(BaseModel):
    amount: float
    payment_method: str 

class TransactionResponse(BaseModel):
    transaction_id: UUID
    type: str          
    amount: float
    balance_after: float
    created_at: datetime