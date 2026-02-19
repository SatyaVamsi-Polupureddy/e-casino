from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import verify_tenant_is_approved
from app.core.audit_logger import log_activity
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


router = APIRouter(prefix="/tenant-admin/bonus", tags=["Bonus Operations"])

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
    wagering_requirement: float = 0.0 
    start_date: datetime 
    end_date: Optional[datetime] = None


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

            log_activity(
                tenant_id=tenant_id,
                user_email=user.get("email", "unknown"),
                action="UPDATE_CAMPAIGN",
                details=f"Updated Campaign {campaign_id}"
            )
            return {"status": "success", "message": "Campaign updated"}

# Soft Delete 
@router.delete("/campaign/{campaign_id}")
async def delete_campaign(campaign_id: str, user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']      
            # make inactive 
            await cur.execute(
                """
                UPDATE BonusCampaign 
                SET is_active = FALSE, name = CONCAT(name, ' [ARCHIVED]') 
                WHERE campaign_id = %s AND tenant_id = %s AND name NOT LIKE '%%[ARCHIVED]%%'
                """, 
                (campaign_id, tenant_id)
            )
            await conn.commit()

            log_activity(
                tenant_id=tenant_id,
                user_email=user.get("email", "unknown"),
                action="ARCHIVE_CAMPAIGN",
                details=f"Archived Campaign {campaign_id}"
            )
            return {"status": "success", "message": "Campaign archived (Soft Deleted)"}



@router.post("/campaigns")
async def create_campaign(data: CampaignCreate, user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    valid_types = ['WELCOME', 'REFERRAL', 'FESTIVAL', 'MONTHLY_DEPOSIT', 'BET_THRESHOLD']
    if data.bonus_type not in valid_types:
        raise HTTPException(400, "Invalid Bonus Type")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            if data.bonus_type in ['WELCOME', 'REFERRAL']:
                await cur.execute(
                    """
                    UPDATE BonusCampaign 
                    SET is_active = FALSE, name = CONCAT(name, ' [ARCHIVED]')
                    WHERE tenant_id = %s AND bonus_type = %s AND is_active = TRUE
                    """, 
                    (tenant_id, data.bonus_type)
                )
            
            
            await cur.execute(
                """
                INSERT INTO BonusCampaign 
                (tenant_id, name, bonus_amount, bonus_type, wagering_requirement, start_date, end_date, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW()) 
                RETURNING campaign_id
                """,
                (
                    tenant_id, 
                    data.name, 
                    data.bonus_amount, 
                    data.bonus_type, 
                    data.wagering_requirement, 
                    data.start_date,
                    data.end_date
                )
            )
            await conn.commit()

            log_activity(
                tenant_id=tenant_id,
                user_email=user.get("email", "unknown"),
                action="CREATE_CAMPAIGN",
                details=f"Created {data.bonus_type} Campaign: {data.name}"
            )
            return {"status": "success", "message": f"Active {data.bonus_type} campaign created."}


@router.get("/campaigns")
async def get_campaigns(user: dict = Depends(verify_tenant_is_approved)):
    admin_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # 1. AUTO-EXPIRE: Mark campaigns inactive if End Date has passed
            await cur.execute(
                """
                UPDATE BonusCampaign
                SET is_active = FALSE
                WHERE tenant_id = %s AND is_active = TRUE AND end_date IS NOT NULL AND end_date < NOW()
                """,
                (tenant_id,)
            )
            await conn.commit()

            # 2. Fetch List
            await cur.execute(
                """
                SELECT * FROM BonusCampaign 
                WHERE tenant_id = %s 
                ORDER BY is_active DESC, created_at DESC
                """, 
                (tenant_id,)
            )
            return await cur.fetchall()

#  DISTRIBUTE LOGIC 
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
            await cur.execute("SELECT * FROM BonusCampaign WHERE campaign_id = %s AND tenant_id = %s", (campaign_id, tenant_id))
            camp = await cur.fetchone()
            if not camp: raise HTTPException(404, "Campaign not found")
            if not camp['is_active']: raise HTTPException(400, "Campaign is inactive")

            try:
                await cur.execute("BEGIN;")
                
                affected_count = 0
                if camp['bonus_type'] == 'FESTIVAL':
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
                    affected_count = len(affected_wallets)
                    if affected_wallets:
                        values_list = [(w['wallet_id'], 'BONUS_CREDIT', data.amount, 'CAMPAIGN', campaign_id) for w in affected_wallets]
                        await cur.executemany(
                            """
                            INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                            VALUES (%s, %s, %s, 0, %s, %s, NOW())
                            """,
                            values_list
                        )
                elif camp['bonus_type'] == 'MONTHLY_DEPOSIT':
                    percentage = float(camp['bonus_amount'])
                    await cur.execute(
                        """
                        WITH MonthlyStats AS (
                            SELECT 
                                p.player_id,
                                SUM(wt.amount) as total_deposit,
                                (SUM(wt.amount) * %s / 100) as bonus_to_give
                            FROM WalletTransaction wt
                            JOIN Wallet w ON wt.wallet_id = w.wallet_id
                            JOIN Player p ON w.player_id = p.player_id
                            WHERE 
                                p.tenant_id = %s
                                AND w.wallet_type = 'REAL' 
                                AND wt.transaction_type = 'DEPOSIT'
                                AND wt.created_at >= DATE_TRUNC('month', CURRENT_DATE) -- Current Month
                            GROUP BY p.player_id
                        ),
                        UpdatedWallets AS (
                            INSERT INTO Wallet (player_id, wallet_type, currency_code, balance)
                            SELECT player_id, 'BONUS', 'USD', bonus_to_give
                            FROM MonthlyStats
                            WHERE bonus_to_give > 0
                            ON CONFLICT (player_id, wallet_type)
                            DO UPDATE SET balance = Wallet.balance + EXCLUDED.balance
                            RETURNING wallet_id, player_id, balance as new_balance
                        )
                        -- Finally, Insert Transactions specifically for the amount given
                        INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                        SELECT 
                            uw.wallet_id, 
                            'BONUS_CREDIT', 
                            ms.bonus_to_give, 
                            uw.new_balance, 
                            'CAMPAIGN', 
                            %s, 
                            NOW()
                        FROM UpdatedWallets uw
                        JOIN MonthlyStats ms ON uw.player_id = ms.player_id;
                        """,
                        (percentage, tenant_id, campaign_id)
                    )
                    
                    affected_count = cur.rowcount

                # Auto-Archive Campaign
              
                if camp['bonus_type'] in ['FESTIVAL', 'MONTHLY_DEPOSIT']:
                    await cur.execute(
                        """
                        UPDATE BonusCampaign 
                        SET is_active = FALSE, name = CONCAT(name, ' [ARCHIVED]') 
                        WHERE campaign_id = %s
                        """, 
                        (campaign_id,)
                    )

                await conn.commit()

                log_activity(
                    tenant_id=tenant_id,
                    user_email=user.get("email", "unknown"),
                    action="DISTRIBUTE_BONUS",
                    details=f"Campaign {campaign_id}: Distributed to {affected_count} players"
                )
                return {"status": "success", "message": f"Distributed bonuses to {affected_count} players. Campaign Archived."}
                
            except Exception as e:
                await conn.rollback()
                print(f"DIST ERROR: {e}")
                raise HTTPException(status_code=500, detail=str(e))