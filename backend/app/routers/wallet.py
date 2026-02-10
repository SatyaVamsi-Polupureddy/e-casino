from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import require_player, verify_player_is_approved
from app.schemas.wallet_schema import DepositRequest, TransactionResponse

router = APIRouter(
    prefix="/wallet", 
    tags=["Wallet Operations"],
    dependencies=[Depends(verify_player_is_approved)] 
)

@router.get("/balance")
async def get_wallet_balance(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 'REAL' 
            await cur.execute(
                """
                SELECT wallet_id, currency_code, balance 
                FROM Wallet 
                WHERE player_id = %s AND wallet_type = 'REAL'
                """,
                (player_id,)
            )
            wallet = await cur.fetchone()
            
            if not wallet:
                raise HTTPException(status_code=404, detail="Wallet not found")
                
            return wallet

@router.post("/deposit")
async def deposit_money(
    data: DepositRequest, 
    user: dict = Depends(require_player)
):
    player_id = user["user_id"]
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive.")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT wallet_id, balance, currency_code FROM Wallet WHERE player_id = %s AND wallet_type = 'REAL'",
                (player_id,)
            )
            wallet = await cur.fetchone()
            
            if not wallet:
                raise HTTPException(status_code=404, detail="Active wallet not found.")
            
            wallet_id = wallet['wallet_id']
            currency_code = wallet['currency_code']
            current_balance = float(wallet['balance'])

            try:
                await cur.execute("BEGIN;")
                await cur.execute(
                    """
                    INSERT INTO Deposit 
                    (player_id, amount, currency_code, status, created_at)
                    VALUES (%s, %s, %s, 'SUCCESS', NOW())
                    RETURNING deposit_id;
                    """,
                    (player_id, data.amount, currency_code)
                )
                deposit_id = (await cur.fetchone())['deposit_id']

                new_balance = current_balance + data.amount
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet_id))
                await cur.execute(
                    """
                    INSERT INTO WalletTransaction 
                    (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                    VALUES (%s, 'DEPOSIT', %s, %s, 'DEPOSIT_RECORD', %s, NOW())
                    """,
                    (wallet_id, data.amount, new_balance, deposit_id)
                )

                await conn.commit()
                
                return {
                    "status": "success", 
                    "new_balance": new_balance, 
                    "deposited": data.amount,
                    "deposit_id": str(deposit_id)
                }

            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=500, detail=str(e))
            
@router.get("/history", response_model=list[TransactionResponse])
async def get_transaction_history(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT t.wallet_txn_id as transaction_id, t.transaction_type as type, 
                       t.amount, t.balance_after, t.created_at
                FROM WalletTransaction t
                JOIN Wallet w ON t.wallet_id = w.wallet_id
                WHERE w.player_id = %s
                ORDER BY t.created_at DESC
                LIMIT 50
                """,
                (player_id,)
            )
            return await cur.fetchall()