import traceback
from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_db_connection
from app.core.dependencies import verify_player_is_approved, require_super_admin
from app.schemas.game_schema import GamePlayRequest, GamePlayResponse
from app.core.game_logic_core import GameLogic

router = APIRouter(prefix="/engine", tags=["Game Engine (Play)"])

# ============================================================================
# HELPER: BONUS WAGERING
# ============================================================================
async def process_bonus_progress(cur, player_id: str, bet_amount: float):
    """
    1. Finds active bonus.
    2. Adds bet_amount to wagered_amount.
    3. If Target met -> Unlocks Bonus (Transfer BONUS wallet -> REAL wallet).
    """
    await cur.execute(
        """
        SELECT pb.player_bonus_id, pb.initial_amount, pb.wagered_amount, 
               bc.wagering_requirement
        FROM PlayerBonus pb
        JOIN BonusCampaign bc ON pb.campaign_id = bc.campaign_id
        WHERE pb.player_id = %s AND pb.status = 'ACTIVE'
        ORDER BY pb.awarded_at ASC
        LIMIT 1
        """,
        (player_id,)
    )
    bonus = await cur.fetchone()
    
    if bonus:
        # Update Progress
        new_wagered = float(bonus['wagered_amount']) + bet_amount
        await cur.execute(
            "UPDATE PlayerBonus SET wagered_amount = %s WHERE player_bonus_id = %s",
            (new_wagered, bonus['player_bonus_id'])
        )
        
        # Check if Unlocked
        target = float(bonus['initial_amount']) * float(bonus['wagering_requirement'])
        
        if new_wagered >= target:
            print(f"🎉 Bonus Unlocked! Target: {target}, Wagered: {new_wagered}")

            # 1. Get Wallet Balances
            await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = 'BONUS'", (player_id,))
            bonus_wallet = await cur.fetchone()
            
            await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = 'REAL'", (player_id,))
            real_wallet = await cur.fetchone()
            
            if bonus_wallet and real_wallet and float(bonus_wallet['balance']) > 0:
                amount_to_transfer = float(bonus_wallet['balance'])
                
                # A. Empty Bonus Wallet
                await cur.execute("UPDATE Wallet SET balance = 0 WHERE wallet_id = %s", (bonus_wallet['wallet_id'],))
                
                # B. Fill Real Wallet
                new_real_bal = float(real_wallet['balance']) + amount_to_transfer
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_real_bal, real_wallet['wallet_id']))
                
                # C. Mark Bonus Complete
                await cur.execute("UPDATE PlayerBonus SET status = 'COMPLETED' WHERE player_bonus_id = %s", (bonus['player_bonus_id'],))
                
                # D. Log Transfer
                await cur.execute(
                    """
                    INSERT INTO WalletTransaction 
                    (wallet_id, transaction_type, amount, balance_after, reference_type, created_at)
                    VALUES (%s, 'BONUS_UNLOCK', %s, %s, 'SYSTEM', NOW())
                    """,
                    (real_wallet['wallet_id'], amount_to_transfer, new_real_bal)
                )

# ============================================================================
# ENDPOINT 1: PLAY GAME
# ============================================================================
@router.post("/play/{game_id}", response_model=GamePlayResponse)
async def play_game(
    game_id: str,
    play_req: GamePlayRequest,
    request: Request,
    player: dict = Depends(verify_player_is_approved)
):
    try:
        player_id = player["user_id"]
        bet_amount = play_req.bet_amount
        client_ip = request.client.host

        if bet_amount <= 0:
            raise HTTPException(status_code=400, detail="Bet must be positive.")

        async with get_db_connection() as conn:
            async with conn.cursor() as cur:
                # ---------------------------------------------------------
                # 1. FETCH GAME DATA (SMART LOOKUP)
                # ---------------------------------------------------------
                
                # A. Get Tenant ID from Player (Safe Lookup)
                await cur.execute("SELECT tenant_id FROM Player WHERE player_id = %s LIMIT 1", (player_id,))
                player_row = await cur.fetchone()
                if not player_row: raise HTTPException(400, "Player account error: No tenant linked.")
                player_tenant_id = player_row['tenant_id']

                # B. Find Game (Matches TenantGame ID OR PlatformGame ID)
                await cur.execute(
                    """
                    SELECT 
                        tg.tenant_game_id,
                        COALESCE(pg.title, 'Unknown Game') as game_name,
                        pg.game_type,   -- <--- FETCH GAME TYPE
                        tg.min_bet, 
                        tg.max_bet, 
                        tg.is_active as status, 
                        tg.tenant_id
                    FROM TenantGame tg
                    LEFT JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                    WHERE tg.tenant_id = %s 
                    AND (tg.tenant_game_id = %s OR pg.platform_game_id = %s)
                    """,
                    (player_tenant_id, game_id, game_id)
                )
                game_data = await cur.fetchone()

                if not game_data:
                    print(f"❌ Game ID {game_id} not found for Tenant {player_tenant_id}")
                    raise HTTPException(status_code=404, detail="Game not found or not active in your casino.")
                
                real_tenant_game_id = game_data['tenant_game_id']

                if not game_data['status']: raise HTTPException(400, "Game is currently disabled.")
                
                if bet_amount < float(game_data['min_bet']) or (float(game_data['max_bet']) > 0 and bet_amount > float(game_data['max_bet'])):
                    raise HTTPException(400, f"Bet must be between {game_data['min_bet']} and {game_data['max_bet']}")

                # ---------------------------------------------------------
                # 2. WALLET SELECTION LOGIC
                # ---------------------------------------------------------
                await cur.execute(
                    "SELECT wallet_id, wallet_type, balance, currency_code FROM Wallet WHERE player_id = %s AND wallet_type IN ('REAL', 'BONUS')",
                    (player_id,)
                )
                wallets = await cur.fetchall()
                
                real_wallet = next((w for w in wallets if w['wallet_type'] == 'REAL'), None)
                bonus_wallet = next((w for w in wallets if w['wallet_type'] == 'BONUS'), None)
                
                if not real_wallet: raise HTTPException(404, "Real wallet missing.")
                
                bal_real = float(real_wallet['balance'])
                bal_bonus = float(bonus_wallet['balance']) if bonus_wallet else 0.0
                active_wallet = None

                # Wallet Priority Logic
                if play_req.use_wallet_type:
                    req_type = play_req.use_wallet_type.upper()
                    if req_type == 'BONUS':
                        if not bonus_wallet: raise HTTPException(400, "No bonus wallet available.")
                        if bal_bonus < bet_amount: raise HTTPException(400, "Insufficient BONUS funds.")
                        active_wallet = bonus_wallet
                    elif req_type == 'REAL':
                        if bal_real < bet_amount: raise HTTPException(400, "Insufficient REAL funds.")
                        active_wallet = real_wallet
                    else:
                        raise HTTPException(400, "Invalid wallet type.")
                else:
                    if bal_bonus >= bet_amount: active_wallet = bonus_wallet
                    elif bal_real >= bet_amount: active_wallet = real_wallet
                    else: raise HTTPException(400, "Insufficient funds.")

                # ---------------------------------------------------------
                # 3. RUN GAME LOGIC
                # ---------------------------------------------------------
                # Use strict game_type from DB instead of guessing from name
                game_type = game_data['game_type'].upper()
                multiplier = 0.0
                result_data = {}

                try:
                    if game_type == "SLOT":
                        multiplier, result_data = GameLogic.play_slot_machine()
                    elif game_type == "DICE":
                        if 'prediction' not in play_req.bet_data: raise ValueError("Prediction required (1-6)")
                        multiplier, result_data = GameLogic.play_dice_roll(play_req.bet_data['prediction'])
                    elif game_type == "WHEEL":
                        if 'prediction' not in play_req.bet_data: raise ValueError("Prediction required (1-20)")
                        multiplier, result_data = GameLogic.play_wheel_of_fortune(play_req.bet_data['prediction'])
                    elif game_type == "COIN":
                        if 'prediction' not in play_req.bet_data: raise ValueError("Prediction required (HEADS/TAILS)")
                        multiplier, result_data = GameLogic.play_coin_flip(play_req.bet_data['prediction'])
                    elif game_type == "HIGHLOW":
                        if 'prediction' not in play_req.bet_data: raise ValueError("Prediction required (HIGH/LOW)")
                        multiplier, result_data = GameLogic.play_high_low(play_req.bet_data['prediction'])
                    else:
                        # Generic Fallback
                        multiplier, result_data = GameLogic.play_slot_machine()
                except ValueError as ve:
                    raise HTTPException(status_code=400, detail=str(ve))

                payout = bet_amount * multiplier
                is_win = payout > 0
                outcome_status = "WIN" if is_win else "LOSS"

                # ---------------------------------------------------------
                # 4. DB TRANSACTION
                # ---------------------------------------------------------
                try:
                    await cur.execute("BEGIN;")

                    # A. Create Session & Round
                    await cur.execute(
                        "INSERT INTO GameSession (player_id, game_id, ip_address, started_at) VALUES (%s, %s, %s, NOW()) RETURNING session_id",
                        (player_id, real_tenant_game_id, client_ip)
                    )
                    session_id = (await cur.fetchone())['session_id']

                    await cur.execute(
                        "INSERT INTO GameRound (session_id, round_number, started_at) VALUES (%s, 1, NOW()) RETURNING round_id",
                        (session_id,)
                    )
                    round_id = (await cur.fetchone())['round_id']

                    # B. Deduct Wallet
                    new_balance = float(active_wallet['balance']) - bet_amount
                    await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, active_wallet['wallet_id']))

                    # C. Create Bet (Corrected columns)
                    platform_fee = bet_amount * 0.01
                    await cur.execute(
                        """
                        INSERT INTO Bet (
                            tenant_id, player_id, round_id, wallet_type, 
                            bet_amount, currency_code, tenant_game_id, 
                            platform_fee_amount, created_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW()) 
                        RETURNING bet_id;
                        """,
                        (
                            game_data['tenant_id'], player_id, round_id, active_wallet['wallet_type'],
                            bet_amount, real_wallet['currency_code'],
                            real_tenant_game_id, platform_fee
                        )
                    )
                    bet_id = (await cur.fetchone())['bet_id']

                    # D. Outcome
                    await cur.execute("INSERT INTO BetOutcome (bet_id, result, payout_amount, settled_at) VALUES (%s, %s, %s, NOW())", (bet_id, outcome_status, payout))

                    # E. Credit Win
                    final_balance = new_balance
                    if is_win:
                        target_wallet = active_wallet 
                        final_balance = new_balance + payout
                        await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (final_balance, target_wallet['wallet_id']))

                    # F. Audit Log
                    net_change = payout - bet_amount
                    txn_type = 'WIN' if net_change >= 0 else 'LOSS'
                    await cur.execute(
                        "INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at) VALUES (%s, %s, %s, %s, 'GAME_BET', %s, NOW())",
                        (active_wallet['wallet_id'], txn_type, abs(net_change), final_balance, bet_id)
                    )

                    # G. Bonus Progress
                    if active_wallet['wallet_type'] == 'BONUS':
                        await process_bonus_progress(cur, player_id, bet_amount)

                    await conn.commit()

                    return {
                        "game_id": str(real_tenant_game_id), # FIXED: Convert UUID to string
                        "game_name": game_data['game_name'],
                        "bet_amount": bet_amount,
                        "win_amount": payout,
                        "balance_after": final_balance,
                        "outcome": outcome_status,
                        "game_data": result_data
                    }

                except Exception as e:
                    await conn.rollback()
                    raise e 

    except Exception as e:
        print(f"❌ SERVER CRASH IN /play: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")