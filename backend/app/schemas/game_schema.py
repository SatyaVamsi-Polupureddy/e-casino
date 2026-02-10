from pydantic import BaseModel
from typing import Optional, Any, Dict

class GameCreateRequest(BaseModel):
    game_name: str         
    min_bet: float
    max_bet: float
    payout_multiplier: float

class GameResponse(BaseModel):
    game_id: str
    game_name: str
    min_bet: float
    max_bet: float
    status: str

class GamePlayRequest(BaseModel):
    bet_amount: float
    bet_data: Optional[Dict[str, Any]] = {} 
    # "BONUS" or "REAL".
    use_wallet_type: Optional[str] = None

class GamePlayResponse(BaseModel):
    game_id: str
    game_name: str
    bet_amount: float
    win_amount: float
    balance_after: float
    outcome: str       
    game_data: dict     
    session_id: str