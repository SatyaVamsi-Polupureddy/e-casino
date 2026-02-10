from pydantic import BaseModel, EmailStr
from typing import Optional

class CreateTenantRequest(BaseModel):
    tenant_name: str
    country_id: int
    currency_code: str
    admin_email: EmailStr
    admin_password: str
    kyc_id: Optional[str] = None # UUID from TenantKYCProfile

class RateUpdate(BaseModel):
    rate: float

class CurrencyCreate(BaseModel):
    currency_code: str
    currency_name: str
    symbol: Optional[str] = "$"
    decimal_precision: int = 2

class CountryCreate(BaseModel):
    country_name: str
    iso2_code: str
    iso3_code: str
    default_currency_code: str
    default_timezone: str

class ExchangeRateCreate(BaseModel):
    base_currency: str
    quote_currency: str
    rate: float


class CreateAdminRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateAdminStatusRequest(BaseModel):
    email: EmailStr
    status: str

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str

class PlatformGameCreate(BaseModel):
    title: str
    game_type: str
    default_thumbnail_url: str
    provider: str
    video_url: Optional[str] = None

class PlatformGameUpdate(BaseModel):
    is_active: bool