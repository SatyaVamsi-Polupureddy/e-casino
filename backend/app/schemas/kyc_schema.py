from pydantic import BaseModel
from typing import Optional
from enum import Enum

class KYCStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# For Tenant Admin to submit
class KYCSubmission(BaseModel):
    document_type: str 
    document_url: str  

# For Super Admin to approve
class KYCReview(BaseModel):
    tenant_id: str
    status: KYCStatus 
    notes: Optional[str] = None