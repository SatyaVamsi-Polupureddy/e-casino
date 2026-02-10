from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_db_connection
from app.core.dependencies import require_player
from app.core.security import hash_password,verify_password
from app.schemas.player_schema import (
    PlayerRegisterRequest, 
   
    TransactionRequest, 
    GameSessionInit,
    SessionEndRequest,
    JackpotEntryRequest,
    PasswordUpdateRequest
)
import random
import traceback


router = APIRouter(prefix="/players", tags=["Player Operations"])

def generate_referral_code(username: str) -> str:
    prefix = username[:4].upper().ljust(4, 'X')
    suffix = ''.join(random.choices("0123456789", k=4))
    return f"{prefix}{suffix}"


@router.post("/register")
async def register_player(data: PlayerRegisterRequest):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute("BEGIN;")
                # Check if super admin
                await cur.execute("SELECT 1 FROM PlatformUser WHERE email = %s", (data.email,))
                if await cur.fetchone():
                    raise HTTPException(400, "This email is reserved for administrative use.")

                await cur.execute(
                    """
                    SELECT 
                        default_currency_code, 
                        default_daily_bet_limit, 
                        default_daily_loss_limit, 
                        default_max_single_bet 
                    FROM Tenant WHERE tenant_id = %s
                    """, 
                    (data.tenant_id,)
                )
                tenant = await cur.fetchone()
                
                if not tenant:
                    raise HTTPException(404, "Invalid Tenant ID.")

                #  Referral Code
                referred_by_id = None
                if data.referral_code and data.referral_code.strip():
                    await cur.execute(
                        "SELECT player_id FROM Player WHERE my_referral_code = %s AND tenant_id = %s", 
                        (data.referral_code.strip(), data.tenant_id)
                    )
                    referrer = await cur.fetchone()
                    
                    if referrer:
                        referred_by_id = referrer['player_id']
                    else:
                        raise HTTPException(400, "Invalid Referral Code.")
                #  New Player Data
                my_code = generate_referral_code(data.username)
                hashed_pwd = hash_password(data.password)
                await cur.execute(
                    """
                    INSERT INTO Player (
                        tenant_id, username, email, password_hash, country_id, 
                        referred_by_player_id, my_referral_code, kyc_status, status, created_at,
                        daily_bet_limit, daily_loss_limit, max_single_bet
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'NOT_SUBMITTED', 'ACTIVE', NOW(), %s, %s, %s)
                    RETURNING player_id;
                    """,
                    (
                        data.tenant_id, 
                        data.username, 
                        data.email, 
                        hashed_pwd, 
                        data.country_id, 
                        referred_by_id, 
                        my_code,
                        tenant['default_daily_bet_limit'],
                        tenant['default_daily_loss_limit'],
                        tenant['default_max_single_bet']
                    )
                )
                player_id = (await cur.fetchone())['player_id']

                currency = tenant['default_currency_code']
                await cur.execute("INSERT INTO Wallet (player_id, wallet_type, currency_code, balance) VALUES (%s, 'REAL', %s, 0.00)", (player_id, currency))
                await cur.execute("INSERT INTO Wallet (player_id, wallet_type, currency_code, balance) VALUES (%s, 'BONUS', %s, 0.00)", (player_id, currency))

                await conn.commit()
                return {"status": "success", "player_id": str(player_id)}

            except HTTPException as http_e:
                await conn.rollback()
                raise http_e
            except Exception as e:
                await conn.rollback()
                print(f"REGISTRATION ERROR: {str(e)}")
                traceback.print_exc()
                
                if "unique" in str(e).lower() and "email" in str(e).lower():
                    raise HTTPException(400, "Email already registered.")
                if "unique" in str(e).lower() and "username" in str(e).lower():
                    raise HTTPException(400, "Username already taken.")
                
                raise HTTPException(500, f"Internal Server Error: {str(e)}")          

# update password
@router.put("/profile/password")
async def update_password(
    data: PasswordUpdateRequest,
    player: dict = Depends(require_player)
):
    player_id = player["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Fetch current password hash
            await cur.execute("SELECT password_hash FROM Player WHERE player_id = %s", (player_id,))
            row = await cur.fetchone()
            
            if not row:
                raise HTTPException(404, "Player not found")
                
            # 2. Verify Old Password
            if not verify_password(data.old_password, row['password_hash']):
                raise HTTPException(400, "Incorrect old password")
            
            # 3. Hash New Password and Update
            new_hash = hash_password(data.new_password)
            
            await cur.execute(
                "UPDATE Player SET password_hash = %s WHERE player_id = %s",
                (new_hash, player_id)
            )
            await conn.commit()
            
            return {"status": "success", "message": "Password updated successfully"}
        
@router.post("/session/start")
async def start_game_session(data: GameSessionInit, request: Request, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    client_ip = request.client.host or "127.0.0.1"

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_game_id FROM TenantGame WHERE tenant_game_id = %s", (data.game_id,))
            if not await cur.fetchone(): 
                raise HTTPException(404, "Game not found")

            # Close  Sessions (> 2 Hours)
            await cur.execute(
                """
                UPDATE GameSession 
                SET ended_at = NOW() 
                WHERE player_id = %s AND ended_at IS NULL AND started_at < NOW() - INTERVAL '2 HOURS'
                """,
                (player_id,)
            )

            # Check for existing active session
            await cur.execute(
                """
                SELECT session_id FROM GameSession 
                WHERE player_id = %s AND game_id = %s AND ended_at IS NULL
                """,
                (player_id, data.game_id)
            )
            existing_session = await cur.fetchone()
            
            if existing_session:
                return {"status": "resumed", "session_id": str(existing_session['session_id'])}

            # Create New Session
            await cur.execute(
                """
                INSERT INTO GameSession (player_id, game_id, ip_address, started_at) 
                VALUES (%s, %s, %s, NOW()) 
                RETURNING session_id
                """,
                (player_id, data.game_id, client_ip)
            )
            session_id = (await cur.fetchone())['session_id']
            
            await conn.commit()
            return {"status": "created", "session_id": str(session_id)}

@router.post("/session/end")
async def end_game_session(data: SessionEndRequest, user: dict = Depends(require_player)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE GameSession SET ended_at = NOW() WHERE session_id = %s AND player_id = %s", (data.session_id, user['user_id']))
            await conn.commit()
            return {"status": "success"}

# game
@router.get("/game/{tenant_game_id}")
async def get_game_details(tenant_game_id: str, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT 
                    tg.tenant_game_id as game_id, 
                    pg.title as title,
                    tg.min_bet, 
                    tg.max_bet, 
                    pg.game_type, 
                    pg.default_thumbnail_url,
                    pg.video_url   -- <--- FETCH THIS NEW COLUMN
                FROM TenantGame tg
                JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                WHERE tg.tenant_game_id = %s
            """, (tenant_game_id,))
            
            game = await cur.fetchone()
            if not game: 
                raise HTTPException(404, "Game not found")
            await cur.execute("SELECT wallet_type, balance FROM Wallet WHERE player_id = %s", (player_id,))
            wallets = await cur.fetchall()
            
            balances = {"REAL": 0.0, "BONUS": 0.0}
            for w in wallets:
                balances[w['wallet_type']] = float(w['balance'])

            return {
                **game,
                "balance": balances["REAL"],
                "bonus_balance": balances["BONUS"]
            }



# deposit
@router.post("/deposit/self")
async def deposit_self(data: TransactionRequest, user: dict = Depends(require_player)):
    if data.amount <= 0: raise HTTPException(400, "Amount must be positive")
    
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = 'REAL'", (player_id,))
            wallet = await cur.fetchone()
            if not wallet: raise HTTPException(404, "Real wallet not found")

            new_balance = float(wallet['balance']) + data.amount
            await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))

            await cur.execute(
                "INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, created_at) VALUES (%s, 'DEPOSIT', %s, %s, 'SELF_DEPOSIT', NOW())",
                (wallet['wallet_id'], data.amount, new_balance)
            )
            await conn.commit()
            return {"status": "success", "new_balance": new_balance}

# withdraw
@router.post("/withdraw/self")
async def withdraw_self(data: TransactionRequest, user: dict = Depends(require_player)):
    if data.amount <= 0: raise HTTPException(400, "Amount must be positive")
    
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT kyc_status FROM Player WHERE player_id = %s", (player_id,))
            if (await cur.fetchone())['kyc_status'] != 'APPROVED': raise HTTPException(403, "KYC Required")

            await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = 'REAL'", (player_id,))
            wallet = await cur.fetchone()

            if float(wallet['balance']) < data.amount: raise HTTPException(400, "Insufficient funds")

            new_balance = float(wallet['balance']) - data.amount
            await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))

            await cur.execute(
                "INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, created_at) VALUES (%s, 'WITHDRAWAL', %s, %s, 'SELF_WITHDRAW', NOW())",
                (wallet['wallet_id'], data.amount, new_balance)
            )
            await conn.commit()
            return {"status": "success", "new_balance": new_balance}

# transactions
@router.get("/my-transactions")
async def get_my_player_transactions(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT 
                    wt.transaction_type,
                    CASE 
                        -- 1. Normal Game Win: Subtract Bet to show Net Profit
                        -- We explicitly exclude 'JACKPOT_WIN' here so it falls to ELSE
                        WHEN wt.transaction_type = 'WIN' AND wt.reference_type = 'GAME_PLAY' 
                        THEN wt.amount - COALESCE(b.bet_amount, 0)
                        
                        -- 2. Jackpot Win (and everything else): Show Full Amount
                        -- Since your DB already has 'JACKPOT_WIN', it falls here automatically.
                        ELSE wt.amount 
                    END as amount,
                    wt.created_at, 
                    wt.reference_type 
                FROM WalletTransaction wt 
                JOIN Wallet w ON wt.wallet_id = w.wallet_id 
                -- Only join Bet for standard arcade games to get the bet amount
                LEFT JOIN Bet b ON wt.reference_id = CAST(b.round_id AS VARCHAR) 
                               AND wt.reference_type = 'GAME_PLAY'
                WHERE w.player_id = %s 
                ORDER BY wt.created_at DESC 
                LIMIT 50
            """, (player_id,))
            return await cur.fetchall()


# dashboard
@router.get("/dashboard")
async def get_dashboard_data(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Get Wallets
            await cur.execute("SELECT wallet_type, balance, currency_code FROM Wallet WHERE player_id = %s", (player_id,))
            wallets = await cur.fetchall()
            
            balance_map = {"REAL": 0.0, "BONUS": 0.0}
            currency = "USD"
            for w in wallets:
                balance_map[w['wallet_type']] = float(w['balance'])
                if w['currency_code']: currency = w['currency_code']

            # 2. Get Profile + Tenant ID
            await cur.execute("SELECT username, email, kyc_status, tenant_id FROM Player WHERE player_id = %s", (player_id,))
            profile = await cur.fetchone()

            if not profile:
                raise HTTPException(404, "Player not found")

            # 3. Get Tenant Contact Email
            tenant_contact_email = "support@platform.com"
            tenant_id = profile['tenant_id'] # Store this for later use

            if tenant_id:
                try:
                    await cur.execute("""
                        SELECT email 
                        FROM TenantUser 
                        WHERE tenant_id = %s AND role_id = 2 
                        LIMIT 1
                    """, (tenant_id,))
                    
                    admin_row = await cur.fetchone()
                    if admin_row:
                        tenant_contact_email = admin_row['email']
                except Exception as e:
                    print(f" Error fetching tenant email: {e}")
                    await conn.rollback() 

            # 4. Get Games (FILTERED BY TENANT_ID)
            # We added: AND tg.tenant_id = %s
            await cur.execute("""
                SELECT tg.tenant_game_id as game_id, pg.title as game_name, 
                       pg.default_thumbnail_url as thumbnail_url, pg.game_type, pg.provider
                FROM TenantGame tg 
                JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                WHERE tg.is_active = TRUE 
                  AND pg.is_active = TRUE 
                  AND tg.tenant_id = %s  -- <--- FIXED HERE
            """, (tenant_id,)) # Pass tenant_id here
            games = await cur.fetchall()

            # 5. Get Active OTP
            active_otp = None
            try:
                await cur.execute("SELECT otp_code FROM PlayerOTP WHERE player_id = %s AND status = 'PENDING' AND expires_at > NOW() LIMIT 1", (player_id,))
                active_otp = await cur.fetchone()
            except Exception:
                pass 

            return {
                "profile": {
                    "username": profile['username'],
                    "email": profile['email'],
                    "kyc_status": profile['kyc_status'],
                    "balance": balance_map['REAL'],
                    "bonus_balance": balance_map['BONUS'],
                    "currency_code": currency
                },
                "tenant_contact_email": tenant_contact_email,
                "games": games,
                "active_otp": active_otp
            }

# latest jackpot winner
@router.get("/jackpots/latest-winner")
async def get_latest_jackpot_winner(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # First, get the tenant_id of the current player
            await cur.execute("SELECT tenant_id FROM Player WHERE player_id = %s", (player_id,))
            player_row = await cur.fetchone()
            if not player_row:
                return None
            tenant_id = player_row['tenant_id']

            # Fetch winner ONLY for this tenant
            await cur.execute("""
                SELECT p.username, je.total_pool_amount, je.game_date, je.jackpot_event_id
                FROM JackpotEvent je
                JOIN Player p ON je.winner_player_id = p.player_id
                WHERE je.status = 'CLOSED' 
                  AND je.tenant_id = %s  -- <--- FIXED HERE
                ORDER BY je.game_date DESC
                LIMIT 1
            """, (tenant_id,))
            row = await cur.fetchone()
            return row if row else None


# Jackpots 
@router.get("/jackpots")
async def list_open_jackpots(user: dict = Depends(require_player)):
    player_id = user["user_id"]

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # First, get the tenant_id
            await cur.execute("SELECT tenant_id FROM Player WHERE player_id = %s", (player_id,))
            player_row = await cur.fetchone()
            tenant_id = player_row['tenant_id']

            # Filter Jackpots by Tenant
            await cur.execute("""
                SELECT jackpot_event_id, game_date, entry_amount, currency_code, status, total_pool_amount,
                (SELECT COUNT(*) FROM JackpotEntry WHERE jackpot_event_id = je.jackpot_event_id) as participant_count
                FROM JackpotEvent je
                WHERE status = 'OPEN' 
                  AND game_date >= CURRENT_DATE
                  AND tenant_id = %s -- <--- FIXED HERE
                ORDER BY game_date ASC
            """, (tenant_id,))
            return await cur.fetchall()

# enter in jackpot
@router.post("/jackpots/enter")
async def enter_jackpot(data: JackpotEntryRequest, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM JackpotEvent WHERE jackpot_event_id = %s", (data.jackpot_event_id,))
            event = await cur.fetchone()
            if not event or event['status'] != 'OPEN': raise HTTPException(400, "Event unavailable")
            
            entry_fee = float(event['entry_amount'])

            await cur.execute("SELECT 1 FROM JackpotEntry WHERE jackpot_event_id = %s AND player_id = %s", (data.jackpot_event_id, player_id))
            if await cur.fetchone(): raise HTTPException(400, "Already entered")

            await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = %s", (player_id, data.wallet_type))
            wallet = await cur.fetchone()
            if not wallet or float(wallet['balance']) < entry_fee: raise HTTPException(400, "Insufficient funds")

            try:
                await cur.execute("BEGIN;")
                new_balance = float(wallet['balance']) - entry_fee
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))
                
                await cur.execute("INSERT INTO JackpotEntry (jackpot_event_id, player_id, wallet_type, entry_amount, entered_at) VALUES (%s, %s, %s, %s, NOW())", (data.jackpot_event_id, player_id, data.wallet_type, entry_fee))
                await cur.execute("UPDATE JackpotEvent SET total_pool_amount = total_pool_amount + %s WHERE jackpot_event_id = %s", (entry_fee, data.jackpot_event_id))
                await cur.execute("INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at) VALUES (%s, 'JACKPOT_ENTRY', %s, %s, 'JACKPOT_EVENT', %s, NOW())", (wallet['wallet_id'], entry_fee, new_balance, data.jackpot_event_id))
                
                await conn.commit()
                return {"status": "success"}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(500, str(e))


   