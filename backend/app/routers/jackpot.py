import random
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import verify_tenant_is_approved
from app.schemas.jackpot_schema import JackpotCreateRequest, JackpotResponse

router = APIRouter(prefix="/jackpot", tags=["Jackpot Operations"])

# --- TENANT ADMIN: Create Scheduled Jackpot ---
@router.post("/create-event", response_model=JackpotResponse)
async def create_jackpot(
    data: JackpotCreateRequest, 
    admin: dict = Depends(verify_tenant_is_approved)
):
    admin_id = admin["user_id"]
    
    if data.entry_fee < 0:
        raise HTTPException(status_code=400, detail="Entry fee cannot be negative.")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_row = await cur.fetchone()
            if not tenant_row:
                 raise HTTPException(status_code=404, detail="Tenant Admin not found.")
            tenant_id = tenant_row['tenant_id']
            
            # 2. Insert Event with User-Defined Date
            await cur.execute(
                """
                INSERT INTO JackpotEvent 
                (tenant_id, game_date, entry_amount, currency_code, status, total_pool_amount, created_at)
                VALUES (%s, %s, %s, %s, 'OPEN', 0, NOW())
                RETURNING jackpot_event_id, game_date, entry_amount, currency_code, status, total_pool_amount
                """,
                (tenant_id, data.event_date, data.entry_fee, data.currency_code)
            )
            event = await cur.fetchone()
            await conn.commit()
            
            return event

# --- TENANT ADMIN: View Active Jackpots ---
@router.get("/active-list", response_model=list[JackpotResponse])
async def list_active_jackpots(admin: dict = Depends(verify_tenant_is_approved)):
    """
    Returns all OPEN jackpots for this Tenant. 
    The Admin can use the 'jackpot_event_id' from this list to call /draw-winner.
    """
    admin_id = admin["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # 2. Fetch OPEN events
            await cur.execute(
                """
                SELECT jackpot_event_id, game_date, entry_amount, currency_code, status, total_pool_amount
                FROM JackpotEvent 
                WHERE tenant_id = %s AND status = 'OPEN'
                ORDER BY game_date ASC
                """,
                (tenant_id,)
            )
            return await cur.fetchall()

 