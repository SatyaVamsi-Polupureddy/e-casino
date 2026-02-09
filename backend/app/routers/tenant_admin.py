from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.security import hash_password, verify_password
from app.core.dependencies import verify_tenant_is_approved, require_tenant_admin
from app.core.bonus_service import BonusService
import random

from app.schemas.tenant_admin_schema import (
    CreateUserRequest, UpdateUserStatusRequest, PasswordUpdateRequest, 
    UpdatePlayerStatusRequest, AddGameRequest, UpdateGameRequest, KYCUpdateRequest, JackpotResponse, JackpotCreateRequest
)
from app.schemas.limits_schema import PlayerLimitUpdateByEmail, TenantDefaultLimits

router = APIRouter(
    prefix="/tenant-admin", 
    tags=["Tenant Admin Operations"],
    dependencies=[Depends(verify_tenant_is_approved)] 
)


# --- 1. GAME LIBRARY (Available games to add) ---
@router.get("/games/library")
async def get_game_library(current_user: dict = Depends(verify_tenant_is_approved)):
    admin_id = current_user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # Fetch games from PlatformGame that are:
            # 1. Active Globally (is_active = TRUE)
            # 2. NOT already installed by this tenant
            await cur.execute(
                """
                SELECT 
                    platform_game_id, 
                    title, 
                    game_type, 
                    default_thumbnail_url, 
                    provider 
                FROM PlatformGame 
                WHERE is_active = TRUE 
                AND platform_game_id NOT IN (
                    SELECT platform_game_id FROM TenantGame WHERE tenant_id = %s
                )
                ORDER BY title ASC
                """,
                (tenant_id,)
            )
            return await cur.fetchall()

# --- 2. MY GAMES (Installed games) ---
@router.get("/games/my-games")
async def get_my_games(current_user: dict = Depends(verify_tenant_is_approved)):
    admin_id = current_user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            # Fetch installed games, BUT hide them if Super Admin disabled the PlatformGame
            await cur.execute(
                """
                SELECT 
                    tg.tenant_game_id, 
                    tg.platform_game_id,  -- <--- Required for frontend filtering
                    pg.title as game_name, 
                    tg.min_bet, 
                    tg.max_bet, 
                    tg.is_active, 
                    pg.title, 
                    pg.default_thumbnail_url, 
                    pg.game_type
                FROM TenantGame tg
                JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                WHERE tg.tenant_id = %s
                  AND pg.is_active = TRUE  -- <--- CRITICAL: Hides game if Super Admin disables it
                ORDER BY pg.title ASC
                """,
                (tenant_id,)
            )
            return await cur.fetchall()
        
@router.post("/games/add")
async def add_game_to_site(data: AddGameRequest, current_user: dict = Depends(verify_tenant_is_approved)):
    admin_id = current_user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            # Check if exists
            await cur.execute(
                "SELECT tenant_game_id FROM TenantGame WHERE tenant_id = %s AND platform_game_id = %s",
                (tenant_id, data.platform_game_id)
            )
            if await cur.fetchone(): raise HTTPException(400, "Game already added.")

            # Insert
            await cur.execute(
                """
                INSERT INTO TenantGame (tenant_id, platform_game_id, custom_name, min_bet, max_bet)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (tenant_id, data.platform_game_id, data.custom_name or None, data.min_bet, data.max_bet)
            )
            await conn.commit()
            return {"status": "success", "message": "Game added to your casino"}

@router.put("/games/update")
async def update_tenant_game(data: UpdateGameRequest, current_user: dict = Depends(verify_tenant_is_approved)):
    admin_id = current_user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            await cur.execute(
                """
                UPDATE TenantGame 
                SET min_bet = %s, max_bet = %s, is_active = %s
                WHERE tenant_game_id = %s AND tenant_id = %s
                """,
                (data.min_bet, data.max_bet, data.is_active, data.tenant_game_id, tenant_id)
            )
            await conn.commit()
            return {"status": "success", "message": "Game settings updated"}



@router.put("/settings/default-limits")
async def update_tenant_defaults(limits: TenantDefaultLimits, current_user: dict = Depends(verify_tenant_is_approved)):
    admin_id = current_user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            await cur.execute(
                """
                UPDATE Tenant SET default_daily_bet_limit = %s, default_daily_loss_limit = %s, default_max_single_bet = %s
                WHERE tenant_id = %s
                """,
                (limits.default_daily_bet_limit, limits.default_daily_loss_limit, limits.default_max_single_bet, tenant_id)
            )
            await conn.commit()
            return {"status": "success", "message": "Defaults updated."}


@router.get("/players/pending")
async def get_pending_kyc_players(user: dict = Depends(require_tenant_admin)):
    user_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (user_id,))
            admin = await cur.fetchone()
            if not admin: raise HTTPException(403, "Tenant data not found")
            tenant_id = admin['tenant_id']

            # 2. Fetch Pending Players (JOIN with Profile)
            # We select 'document_reference' from the Profile table
            await cur.execute("""
                SELECT 
                    p.player_id, 
                    p.username, 
                    p.email, 
                    pkp.kyc_status, 
                    pkp.document_reference, -- ✅ Correct column from Profile table
                    pkp.submitted_at as created_at -- Use submission time, not account creation time
                FROM Player p
                JOIN PlayerKYCProfile pkp ON p.player_id = pkp.player_id
                WHERE p.tenant_id = %s 
                AND pkp.kyc_status = 'PENDING'
                ORDER BY pkp.submitted_at DESC
            """, (tenant_id,))
            
            return await cur.fetchall()


@router.get("/me")
async def get_tenant_profile(current_user: dict = Depends(verify_tenant_is_approved)):
    admin_id = current_user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT 
                    u.email as username, 
                    u.email, 
                    t.tenant_id, 
                    t.tenant_name, 
                    t.kyc_status, 
                    t.status as account_status,
                    t.default_daily_bet_limit,
                    t.default_daily_loss_limit,
                    t.default_max_single_bet
                FROM TenantUser u
                JOIN Tenant t ON u.tenant_id = t.tenant_id
                WHERE u.tenant_user_id = %s
            """, (admin_id,))
            
            profile = await cur.fetchone()
            if not profile: raise HTTPException(404, "Profile not found")
            return profile
        
@router.put("/me/password")
async def update_own_password(data: PasswordUpdateRequest, current_user: dict = Depends(verify_tenant_is_approved)):
    user_id = current_user['user_id']
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT password_hash FROM TenantUser WHERE tenant_user_id = %s", (user_id,))
            row = await cur.fetchone()
            
            if not row or not verify_password(data.old_password, row['password_hash']):
                raise HTTPException(400, "Incorrect old password")

            new_hash = hash_password(data.new_password)
            await cur.execute("UPDATE TenantUser SET password_hash = %s WHERE tenant_user_id = %s", (new_hash, user_id))
            await conn.commit()
            return {"message": "Password updated successfully"}
        




# --- 1. CREATE JACKPOT ---
@router.post("/jackpot/create", response_model=JackpotResponse)
async def create_jackpot(data: JackpotCreateRequest, admin: dict = Depends(verify_tenant_is_approved)):
    admin_id = admin["user_id"]
    if data.entry_fee < 0: raise HTTPException(400, "Fee cannot be negative")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Get Tenant
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            # Insert
            await cur.execute(
                """
                INSERT INTO JackpotEvent (tenant_id, game_date, entry_amount, currency_code, status, total_pool_amount, created_at)
                VALUES (%s, %s, %s, %s, 'OPEN', 0, NOW())
                RETURNING jackpot_event_id, game_date, entry_amount, currency_code, status, total_pool_amount
                """,
                (tenant_id, data.event_date, data.entry_fee, data.currency_code)
            )
            event = await cur.fetchone()
            await conn.commit()
            return event

# --- 2. LIST ACTIVE JACKPOTS ---
@router.get("/jackpot/list", response_model=list[JackpotResponse])
async def list_admin_jackpots(admin: dict = Depends(verify_tenant_is_approved)):
    admin_id = admin["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            await cur.execute("""
                SELECT jackpot_event_id, game_date, entry_amount, currency_code, status, total_pool_amount
                FROM JackpotEvent WHERE tenant_id = %s ORDER BY game_date DESC
            """, (tenant_id,))
            return await cur.fetchall()

# --- 3. DRAW WINNER ---
@router.post("/jackpot/draw/{event_id}")
async def draw_jackpot_winner(event_id: str, admin: dict = Depends(verify_tenant_is_approved)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Verify Ownership & Status
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin["user_id"],))
            admin_tenant_id = (await cur.fetchone())['tenant_id']

            await cur.execute("SELECT * FROM JackpotEvent WHERE jackpot_event_id = %s", (event_id,))
            event = await cur.fetchone()

            if not event: raise HTTPException(404, "Event not found")
            if str(event['tenant_id']) != str(admin_tenant_id): raise HTTPException(403, "Not your event")
            if event['status'] != 'OPEN': raise HTTPException(400, "Event closed")

            # Get Participants
            await cur.execute("SELECT player_id FROM JackpotEntry WHERE jackpot_event_id = %s", (event_id,))
            entries = await cur.fetchall()
            
            if not entries: raise HTTPException(400, "No participants!")

            # Pick Winner
            winner_id = random.choice(entries)['player_id']
            pool_amount = float(event['total_pool_amount'])

            # Transaction
            try:
                await cur.execute("BEGIN;")
                # Update Event
                await cur.execute("UPDATE JackpotEvent SET status = 'CLOSED', winner_player_id = %s WHERE jackpot_event_id = %s", (winner_id, event_id))
                
                # Credit Wallet (Real Money)
                await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = 'REAL'", (winner_id,))
                wallet = await cur.fetchone()
                new_balance = float(wallet['balance']) + pool_amount
                
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))

                # Log
                await cur.execute("""
                    INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                    VALUES (%s, 'JACKPOT_WIN', %s, %s, 'JACKPOT_EVENT', %s, NOW())
                """, (wallet['wallet_id'], pool_amount, new_balance, event_id))

                await conn.commit()
                return {"status": "Winner Declared", "winner_id": winner_id, "amount": pool_amount}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(500, str(e))
            

# ==========================================

@router.get("/players/all")
async def get_all_tenant_players(user: dict = Depends(require_tenant_admin)):
    user_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (user_id,))
            admin = await cur.fetchone()
            if not admin: raise HTTPException(403, "Tenant data not found")
            tenant_id = admin['tenant_id']

            # 2. Fetch Players
            await cur.execute("""
                SELECT 
                    player_id, username, email, kyc_status, status, 
                    daily_bet_limit, daily_loss_limit, max_single_bet, created_at
                FROM Player 
                WHERE tenant_id = %s
                ORDER BY created_at DESC
            """, (tenant_id,))
            return await cur.fetchall()

@router.put("/player/status")
async def update_player_status(data: dict, user: dict = Depends(require_tenant_admin)):
    if data.get("status") not in ['ACTIVE', 'SUSPENDED', 'TERMINATED']:
        raise HTTPException(400, "Invalid status")
    
    # We update by email (scoped to tenant is safer but global email is unique usually)
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE Player SET status = %s WHERE email = %s", (data["status"], data["email"]))
            await conn.commit()
            return {"status": "success"}

@router.post("/player/limits")
async def update_player_limits(data: dict, user: dict = Depends(require_tenant_admin)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                UPDATE Player 
                SET daily_bet_limit = %s, daily_loss_limit = %s, max_single_bet = %s
                WHERE email = %s
            """, (data.get("daily_bet_limit"), data.get("daily_loss_limit"), data.get("max_single_bet"), data["email"]))
            await conn.commit()
            return {"status": "success"}

# ==========================================
# 2. STAFF MANAGEMENT (Consolidated)
# ==========================================

@router.get("/staff/all")
async def get_all_tenant_staff(user: dict = Depends(require_tenant_admin)):
    user_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (user_id,))
            admin = await cur.fetchone()
            tenant_id = admin['tenant_id']

            # 2. Fetch Staff (JOIN with role table correctly)
            # Assuming table is 'role' (lowercase) or 'Role' (case sensitive depends on DB)
            await cur.execute("""
                SELECT 
                    tu.tenant_user_id, 
                    tu.email, 
                    tu.status, 
                    tu.created_at,
                    r.role_name as role
                FROM TenantUser tu
                JOIN Role r ON tu.role_id = r.role_id
                WHERE tu.tenant_id = %s
                ORDER BY tu.created_at DESC
            """, (tenant_id,))
            return await cur.fetchall()

@router.post("/create-user")  # Matches frontend service path
async def create_tenant_user(data: CreateUserRequest, user: dict = Depends(require_tenant_admin)):
    user_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (user_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            hashed_pwd = hash_password(data.password)
            try:
                await cur.execute("""
                    INSERT INTO TenantUser (tenant_id, email, password_hash, role_id, status, created_by)
                    VALUES (%s, %s, %s, (SELECT role_id FROM Role WHERE role_name = %s), 'ACTIVE', %s)
                """, (tenant_id, data.email, hashed_pwd, data.role, user_id))
                await conn.commit()
                return {"message": "Staff created"}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(400, "Error creating user (Email might exist)")

@router.put("/user/status") # Matches frontend service path
async def update_staff_status(data: dict, user: dict = Depends(require_tenant_admin)):
    # Prevent self-lockout
    if data["email"] == user.get("email"):
         raise HTTPException(400, "Cannot change your own status")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE TenantUser SET status = %s WHERE email = %s", (data["status"], data["email"]))
            await conn.commit()
            return {"status": "success"}