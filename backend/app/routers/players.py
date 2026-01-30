from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_db_connection
from app.core.dependencies import require_player
from app.core.security import hash_password,verify_password
from app.schemas.player_schema import (
    PlayerRegisterRequest, 
    KYCSubmission, 
    TransactionRequest, 
    GameSessionInit,
    SessionEndRequest,
    PlayGameRequest, 
    JackpotEntryRequest,
    PasswordUpdateRequest
)
import random



router = APIRouter(prefix="/players", tags=["Player Operations"])

# --- HELPERS ---
def generate_referral_code(username: str) -> str:
    prefix = username[:4].upper().ljust(4, 'X')
    suffix = ''.join(random.choices("0123456789", k=4))
    return f"{prefix}{suffix}"

# ==========================================
# 1. AUTH & REGISTRATION
# ==========================================

@router.post("/register")
async def register_player(data: PlayerRegisterRequest):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute("BEGIN;")
                
                # Get Default Settings
                await cur.execute("SELECT default_currency_code FROM Tenant WHERE tenant_id = %s", (data.tenant_id,))
                tenant = await cur.fetchone()
                
                # Create Player
                my_code = generate_referral_code(data.username)
                hashed_pwd = hash_password(data.password)
                
                await cur.execute(
                    """
                    INSERT INTO Player (tenant_id, username, email, password_hash, country_id, referral_code, my_referral_code, kyc_status, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'NOT_SUBMITTED', 'ACTIVE', NOW())
                    RETURNING player_id;
                    """,
                    (data.tenant_id, data.username, data.email, hashed_pwd, data.country_id, data.referral_code, my_code)
                )
                player_id = (await cur.fetchone())['player_id']

                # Create REAL Wallet (0.00)
                await cur.execute("INSERT INTO Wallet (player_id, wallet_type, currency_code, balance) VALUES (%s, 'REAL', %s, 0.00)", (player_id, tenant['default_currency_code']))

                # Create BONUS Wallet (0.00)
                await cur.execute("INSERT INTO Wallet (player_id, wallet_type, currency_code, balance) VALUES (%s, 'BONUS', %s, 0.00)", (player_id, tenant['default_currency_code']))

                await conn.commit()
                return {"status": "success", "player_id": str(player_id)}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(500, str(e))




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
        
# ==========================================
# 2. SESSION MANAGEMENT
# ==========================================

@router.post("/session/start")
async def start_game_session(data: GameSessionInit, request: Request, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    client_ip = request.client.host or "127.0.0.1"

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_game_id FROM TenantGame WHERE tenant_game_id = %s", (data.game_id,))
            if not await cur.fetchone(): 
                raise HTTPException(404, "Game not found")

            # Safety Net: Close Stale Sessions (> 24 Hours)
            await cur.execute(
                """
                UPDATE GameSession 
                SET ended_at = NOW() 
                WHERE player_id = %s AND ended_at IS NULL AND started_at < NOW() - INTERVAL '24 HOURS'
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

# ==========================================
# 3. GAMEPLAY
# ==========================================

@router.post("/play")
async def play_game_round(data: PlayGameRequest, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    if data.bet_amount <= 0: raise HTTPException(400, "Bet must be positive")
    if data.wallet_type not in ['REAL', 'BONUS']: raise HTTPException(400, "Invalid Wallet")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                # A. Get Session Info
                await cur.execute(
                    """
                    SELECT gs.game_id, gs.session_id, tg.min_bet, tg.max_bet, tg.tenant_id, pg.game_type
                    FROM GameSession gs
                    JOIN TenantGame tg ON gs.game_id = tg.tenant_game_id
                    JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                    WHERE gs.session_id = %s AND gs.player_id = %s AND gs.ended_at IS NULL
                    """, 
                    (data.session_id, player_id)
                )
                session = await cur.fetchone()
                if not session: raise HTTPException(400, "Session expired or invalid")

                # B. Select Wallet & Check Funds
                await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = %s", (player_id, data.wallet_type))
                wallet = await cur.fetchone()
                
                if not wallet or float(wallet['balance']) < data.bet_amount:
                    raise HTTPException(400, "Insufficient funds")

                # C. Game Logic (Placeholder for RNG)
                is_win = random.random() < 0.4
                multiplier = 2.0 if is_win else 0.0
                payout = data.bet_amount * multiplier
                outcome_status = 'WIN' if payout > 0 else 'LOSE'
                
                # D. Calculate New Balance
                current_balance = float(wallet['balance'])
                final_balance = current_balance - data.bet_amount + payout

                # --- DB UPDATES ---
                await cur.execute("BEGIN;")

                # Calculate Next Round Number
                await cur.execute(
                    "SELECT COALESCE(MAX(round_number), 0) + 1 as next_round FROM GameRound WHERE session_id = %s",
                    (data.session_id,)
                )
                next_round_num = (await cur.fetchone())['next_round']

                # Update Wallet
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (final_balance, wallet['wallet_id']))
                
                # Create Round
                await cur.execute(
                    "INSERT INTO GameRound (session_id, round_number, started_at, ended_at) VALUES (%s, %s, NOW(), NOW()) RETURNING round_id", 
                    (data.session_id, next_round_num)
                )
                rid = (await cur.fetchone())['round_id']
                
                # Log Bet
                await cur.execute(
                    "INSERT INTO Bet (tenant_id, player_id, round_id, wallet_type, bet_amount, currency_code, placed_at) VALUES (%s, %s, %s, %s, %s, 'USD', NOW()) RETURNING bet_id",
                    (session['tenant_id'], player_id, rid, data.wallet_type, data.bet_amount)
                )
                bid = (await cur.fetchone())['bet_id']
                
                # Log Outcome
                await cur.execute("INSERT INTO BetOutcome (bet_id, result, payout_amount, settled_at) VALUES (%s, %s, %s, NOW())", (bid, outcome_status, payout))
                
                # Log Transaction
                await cur.execute(
                    "INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at) VALUES (%s, %s, %s, %s, 'GAME_PLAY', %s, NOW())",
                    (wallet['wallet_id'], 'WIN' if is_win else 'BET', payout if is_win else data.bet_amount, final_balance, str(rid))
                )

                await conn.commit()
                
                return {
                    "result": outcome_status, 
                    "payout": payout, 
                    "new_balance": final_balance, 
                    "wallet_type": data.wallet_type,
                    "round_number": next_round_num
                }

            except Exception as e:
                await conn.rollback()
                raise HTTPException(500, str(e))

# ==========================================
# 4. DASHBOARD & DATA
# ==========================================



@router.get("/game/{tenant_game_id}")
async def get_game_details(tenant_game_id: str, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Updated Query: Added pg.video_url
            await cur.execute("""
                SELECT 
                    tg.tenant_game_id as game_id, 
                    COALESCE(tg.custom_name, pg.title) as title, -- Fallback to generic title if custom is null
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

            # Wallet Logic (Unchanged)
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



# ==========================================
# 5. TRANSACTIONS & JACKPOTS
# ==========================================

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

@router.post("/kyc/submit")
async def submit_player_kyc(data: KYCSubmission, user: dict = Depends(require_player)):
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT username FROM Player WHERE player_id = %s", (player_id,))
            username = (await cur.fetchone())['username']
            await cur.execute("UPDATE Player SET kyc_status = 'PENDING', kyc_document_reference = %s WHERE player_id = %s", (data.document_url, player_id))
            await cur.execute("INSERT INTO PlayerKYCProfile (player_id, full_name, document_reference, kyc_status, submitted_at) VALUES (%s, %s, %s, 'PENDING', NOW()) ON CONFLICT (player_id) DO UPDATE SET document_reference = EXCLUDED.document_reference, kyc_status = 'PENDING', submitted_at = NOW()", (player_id, username, data.document_url))
            await conn.commit()
            return {"status": "success", "message": "KYC Submitted"}

# --- JACKPOTS ---



# 1. FIXED DASHBOARD ENDPOINT (Fixes NaN issue)
@router.get("/dashboard")
async def get_dashboard_data(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Get Wallets
            await cur.execute("SELECT wallet_type, balance, currency_code FROM Wallet WHERE player_id = %s", (player_id,))
            wallets = await cur.fetchall()
            
            # FIX: Variable name mismatch fixed here
            balance_map = {"REAL": 0.0, "BONUS": 0.0}
            currency = "USD"
            for w in wallets:
                balance_map[w['wallet_type']] = float(w['balance'])
                if w['currency_code']: currency = w['currency_code']

            # Get Profile
            await cur.execute("SELECT username, email, kyc_status FROM Player WHERE player_id = %s", (player_id,))
            profile = await cur.fetchone()
            
            # Get Games
            await cur.execute("""
                SELECT tg.tenant_game_id as game_id, COALESCE(tg.custom_name, pg.title) as game_name, 
                       pg.default_thumbnail_url as thumbnail_url, pg.game_type, pg.provider
                FROM TenantGame tg JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                WHERE tg.is_active = TRUE AND pg.is_active = TRUE
            """)
            games = await cur.fetchall()

            # Get Active OTP (Safe Try/Except)
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
                    "balance": balance_map['REAL'],       # FIX: Using correct variable
                    "bonus_balance": balance_map['BONUS'], # FIX: Using correct variable
                    "currency_code": currency
                },
                "games": games,
                "active_otp": active_otp
            }

# 2. ADD THIS MISSING ENDPOINT (Crucial for frontend)
@router.get("/jackpots/latest-winner")
async def get_latest_jackpot_winner():
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT p.username, je.total_pool_amount, je.game_date, je.jackpot_event_id
                FROM JackpotEvent je
                JOIN Player p ON je.winner_player_id = p.player_id
                WHERE je.status = 'CLOSED'
                ORDER BY je.game_date DESC
                LIMIT 1
            """)
            row = await cur.fetchone()
            return row if row else None


@router.get("/jackpots")
async def list_open_jackpots(user: dict = Depends(require_player)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT jackpot_event_id, game_date, entry_amount, currency_code, status, total_pool_amount,
                (SELECT COUNT(*) FROM JackpotEntry WHERE jackpot_event_id = je.jackpot_event_id) as participant_count
                FROM JackpotEvent je
                WHERE status = 'OPEN' AND game_date >= CURRENT_DATE
                ORDER BY game_date ASC
            """)
            return await cur.fetchall()

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


   