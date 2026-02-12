import traceback
from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_db_connection
from app.core.dependencies import verify_player_is_approved
from app.schemas.game_schema import GamePlayRequest, GamePlayResponse
from app.core.game_logic_core import GameLogic
import datetime

router = APIRouter(prefix="/engine", tags=["Game Engine (Play)"])

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
                # --- 1. FETCH PLAYER LIMITS & TENANT ---
                await cur.execute(
                    """
                    SELECT tenant_id, daily_bet_limit, daily_loss_limit, max_single_bet 
                    FROM Player WHERE player_id = %s LIMIT 1
                    """, 
                    (player_id,)
                )
                player_row = await cur.fetchone()
                if not player_row: raise HTTPException(400, "Player account error.")
                
                player_tenant_id = player_row['tenant_id']
                
                # Check Limits
                limit_max_single = float(player_row['max_single_bet']) if player_row['max_single_bet'] else 0.0
                limit_daily_bet = float(player_row['daily_bet_limit']) if player_row['daily_bet_limit'] else 0.0
                limit_daily_loss = float(player_row['daily_loss_limit']) if player_row['daily_loss_limit'] else 0.0
                
                if limit_max_single > 0 and bet_amount > limit_max_single:
                    raise HTTPException(400, f"Bet rejected. Exceeds your max single bet limit of ${limit_max_single}")

                if limit_daily_bet > 0 or limit_daily_loss > 0:
                    await cur.execute(
                        """
                        SELECT 
                            COALESCE(SUM(b.bet_amount), 0) as total_wagered,
                            COALESCE(SUM(bo.payout_amount), 0) as total_won
                        FROM Bet b
                        LEFT JOIN BetOutcome bo ON b.bet_id = bo.bet_id
                        WHERE b.player_id = %s 
                        AND b.created_at >= CURRENT_DATE
                        """, 
                        (player_id,)
                    )
                    stats = await cur.fetchone()
                    total_wagered_today = float(stats['total_wagered'])
                    total_won_today = float(stats['total_won'])
                    current_net_loss = total_wagered_today - total_won_today

                    if limit_daily_bet > 0:
                        if (total_wagered_today + bet_amount) > limit_daily_bet:
                            remaining = max(0, limit_daily_bet - total_wagered_today)
                            raise HTTPException(400, f"Daily bet limit reached. Remaining allowance: ${remaining}")

                    if limit_daily_loss > 0:
                        if current_net_loss >= limit_daily_loss:
                             raise HTTPException(400, f"Daily loss limit reached. Please come back tomorrow.")

                # --- 2. FETCH GAME & WALLETS ---
                await cur.execute(
                    """
                    SELECT 
                        tg.tenant_game_id,
                        COALESCE(pg.title, 'Unknown Game') as game_name,
                        pg.game_type,
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

                if not game_data: raise HTTPException(404, "Game not found.")
                if not game_data['status']: raise HTTPException(400, "Game is disabled.")
                
                min_bet = float(game_data['min_bet'])
                max_bet = float(game_data['max_bet'])
                if bet_amount < min_bet: raise HTTPException(400, f"Minimum bet is ${min_bet}")
                if max_bet > 0 and bet_amount > max_bet: raise HTTPException(400, f"Maximum bet for this game is ${max_bet}")

                real_tenant_game_id = game_data['tenant_game_id']

                await cur.execute(
                    "SELECT wallet_id, wallet_type, balance, currency_code FROM Wallet WHERE player_id = %s AND wallet_type IN ('REAL', 'BONUS')",
                    (player_id,)
                )
                wallets = await cur.fetchall()
                real_wallet = next((w for w in wallets if w['wallet_type'] == 'REAL'), None)
                bonus_wallet = next((w for w in wallets if w['wallet_type'] == 'BONUS'), None)
                if not real_wallet: raise HTTPException(404, "Wallet not found.")
                
                bal_real = float(real_wallet['balance'])
                bal_bonus = float(bonus_wallet['balance']) if bonus_wallet else 0.0
                active_wallet = None

                if play_req.use_wallet_type:
                    req_type = play_req.use_wallet_type.upper()
                    if req_type == 'BONUS':
                        if not bonus_wallet or bal_bonus < bet_amount: raise HTTPException(400, "Insufficient BONUS funds.")
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

                # --- 3. RUN GAME LOGIC ---
                game_type = game_data['game_type'].upper()
                multiplier = 0.0
                result_data = {}

                try:
                    if game_type == "SLOT": multiplier, result_data = GameLogic.play_slot_machine()
                    elif game_type == "DICE": multiplier, result_data = GameLogic.play_dice_roll(play_req.bet_data.get('prediction'))
                    elif game_type == "WHEEL": multiplier, result_data = GameLogic.play_wheel_of_fortune(play_req.bet_data.get('prediction'))
                    elif game_type == "COIN": multiplier, result_data = GameLogic.play_coin_flip(play_req.bet_data.get('prediction'))
                    elif game_type == "HIGHLOW": multiplier, result_data = GameLogic.play_high_low(play_req.bet_data.get('prediction'))
                    else: multiplier, result_data = GameLogic.play_slot_machine()
                except ValueError as ve:
                    raise HTTPException(status_code=400, detail=str(ve))

                payout = bet_amount * multiplier
                is_win = payout > 0
                outcome_status = "WIN" if is_win else "LOSS"

                try:
                    await cur.execute("BEGIN;")
                    
                    # --- SESSION MANAGEMENT ---
                    await cur.execute(
                        """
                        SELECT session_id, started_at 
                        FROM GameSession 
                        WHERE player_id = %s AND game_id = %s AND ended_at IS NULL
                        ORDER BY started_at DESC LIMIT 1
                        """,
                        (player_id, real_tenant_game_id)
                    )
                    existing_session = await cur.fetchone()
                    session_id = None
                    
                    if existing_session:
                        start_time = existing_session['started_at']
                        now = datetime.datetime.now()
                        age = now - start_time if isinstance(start_time, datetime.datetime) else datetime.timedelta(0)                       
                        if age.total_seconds() > 7200: 
                            await cur.execute(
                                "UPDATE GameSession SET ended_at = NOW() WHERE session_id = %s",
                                (existing_session['session_id'],)
                            )
                            session_id = None 
                        else:
                            session_id = existing_session['session_id']

                    if not session_id:
                        await cur.execute(
                            "INSERT INTO GameSession (player_id, game_id, ip_address, started_at) VALUES (%s, %s, %s, NOW()) RETURNING session_id",
                            (player_id, real_tenant_game_id, client_ip)
                        )
                        session_id = (await cur.fetchone())['session_id']
                    
                    await cur.execute(
                        "SELECT COALESCE(MAX(round_number), 0) + 1 AS next_num FROM GameRound WHERE session_id = %s",
                        (session_id,)
                    )
                    next_round_num = (await cur.fetchone())['next_num']

                    await cur.execute(
                        "INSERT INTO GameRound (session_id, round_number, started_at) VALUES (%s, %s, NOW()) RETURNING round_id",
                        (session_id, next_round_num)
                    )
                    round_id = (await cur.fetchone())['round_id']

                    # --- WALLET DEDUCTION ---
                    new_balance = float(active_wallet['balance']) - bet_amount
                    await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, active_wallet['wallet_id']))

                    platform_fee = bet_amount * 0.01
                    
                    # Record Bet
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

                    # Outcome & Payout
                    await cur.execute("INSERT INTO BetOutcome (bet_id, result, payout_amount, settled_at) VALUES (%s, %s, %s, NOW())", (bet_id, outcome_status, payout))

                    final_balance = new_balance
                    if is_win:
                        final_balance = new_balance + payout
                        await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (final_balance, active_wallet['wallet_id']))

                    await cur.execute("UPDATE GameRound SET ended_at = NOW() WHERE round_id = %s", (round_id,))
                    
                    net_change = payout - bet_amount
                    txn_type = 'WIN' if net_change >= 0 else 'LOSS'
                    await cur.execute(
                        "INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at) VALUES (%s, %s, %s, %s, 'GAME_BET', %s, NOW())",
                        (active_wallet['wallet_id'], txn_type, abs(net_change), final_balance, bet_id)
                    )


                    await cur.execute(
                        """
                        SELECT campaign_id, bonus_amount, wagering_requirement, start_date, end_date
                        FROM BonusCampaign 
                        WHERE tenant_id = %s 
                          AND bonus_type = 'BET_THRESHOLD' 
                          AND is_active = TRUE 
                          AND start_date <= NOW() 
                          AND (end_date IS NULL OR end_date >= NOW())
                        """,
                        (player_tenant_id,)
                    )
                    active_campaigns = await cur.fetchall()

                    if active_campaigns:
                        # Ensure we have a BONUS wallet ID to credit to
                        bonus_wallet_id = bonus_wallet['wallet_id'] if bonus_wallet else None
                        
                        # If user doesn't have a bonus wallet yet, create one now
                        if not bonus_wallet_id:
                            await cur.execute(
                                "INSERT INTO Wallet (player_id, wallet_type, currency_code, balance) VALUES (%s, 'BONUS', 'USD', 0) RETURNING wallet_id",
                                (player_id,)
                            )
                            bonus_wallet_id = (await cur.fetchone())['wallet_id']

                        for camp in active_campaigns:
                            c_id = camp['campaign_id']
                            target_bet_amount = float(camp['wagering_requirement'])
                            bonus_reward = float(camp['bonus_amount'])
                            c_start = camp['start_date']
                            c_end = camp['end_date'] if camp['end_date'] else datetime.datetime.now()

                            # 2. Check if player ALREADY received this bonus
                            #    We check WalletTransaction for a reference to this campaign_id
                            await cur.execute(
                                """
                                SELECT 1 FROM WalletTransaction 
                                WHERE wallet_id = %s 
                                  AND reference_type = 'CAMPAIGN' 
                                  AND reference_id = %s
                                LIMIT 1
                                """,
                                (bonus_wallet_id, str(c_id))
                            )
                            already_awarded = await cur.fetchone()

                            if not already_awarded:
                                #  Calculate total bets by this player within the campaign period
                                await cur.execute(
                                    """
                                    SELECT COALESCE(SUM(bet_amount), 0) as total_bets
                                    FROM Bet 
                                    WHERE player_id = %s 
                                      AND created_at >= %s 
                                      AND created_at <= %s
                                    """,
                                    (player_id, c_start, c_end)
                                )
                                total_bets_row = await cur.fetchone()
                                total_bets = float(total_bets_row['total_bets'])

                                #Award Bonus if Threshold Reached
                                if total_bets >= target_bet_amount:
                                    # Update Bonus Wallet
                                    await cur.execute(
                                        "UPDATE Wallet SET balance = balance + %s WHERE wallet_id = %s RETURNING balance",
                                        (bonus_reward, bonus_wallet_id)
                                    )
                                    new_bonus_bal = (await cur.fetchone())['balance']

                                    
                                    await cur.execute(
                                        """
                                        INSERT INTO WalletTransaction 
                                        (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at) 
                                        VALUES (%s, 'BONUS_CREDIT', %s, %s, 'CAMPAIGN', %s, NOW())
                                        """,
                                        (bonus_wallet_id, bonus_reward, new_bonus_bal, str(c_id))
                                    )
                                    print(f"💰 AUTOMATIC BONUS: Player {player_id} awarded ${bonus_reward} for Campaign {c_id}")

                   
                    await conn.commit()

                    return {
                        "game_id": str(real_tenant_game_id),
                        "game_name": game_data['game_name'],
                        "bet_amount": bet_amount,
                        "win_amount": net_change,
                        "balance_after": final_balance,
                        "outcome": outcome_status,
                        "game_data": result_data,
                        "session_id":str(session_id)
                    }

                except Exception as e:
                    await conn.rollback()
                    raise e 

    except HTTPException as http_e:
        raise http_e 
    except Exception as e:
        print(f"SERVER CRASH IN /play: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")