from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import require_tenant_admin, require_super_admin
from app.schemas.kyc_schema import KYCSubmission, KYCReview
from app.core.dependencies import require_player, verify_tenant_is_approved
from app.core.bonus_service import BonusService
from app.core.audit_logger import log_activity
router = APIRouter(prefix="/kyc", tags=["KYC Operations"])

# tenant Submit Documents ---
@router.post("/tenant/submit")
async def submit_tenant_kyc(
    data: KYCSubmission, 
    current_user: dict = Depends(require_tenant_admin)
):
    admin_id = current_user["user_id"]

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_row = await cur.fetchone()
            if not tenant_row:
                raise HTTPException(status_code=404, detail="Tenant not found")
            tenant_id = tenant_row['tenant_id']

            try:
                await cur.execute("BEGIN;")
                await cur.execute("SELECT tenant_kyc_profile_id FROM TenantKYCProfile WHERE tenant_id = %s", (tenant_id,))
                profile = await cur.fetchone()

                if not profile:
                    await cur.execute(
                        """
                        INSERT INTO TenantKYCProfile (tenant_id, kyc_status, submitted_at)
                        VALUES (%s, 'PENDING', NOW())
                        RETURNING tenant_kyc_profile_id;
                        """,
                        (tenant_id,)
                    )
                    profile_id = (await cur.fetchone())['tenant_kyc_profile_id']
                else:
                    profile_id = profile['tenant_kyc_profile_id']

                await cur.execute("UPDATE Tenant SET kyc_status = 'PENDING' WHERE tenant_id = %s", (tenant_id,))
                await cur.execute("UPDATE TenantKYCProfile SET kyc_status = 'PENDING', submitted_at = NOW() WHERE tenant_kyc_profile_id = %s", (profile_id,))

                #  (Update if exists, Insert if new)
                
                await cur.execute(
                    """
                    INSERT INTO TenantKYCDocument (tenant_kyc_profile_id, document_type, document_reference, kyc_status)
                    VALUES (%s, %s, %s, 'PENDING')
                    ON CONFLICT (tenant_kyc_profile_id, document_type) 
                    DO UPDATE SET 
                        document_reference = EXCLUDED.document_reference,
                        kyc_status = 'PENDING';
                    """,
                    (profile_id, data.document_type, data.document_url)
                )

                await conn.commit()
                return {"status": "submitted", "message": "KYC Document updated successfully"}

            except Exception as e:
                await conn.rollback()
                print(f"KYC SUBMIT ERROR: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
            
# SUPER ADMIN  Approve/Reject tenant
@router.put("/tenant/review")
async def review_tenant_kyc(
    review: KYCReview, 
    admin: dict = Depends(require_super_admin)
):
    """
    Updates TenantKYCProfile AND the main Tenant table.
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute("BEGIN;")

                # 1. Update Profile Status
                await cur.execute(
                    """
                    UPDATE TenantKYCProfile 
                    SET kyc_status = %s, reviewed_at = NOW()
                    WHERE tenant_id = %s
                    RETURNING tenant_kyc_profile_id;
                    """,
                    (review.status, review.tenant_id)
                )
                
                # 2. Update Main Tenant Table Status
                await cur.execute(
                    """
                    UPDATE Tenant 
                    SET kyc_status = %s
                    WHERE tenant_id = %s;
                    """,
                    (review.status, review.tenant_id)
                )
                
                if review.status in ['APPROVED', 'REJECTED']:
                     await cur.execute(
                        """
                        UPDATE TenantKYCDocument 
                        SET kyc_status = %s, verified_at = NOW()
                        WHERE tenant_kyc_profile_id IN (SELECT tenant_kyc_profile_id FROM TenantKYCProfile WHERE tenant_id = %s)
                        """,
                        (review.status, review.tenant_id)
                    )

                await conn.commit()
                return {"status": "success", "new_kyc_status": review.status}

            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=500, detail=str(e))
            
# player submit documents
@router.post("/player/submit")
async def submit_player_kyc(
    data: KYCSubmission, 
    current_user: dict = Depends(require_player)
):
    player_id = current_user["user_id"]

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute("BEGIN;")
                await cur.execute("SELECT player_kyc_profile_id FROM PlayerKYCProfile WHERE player_id = %s", (player_id,))
                profile = await cur.fetchone()

                if profile:
                    # UPDATE existing profile
                    profile_id = profile['player_kyc_profile_id']
                    await cur.execute(
                        """
                        UPDATE PlayerKYCProfile 
                        SET kyc_status = 'PENDING', 
                            submitted_at = NOW(),
                            document_reference = %s,
                            document_type = %s
                        WHERE player_kyc_profile_id = %s
                        """,
                        (data.document_url, data.document_type, profile_id)
                    )
                else:
                    # INSERT new profile
                    await cur.execute(
                        """
                        INSERT INTO PlayerKYCProfile (player_id, kyc_status, submitted_at, document_reference, document_type)
                        VALUES (%s, 'PENDING', NOW(), %s, %s)
                        RETURNING player_kyc_profile_id;
                        """,
                        (player_id, data.document_url, data.document_type)
                    )
                    profile_id = (await cur.fetchone())['player_kyc_profile_id']
                await cur.execute("UPDATE Player SET kyc_status = 'PENDING' WHERE player_id = %s", (player_id,))
                await cur.execute(
                    """
                    UPDATE PlayerKYCDocument 
                    SET document_type = %s, 
                        document_reference = %s, 
                        kyc_status = 'PENDING'
                    WHERE player_kyc_profile_id = %s
                    """,
                    (data.document_type, data.document_url, profile_id)
                )
                if cur.rowcount == 0:
                    await cur.execute(
                        """
                        INSERT INTO PlayerKYCDocument (player_kyc_profile_id, document_type, document_reference, kyc_status)
                        VALUES (%s, %s, %s, 'PENDING')
                        """,
                        (profile_id, data.document_type, data.document_url)
                    )

                await conn.commit()
                return {"status": "submitted", "message": "Player KYC Document uploaded"}

            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=500, detail=str(e))

# tenant admin review player 
@router.put("/player/review")
async def review_player_kyc(
    review: dict, 
    admin: dict = Depends(verify_tenant_is_approved)
):
    admin_id = admin["user_id"]

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                # 1. Verification Logic
                await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
                row = await cur.fetchone()
                if not row: raise HTTPException(403, "Admin not found")
                admin_tenant_id = row['tenant_id']

                player_id = review.get('player_id')
                new_status = review.get('status')
                
                if not player_id or not new_status:
                     raise HTTPException(400, "Missing player_id or status")

                # Fetch Player Data 
                await cur.execute("SELECT kyc_status, tenant_id, referred_by_player_id FROM Player WHERE player_id = %s", (player_id,))
                player_row = await cur.fetchone()
                
                if not player_row: raise HTTPException(404, "Player not found.")
                if str(player_row['tenant_id']) != str(admin_tenant_id):
                    raise HTTPException(403, "Cannot manage players from another casino.")
                await cur.execute(
                    """
                    UPDATE PlayerKYCProfile 
                    SET kyc_status = %s, 
                        reviewed_at = NOW(), 
                        reviewed_by = %s 
                    WHERE player_id = %s
                    """, 
                    (new_status, admin_id, player_id)
                )
                
                # Update Main Player Table
                await cur.execute("UPDATE Player SET kyc_status = %s WHERE player_id = %s", (new_status, player_id))
                if new_status == 'APPROVED':
                    try:
                        # WELCOME BONUS
                        await cur.execute(
                            """
                            SELECT campaign_id, bonus_amount 
                            FROM BonusCampaign 
                            WHERE tenant_id = %s AND bonus_type = 'WELCOME' AND is_active = TRUE
                            LIMIT 1
                            """, 
                            (admin_tenant_id,)
                        )
                        welcome_campaign = await cur.fetchone()

                        if welcome_campaign:
                            await BonusService.grant_bonus_by_id(
                                cur, 
                                str(player_id), 
                                str(welcome_campaign['campaign_id']), 
                                float(welcome_campaign['bonus_amount'])
                            )
                            print(f"Welcome Bonus (${welcome_campaign['bonus_amount']}) granted to {player_id}")

                        # REFERRAL BONUS
                        if player_row['referred_by_player_id']:
                            referrer_id = player_row['referred_by_player_id']

                            await cur.execute(
                                """
                                SELECT campaign_id, bonus_amount 
                                FROM BonusCampaign 
                                WHERE tenant_id = %s AND bonus_type = 'REFERRAL' AND is_active = TRUE
                                LIMIT 1
                                """, 
                                (admin_tenant_id,)
                            )
                            referral_campaign = await cur.fetchone()

                            if referral_campaign:
                                await BonusService.grant_bonus_by_id(
                                    cur, 
                                    str(referrer_id), 
                                    str(referral_campaign['campaign_id']), 
                                    float(referral_campaign['bonus_amount'])
                                )
                                # print(f" Referral Bonus (${referral_campaign['bonus_amount']}) granted to referrer {referrer_id}")

                    except Exception as bonus_error:
                        print(f" Bonus System Warning: {bonus_error}")

                await conn.commit()

                log_activity(
                    tenant_id=admin_tenant_id,
                    user_email=admin.get("email", "unknown"),
                    action="REVIEW_KYC",
                    details=f"Player {player_id} KYC set to {new_status}"
                )
                return {"status": "success", "player_kyc_status": new_status}

            except Exception as e:
                await conn.rollback()
                # print(f" KYC CRASH: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            
@router.get("/super-admin/pending-tenants")
async def list_pending_tenants(admin: dict = Depends(require_super_admin)):
    """
    Returns a list of unique Tenants with their grouped KYC documents.
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT 
                    t.tenant_id, 
                    t.tenant_name, 
                    t.kyc_status, 
                    p.submitted_at, 
                    d.document_reference,
                    d.document_type
                FROM Tenant t
                JOIN TenantKYCProfile p ON t.tenant_id = p.tenant_id
                LEFT JOIN TenantKYCDocument d ON p.tenant_kyc_profile_id = d.tenant_kyc_profile_id
                WHERE t.kyc_status = 'PENDING'
                ORDER BY p.submitted_at DESC
                """
            )
            rows = await cur.fetchall()
            tenants_map = {}
            for row in rows:
                tid = row['tenant_id']
                if tid not in tenants_map:
                    tenants_map[tid] = {
                        "tenant_id": tid,
                        "tenant_name": row['tenant_name'],
                        "kyc_status": row['kyc_status'],
                        "submitted_at": row['submitted_at'],
                        "documents": []
                    }
                
                if row['document_reference']:
                    tenants_map[tid]["documents"].append({
                        "type": row['document_type'] or "UNKNOWN",
                        "url": row['document_reference']
                    })

            return list(tenants_map.values())