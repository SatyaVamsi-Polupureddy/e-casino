from pydantic import BaseModel,EmailStr

# 1. Admin updates player's limits
class PlayerLimitUpdateByEmail(BaseModel):
    email: EmailStr
    daily_bet_limit: float
    daily_loss_limit: float
    max_single_bet: float

# 2. Admin updates the CASINO'S default settings for NEW players
class TenantDefaultLimits(BaseModel):
    default_daily_bet_limit: float
    default_daily_loss_limit: float
    default_max_single_bet: float