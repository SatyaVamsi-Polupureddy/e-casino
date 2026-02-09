from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import verify_tenant_is_approved
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/tenant-admin/bonus", tags=["Bonus Operations"])

# --- SCHEMAS ---
class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    bonus_amount: Optional[float] = None
    is_active: Optional[bool] = None

class DistributeRequest(BaseModel):
    amount: float

class CampaignCreate(BaseModel):
    name: str
    bonus_amount: float
    bonus_type: str 
    wagering_requirement: float = 10.0
    expiry_days: int = 30


# --- 1. GET CAMPAIGNS (Sorted: Active First, then Date) ---
@router.get("/campaigns")
async def get_campaigns(user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # UPDATED QUERY:
            # 1. is_active DESC puts TRUE (Active) at the top.
            # 2. created_at DESC sorts them by newest within those groups.
            await cur.execute(
                """
                SELECT * FROM BonusCampaign 
                WHERE tenant_id = %s 
                ORDER BY is_active DESC, created_at DESC
                """, 
                (tenant_id,)
            )
            return await cur.fetchall()

# --- 2. CREATE CAMPAIGN ---
# In backend/app/routers/bonus.py (or wherever this route is)

@router.post("/campaigns")
async def create_campaign(data: CampaignCreate, user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    
    # Validate Type
    if data.bonus_type not in ['WELCOME', 'REFERRAL', 'FESTIVAL']:
        raise HTTPException(400, "Invalid Bonus Type")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            # --- AUTO-DEACTIVATE OLD CAMPAIGNS ---
            # If creating a new WELCOME or REFERRAL campaign, deactivate the old active one.
            # (We allow multiple FESTIVAL campaigns to run simultaneously)
            if data.bonus_type in ['WELCOME', 'REFERRAL']:
                await cur.execute(
                    """
                    UPDATE BonusCampaign 
                    SET is_active = FALSE 
                    WHERE tenant_id = %s AND bonus_type = %s AND is_active = TRUE
                    """, 
                    (tenant_id, data.bonus_type)
                )
            
            # Create New Campaign
            await cur.execute(
                """
                INSERT INTO BonusCampaign (tenant_id, name, bonus_amount, bonus_type, wagering_requirement, expiry_days, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW()) 
                RETURNING campaign_id
                """,
                (tenant_id, data.name, data.bonus_amount, data.bonus_type, data.wagering_requirement, data.expiry_days)
            )
            await conn.commit()
            return {"status": "success", "message": f"Active {data.bonus_type} campaign created."}

# --- 3. UPDATE CAMPAIGN (Modify/Suspend) 
@router.patch("/campaign/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignUpdate, user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # Dynamic Update
            fields = []
            values = []
            if data.name is not None:
                fields.append("name = %s")
                values.append(data.name)
            if data.bonus_amount is not None:
                fields.append("bonus_amount = %s")
                values.append(data.bonus_amount)
            if data.is_active is not None:
                fields.append("is_active = %s")
                values.append(data.is_active)
            
            if not fields: return {"message": "No changes"}
            
            values.append(campaign_id)
            values.append(tenant_id)
            
            query = f"UPDATE BonusCampaign SET {', '.join(fields)} WHERE campaign_id = %s AND tenant_id = %s"
            
            await cur.execute(query, tuple(values))
            await conn.commit()
            return {"status": "success", "message": "Campaign updated"}

# --- 4. DELETE CAMPAIGN (Soft Delete / Archive) ---
@router.delete("/campaign/{campaign_id}")
async def delete_campaign(campaign_id: str, user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # SOFT DELETE: Just mark inactive and append [ARCHIVED] to name to avoid confusion
            await cur.execute(
                """
                UPDATE BonusCampaign 
                SET is_active = FALSE, name = CONCAT(name, ' [ARCHIVED]') 
                WHERE campaign_id = %s AND tenant_id = %s AND name NOT LIKE '%%[ARCHIVED]%%'
                """, 
                (campaign_id, tenant_id)
            )
            await conn.commit()
            return {"status": "success", "message": "Campaign archived (Soft Deleted)"}

 
 # ... (imports and other endpoints remain the same) ...

# --- 5. DISTRIBUTE BONUS (Mass Action) ---
@router.post("/campaign/{campaign_id}/distribute-all")
async def distribute_bonus_to_all(
    campaign_id: str,
    data: DistributeRequest, 
    user: dict = Depends(verify_tenant_is_approved)
):
    admin_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # A. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # B. Verify Campaign
            await cur.execute("SELECT * FROM BonusCampaign WHERE campaign_id = %s AND tenant_id = %s", (campaign_id, tenant_id))
            camp = await cur.fetchone()
            if not camp: raise HTTPException(404, "Campaign not found")
            if not camp['is_active']: raise HTTPException(400, "Campaign is inactive")

            try:
                await cur.execute("BEGIN;")
                
                # C. Bulk Update/Insert Wallets
                await cur.execute(
                    """
                    INSERT INTO Wallet (player_id, wallet_type, currency_code, balance)
                    SELECT player_id, 'BONUS', 'USD', %s
                    FROM Player 
                    WHERE tenant_id = %s AND status = 'ACTIVE'
                    ON CONFLICT (player_id, wallet_type) 
                    DO UPDATE SET balance = Wallet.balance + %s
                    RETURNING wallet_id;
                    """,
                    (data.amount, tenant_id, data.amount)
                )
                affected_wallets = await cur.fetchall()
                
                # D. Log Transactions
                if affected_wallets:
                    values_list = [(w['wallet_id'], 'BONUS_CREDIT', data.amount, 'CAMPAIGN', campaign_id) for w in affected_wallets]
                    await cur.executemany(
                        """
                        INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                        VALUES (%s, %s, %s, 0, %s, %s, NOW())
                        """,
                        values_list
                    )

                # E. Auto-Archive Festival Campaigns (CHANGED LOGIC HERE)
                if camp['bonus_type'] == 'FESTIVAL':
                    await cur.execute(
                        """
                        UPDATE BonusCampaign 
                        SET is_active = FALSE, name = CONCAT(name, ' [ARCHIVED]') 
                        WHERE campaign_id = %s
                        """, 
                        (campaign_id,)
                    )

                await conn.commit()
                return {"status": "success", "message": f"Distributed to {len(affected_wallets)} players. Campaign Archived."}
                
            except Exception as e:
                await conn.rollback()
                print(f"DIST ERROR: {e}")
                raise HTTPException(status_code=500, detail=str(e))