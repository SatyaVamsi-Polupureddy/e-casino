from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import require_tenant_admin, require_super_admin
from app.schemas.kyc_schema import KYCSubmission, KYCReview
from app.core.dependencies import require_player, verify_tenant_is_approved
from app.core.bonus_service import BonusService

router = APIRouter(prefix="/kyc", tags=["KYC Operations"])

# --- TENANT SIDE: Submit Documents ---
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
            tenant_id = tenant_row['tenant_id']

            try:
                await cur.execute("BEGIN;")

                # 2. Create or Get 'PENDING' Profile
                # Check if a profile already exists
                await cur.execute("SELECT tenant_kyc_profile_id FROM TenantKYCProfile WHERE tenant_id = %s", (tenant_id,))
                profile = await cur.fetchone()

                if not profile:
                    # Create new profile
                    await cur.execute(
                        """
                        INSERT INTO TenantKYCProfile (tenant_id, kyc_status, submitted_at)
                        VALUES (%s, 'PENDING', NOW())
                        RETURNING tenant_kyc_profile_id;
                        """,
                        (tenant_id,)
                    )
                    profile_id = (await cur.fetchone())['tenant_kyc_profile_id']
                    
                    # Update Tenant Table status
                    await cur.execute("UPDATE Tenant SET kyc_status = 'PENDING' WHERE tenant_id = %s", (tenant_id,))
                else:
                    profile_id = profile['tenant_kyc_profile_id']

                # 3. Add the Document
                await cur.execute(
                    """
                    INSERT INTO TenantKYCDocument (tenant_kyc_profile_id, document_type, document_reference, kyc_status)
                    VALUES (%s, %s, %s, 'PENDING')
                    """,
                    (profile_id, data.document_type, data.document_url)
                )

                await conn.commit()
                return {"status": "submitted", "message": "KYC Document uploaded for review"}

            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=500, detail=str(e))

# --- SUPER ADMIN SIDE: Approve/Reject ---
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
                # This is crucial because the rest of the app checks the Tenant table, not the profile.
                await cur.execute(
                    """
                    UPDATE Tenant 
                    SET kyc_status = %s
                    WHERE tenant_id = %s;
                    """,
                    (review.status, review.tenant_id)
                )
                
                # 3. (Optional) Auto-update documents to match profile status
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
            

# --- PLAYER SIDE: Submit Documents ---
@router.post("/player/submit")
async def submit_player_kyc(
    data: KYCSubmission, 
    current_user: dict = Depends(require_player) # Standard login required
):
    player_id = current_user["user_id"]

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute("BEGIN;")

                # 1. Check/Create Profile
                await cur.execute("SELECT player_kyc_profile_id FROM PlayerKYCProfile WHERE player_id = %s", (player_id,))
                profile = await cur.fetchone()

                if not profile:
                    await cur.execute(
                        """
                        INSERT INTO PlayerKYCProfile (player_id, kyc_status, submitted_at)
                        VALUES (%s, 'PENDING', NOW())
                        RETURNING player_kyc_profile_id;
                        """,
                        (player_id,)
                    )
                    profile_id = (await cur.fetchone())['player_kyc_profile_id']
                    
                    # Update Player Table
                    await cur.execute("UPDATE Player SET kyc_status = 'PENDING' WHERE player_id = %s", (player_id,))
                else:
                    profile_id = profile['player_kyc_profile_id']

                # 2. Add Document
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

# --- TENANT ADMIN SIDE: Approve Player ---
# @router.put("/player/review")
# async def review_player_kyc(
#     review: dict, # Expected JSON: {"player_id": "uuid", "status": "APPROVED" or "REJECTED"}
#     admin: dict = Depends(verify_tenant_is_approved)
# ):
#     """
#     Tenant Admin approves/rejects a Player.
#     If APPROVED: Triggers Welcome Bonus and Referral Bonus (if configured).
#     """
#     admin_id = admin["user_id"]

#     async with get_db_connection() as conn:
#         async with conn.cursor() as cur:
#             try:
#                 # 1. Get Player Data & Verify Tenant Ownership
#                 # We need to ensure the admin owns this player before touching them.
#                 await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
#                 admin_tenant_id = (await cur.fetchone())['tenant_id']

#                 player_id = review['player_id']
                
#                 await cur.execute(
#                     """
#                     SELECT kyc_status, tenant_id, referral_code 
#                     FROM Player 
#                     WHERE player_id = %s
#                     """, 
#                     (player_id,)
#                 )
#                 player_row = await cur.fetchone()
                
#                 if not player_row:
#                     raise HTTPException(status_code=404, detail="Player not found.")
                
#                 if str(player_row['tenant_id']) != str(admin_tenant_id):
#                     raise HTTPException(status_code=403, detail="Cannot manage players from another casino.")
                
#                 # Prevent Double-Approval
#                 if player_row['kyc_status'] == 'APPROVED':
#                     return {"message": "Player is already approved. No changes made."}

#                 # Start Transaction
#                 await cur.execute("BEGIN;")

#                 # 2. Update KYC Profile & Player Status
#                 new_status = review['status']
                
#                 # Update Profile (Audit history)
#                 await cur.execute(
#                     """
#                     UPDATE PlayerKYCProfile 
#                     SET kyc_status = %s, reviewed_at = NOW() 
#                     WHERE player_id = %s
#                     """,
#                     (new_status, player_id)
#                 )
                
#                 # Update Main Player Table
#                 await cur.execute(
#                     "UPDATE Player SET kyc_status = %s WHERE player_id = %s",
#                     (new_status, player_id)
#                 )

#                 # ====================================================
#                 # 🚀 BONUS TRIGGERS (Only on Approval)
#                 # ====================================================
#                 if new_status == 'APPROVED':
#                     tenant_id = player_row['tenant_id']

#                     # A. Fetch Tenant's Bonus Configuration
#                     # We check what the Admin has selected as the current "Welcome" and "Referral" campaigns
#                     await cur.execute(
#                         """
#                         SELECT welcome_bonus_campaign_id, referral_bonus_campaign_id 
#                         FROM Tenant 
#                         WHERE tenant_id = %s
#                         """,
#                         (tenant_id,)
#                     )
#                     config = await cur.fetchone()

#                     if config:
#                         # B. GRANT WELCOME BONUS (If configured)
#                         if config['welcome_bonus_campaign_id']:
#                             # Note: We pass 50.0 as default amount, or you could add 'default_amount' 
#                             # to the BonusCampaign table to make this dynamic too.
#                             await BonusService.grant_bonus_by_id(
#                                 cur, 
#                                 player_id, 
#                                 config['welcome_bonus_campaign_id'], 
#                                 amount_override=50.0 
#                             )

#                         # C. GRANT REFERRAL BONUS (If configured & Code exists)
#                         if config['referral_bonus_campaign_id'] and player_row['referral_code']:
#                             used_code = player_row['referral_code']
                            
#                             # Find the Referrer (The person who owns this code)
#                             await cur.execute(
#                                 """
#                                 SELECT player_id FROM Player 
#                                 WHERE my_referral_code = %s AND tenant_id = %s
#                                 """,
#                                 (used_code, tenant_id)
#                             )
#                             referrer = await cur.fetchone()
                            
#                             if referrer:
#                                 # Grant Bonus to the REFERRER
#                                 await BonusService.grant_bonus_by_id(
#                                     cur, 
#                                     referrer['player_id'], 
#                                     config['referral_bonus_campaign_id'], 
#                                     amount_override=25.0 
#                                 )

#                 await conn.commit()
#                 return {"status": "success", "player_kyc_status": new_status}

#             except Exception as e:
#                 await conn.rollback()
#                 raise HTTPException(status_code=500, detail=str(e))

# backend/app/routers/kyc.py

# backend/app/routers/kyc.py

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

                player_id = review.get('player_id') # Safer get
                new_status = review.get('status')
                
                if not player_id or not new_status:
                     raise HTTPException(400, "Missing player_id or status")

                await cur.execute("SELECT kyc_status, tenant_id FROM Player WHERE player_id = %s", (player_id,))
                player_row = await cur.fetchone()
                
                if not player_row: raise HTTPException(404, "Player not found.")
                if str(player_row['tenant_id']) != str(admin_tenant_id):
                    raise HTTPException(403, "Cannot manage players from another casino.")

                # 2. Update Status
                # (You don't strictly need 'BEGIN' if using conn.commit(), but it's fine to keep)
                
                # Update Profile (Check if row exists, usually safer)
                await cur.execute("UPDATE PlayerKYCProfile SET kyc_status = %s, reviewed_at = NOW() WHERE player_id = %s", (new_status, player_id))
                
                # Update Main Player Table
                await cur.execute("UPDATE Player SET kyc_status = %s WHERE player_id = %s", (new_status, player_id))

                # 3. 🛡️ SAFE BONUS LOGIC
                if new_status == 'APPROVED':
                    try:
                        await cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='tenant' AND column_name='welcome_bonus_campaign_id'")
                        if await cur.fetchone():
                            await cur.execute("SELECT welcome_bonus_campaign_id FROM Tenant WHERE tenant_id = %s", (admin_tenant_id,))
                            # Placeholder for bonus logic
                            # config = await cur.fetchone()
                    except Exception as bonus_error:
                        print(f"⚠️ Bonus System Warning: {bonus_error}")

                # ✅ CRITICAL FIX: Use conn.commit(), not cur.execute("COMMIT")
                await conn.commit()
                
                return {"status": "success", "player_kyc_status": new_status}

            except Exception as e:
                # ✅ CRITICAL FIX: Use conn.rollback()
                await conn.rollback()
                print(f"❌ KYC CRASH: {e}")
                raise HTTPException(status_code=500, detail=str(e))
@router.get("/super-admin/pending-tenants")
async def list_pending_tenants(admin: dict = Depends(require_super_admin)):
    """
    Returns a list of all Tenants who have submitted KYC but are not yet approved.
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT t.tenant_id, t.tenant_name, t.kyc_status, p.submitted_at, d.document_reference
                FROM Tenant t
                JOIN TenantKYCProfile p ON t.tenant_id = p.tenant_id
                LEFT JOIN TenantKYCDocument d ON p.tenant_kyc_profile_id = d.tenant_kyc_profile_id
                WHERE t.kyc_status = 'PENDING'
                """
            )
            return await cur.fetchall()

@router.get("/tenant-admin/pending-players")
async def list_pending_players(admin: dict = Depends(verify_tenant_is_approved)):
    """
    Returns a list of Players for THIS Tenant who are pending approval.
    """
    admin_id = admin["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Find Admin's Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # 2. Get Pending Players for ONLY this tenant
            await cur.execute(
                """
                SELECT p.player_id, p.username, p.email, k.submitted_at, d.document_reference
                FROM Player p
                JOIN PlayerKYCProfile k ON p.player_id = k.player_id
                LEFT JOIN PlayerKYCDocument d ON k.player_kyc_profile_id = d.player_kyc_profile_id
                WHERE p.tenant_id = %s AND p.kyc_status = 'PENDING'
                """,
                (tenant_id,)
            )
            return await cur.fetchall()