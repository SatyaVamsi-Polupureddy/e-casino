from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_db_connection

security = HTTPBearer()

async def get_current_user(token_obj: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # HTTPBearer will return an object. We need to get the token string from .credentials
    token = token_obj.credentials
    
    try:
        # 1. Decode the Token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None or role is None:
            raise credentials_exception
            
        return {"user_id": user_id, "role": role}
        
    except JWTError:
        raise credentials_exception


async def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Super Admin previlege required."
        )
    return current_user

async def require_tenant_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["SUPER_ADMIN", "TENANT_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not enough privileges.")
    return current_user



async def require_player(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "PLAYER":
        raise HTTPException(status_code=403, detail="Player privileges required.")
    return current_user



async def verify_tenant_is_approved(current_user: dict = Depends(require_tenant_admin)):
    """
    Blocks action if the Tenant's KYC is not 'APPROVED'.
    Except for Super Admins
    """
    if current_user["role"] == "SUPER_ADMIN":
        return current_user

    user_id = current_user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Join TenantUser -> Tenant to check the MAIN Tenant status
            await cur.execute("""
                SELECT t.kyc_status 
                FROM TenantUser tu
                JOIN Tenant t ON tu.tenant_id = t.tenant_id
                WHERE tu.tenant_user_id = %s
            """, (user_id,))
            result = await cur.fetchone()
            
            if not result:
                raise HTTPException(status_code=401, detail="Tenant profile not found.")
            
            if result['kyc_status'] != 'APPROVED':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Action blocked: Tenant KYC is not APPROVED. Please submit documents."
                )
    return current_user

async def verify_player_is_approved(current_user: dict = Depends(require_player)):
    """
    Blocks action if the Player's KYC is not 'APPROVED'.
    """
    user_id = current_user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Check the Player table status
            await cur.execute("SELECT kyc_status FROM Player WHERE player_id = %s", (user_id,))
            result = await cur.fetchone()
            
            if not result:
                 raise HTTPException(status_code=401, detail="Player profile not found.")

            if result['kyc_status'] != 'APPROVED':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Action blocked: Your KYC is pending or rejected. You cannot play yet."
                )
    return current_user



async def require_staff_or_admin(current_user: dict = Depends(get_current_user)):
    """
    Allow TENANT_ADMIN or TENANT_STAFF.
    """
    if current_user["role"] not in ["TENANT_ADMIN", "TENANT_STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Staff privileges required."
        )
    return current_user

async def verify_staff_is_active(current_user: dict = Depends(require_staff_or_admin)):
    """
    1. Checks if the Staff Member is ACTIVE (not suspended).
    2. Checks if their Tenant is APPROVED (The Gatekeeper).
    """
    user_id = current_user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT tu.status as staff_status, t.kyc_status as tenant_kyc
                FROM TenantUser tu
                JOIN Tenant t ON tu.tenant_id = t.tenant_id
                WHERE tu.tenant_user_id = %s
            """, (user_id,))
            data = await cur.fetchone()
            
            if not data:
                raise HTTPException(status_code=401, detail="User profile not found.")
            
            if data['staff_status'] != 'ACTIVE':
                 raise HTTPException(status_code=403, detail="Your staff account is suspended.")
                 
            if data['tenant_kyc'] != 'APPROVED':
                 raise HTTPException(status_code=403, detail="Casino operation suspended (KYC Pending).")
                 
    return current_user