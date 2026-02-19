from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.security import hash_password, verify_password
from app.core.dependencies import verify_staff_is_active
from app.core.audit_logger import log_activity
import secrets
from datetime import datetime, timedelta
from app.schemas.staff_operations_schema import (
    StaffPlayerRegister, 
    WithdrawalInitRequest, 
    WithdrawalVerifyRequest,
    KYCUploadRequest,
    PasswordUpdate
)
 

router = APIRouter(
    prefix="/staff", 
    tags=["Tenant Staff Operations"],
    dependencies=[Depends(verify_staff_is_active)] 
)

# REGISTER PLAYER
@router.post("/register-player")
async def staff_create_player(data: StaffPlayerRegister, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (staff_id,))
            row = await cur.fetchone()
            if not row: raise HTTPException(400, "Staff not assigned to tenant")
            tenant_id = row['tenant_id']
            await cur.execute(
                """
                SELECT default_currency_code, default_daily_bet_limit, default_daily_loss_limit, default_max_single_bet 
                FROM Tenant WHERE tenant_id = %s
                """, (tenant_id,)
            )
            tenant_config = await cur.fetchone()
            currency = tenant_config['default_currency_code']
            #  Prevent Platform Admin Email 
            await cur.execute("SELECT 1 FROM PlatformUser WHERE email = %s", (data.email,))
            if await cur.fetchone():
                raise HTTPException(400, "This email is reserved for administrative use.")   
            hashed_pwd = hash_password(data.password)  
            try:
                await cur.execute(
                    """
                    INSERT INTO Player 
                    (tenant_id, username, email, password_hash, country_id, kyc_status, status, created_by, created_at, daily_bet_limit, daily_loss_limit, max_single_bet)
                    VALUES (%s, %s, %s, %s, %s, 'NOT_SUBMITTED', 'ACTIVE', %s, NOW(), %s, %s, %s)
                    RETURNING player_id;
                    """,
                    (tenant_id, data.username, data.email, hashed_pwd, data.country_id, staff_id, 
                     tenant_config['default_daily_bet_limit'], tenant_config['default_daily_loss_limit'], tenant_config['default_max_single_bet'])
                )
                player_id = (await cur.fetchone())['player_id']
                await cur.execute(
                    "INSERT INTO Wallet (player_id, wallet_type, currency_code, balance) VALUES (%s, 'REAL', %s, 0.00)",
                    (player_id, currency)
                )
                await conn.commit()
                log_activity(
                    tenant_id=tenant_id,
                    user_email=staff.get("email", "unknown"),
                    action="REGISTER_PLAYER",
                    details=f"Registered player: {data.username} ({data.email})"
                )
                return {"status": "success", "player_id": player_id, "message": "Player registered successfully"}        
            except Exception as e:
                await conn.rollback()
                if "unique" in str(e).lower() and "email" in str(e).lower():
                    raise HTTPException(400, "Email already exists in this casino.")
                raise HTTPException(400, str(e))

# look player
@router.get("/lookup")
async def lookup_player(email: str, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (staff_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            
            await cur.execute(
                """
                SELECT 
                    p.player_id, 
                    p.username, 
                    p.email, 
                    p.status, 
                    p.kyc_status, 
                    p.created_at,
                    COALESCE(w.balance, 0.0) as balance 
                FROM Player p
                LEFT JOIN Wallet w ON p.player_id = w.player_id AND w.wallet_type = 'REAL'
                WHERE p.email = %s AND p.tenant_id = %s
                """,
                (email, tenant_id)
            )
            player = await cur.fetchone()
            
            if not player: 
                raise HTTPException(404, "Player not found")
                
            return player

# initiate deposit
@router.post("/deposit/initiate")
async def initiate_deposit(data: WithdrawalInitRequest, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    if data.amount <= 0: raise HTTPException(400, "Amount must be positive")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (staff_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            await cur.execute(
                "SELECT player_id, kyc_status FROM Player WHERE email = %s AND tenant_id = %s", 
                (data.player_email, tenant_id)
            )
            player = await cur.fetchone()
            
            if not player: 
                raise HTTPException(404, "Player not found in your casino.")
            if player['kyc_status'] != 'APPROVED':
                 raise HTTPException(403, "Deposit Blocked: Player KYC is not APPROVED.")
            otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
            expires_at = datetime.now() + timedelta(minutes=5)

            await cur.execute("DELETE FROM PlayerOTP WHERE player_id = %s", (player['player_id'],))
            await cur.execute(
                "INSERT INTO PlayerOTP (player_id, otp_code, amount, expires_at, otp_type) VALUES (%s, %s, %s, %s, 'DEPOSIT')",
                (player['player_id'], otp_code, data.amount, expires_at)
            )
            await conn.commit()
            print(f" DEPOSIT OTP: {otp_code}") 
            log_activity(
                tenant_id=tenant_id,
                user_email=staff.get("email", "unknown"),
                action="INITIATE_DEPOSIT",
                details=f"Initiated deposit for {data.player_email}: {data.amount}"
            )
            return {"status": "otp_sent", "message": "Deposit OTP sent."}

# complte deposit
@router.post("/deposit/verify")
async def verify_deposit(data: WithdrawalVerifyRequest, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT player_id FROM Player WHERE email = %s", (data.player_email,))
            player = await cur.fetchone()
            if not player: raise HTTPException(404, "Player not found")
            player_id = player['player_id']

            await cur.execute("SELECT * FROM PlayerOTP WHERE player_id = %s", (player_id,))
            otp_record = await cur.fetchone()

            if not otp_record or otp_record['otp_type'] != 'DEPOSIT': raise HTTPException(400, "No deposit request found.")
            if otp_record['otp_code'] != data.otp_code: raise HTTPException(400, "Invalid OTP.")
            if datetime.now() > otp_record['expires_at']: raise HTTPException(400, "OTP Expired.")

            amount = float(otp_record['amount'])
            try:
                await cur.execute("SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type='REAL'", (player_id,))
                wallet = await cur.fetchone()
                
                new_balance = float(wallet['balance']) + amount
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))
                await cur.execute(
                    """
                    INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                    VALUES (%s, 'DEPOSIT', %s, %s, 'STAFF_OTP', %s, NOW())
                    """,
                    (wallet['wallet_id'], amount, new_balance, staff_id)
                )
                await cur.execute("DELETE FROM PlayerOTP WHERE player_id = %s", (player_id,))
                await conn.commit()

                log_activity(
                    tenant_id=staff.get("tenant_id"), 
                    user_email=staff.get("email", "unknown"),
                    action="COMPLETE_DEPOSIT",
                    details=f"Verified deposit for {data.player_email}: {amount}"
                )
                return {"status": "success", "new_balance": new_balance}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(500, str(e))

# start withdraw
@router.post("/withdraw/initiate")
async def initiate_withdrawal(data: WithdrawalInitRequest, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (staff_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            await cur.execute("""
                SELECT p.player_id, p.kyc_status, w.balance 
                FROM Player p JOIN Wallet w ON p.player_id = w.player_id
                WHERE p.email = %s AND p.tenant_id = %s AND w.wallet_type = 'REAL'
            """, (data.player_email, tenant_id))
            player = await cur.fetchone()
            
            if not player: raise HTTPException(404, "Player not found.")
            if player['kyc_status'] != 'APPROVED': raise HTTPException(403, "Player KYC not approved.")
            if float(player['balance']) < data.amount: raise HTTPException(400, "Insufficient funds.")

            otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
            expires_at = datetime.now() + timedelta(minutes=5)

            await cur.execute("DELETE FROM PlayerOTP WHERE player_id = %s", (player['player_id'],))
            await cur.execute(
                "INSERT INTO PlayerOTP (player_id, otp_code, amount, expires_at, otp_type) VALUES (%s, %s, %s, %s, 'WITHDRAWAL')",
                (player['player_id'], otp_code, data.amount, expires_at)
            )
            await conn.commit()
            print(f" WITHDRAW OTP: {otp_code}")
            log_activity(
                tenant_id=tenant_id,
                user_email=staff.get("email", "unknown"),
                action="INITIATE_WITHDRAWAL",
                details=f"Initiated withdrawal for {data.player_email}: {data.amount}"
            )
            return {"status": "otp_sent", "message": "Withdrawal OTP sent."}



@router.post("/withdraw/verify")
async def verify_withdrawal(data: WithdrawalVerifyRequest, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT player_id FROM Player WHERE email = %s", (data.player_email,))
            player_row = await cur.fetchone()
            if not player_row: raise HTTPException(404, "Player not found")
            player_id = player_row['player_id']

            await cur.execute("SELECT * FROM PlayerOTP WHERE player_id = %s", (player_id,))
            otp_record = await cur.fetchone()

            if not otp_record or otp_record['otp_type'] != 'WITHDRAWAL': raise HTTPException(400, "No pending withdrawal.")
            if otp_record['otp_code'] != data.otp_code: raise HTTPException(400, "Invalid OTP Code.")
            amount = float(otp_record['amount'])
            try:
                await cur.execute("SELECT wallet_id, balance, currency_code FROM Wallet WHERE player_id = %s AND wallet_type='REAL'", (player_id,))
                wallet = await cur.fetchone()
                
                if float(wallet['balance']) < amount: raise HTTPException(400, "Insufficient funds.")

                new_balance = float(wallet['balance']) - amount
                await cur.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))              
                # Insert Withdrawal Record
                await cur.execute(
                    "INSERT INTO Withdrawal (player_id, gross_amount, net_amount, currency_code, status, requested_at, processed_at) VALUES (%s, %s, %s, %s, 'PAID', NOW(), NOW()) RETURNING withdrawal_id",
                    (player_id, amount, amount, wallet['currency_code'])
                )
                withdrawal_id = (await cur.fetchone())['withdrawal_id'] 
                await cur.execute(
                    """
                    INSERT INTO WalletTransaction (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, created_at)
                    VALUES (%s, 'WITHDRAWAL', %s, %s, 'STAFF_OTP', %s, NOW())
                    """,
                    (wallet['wallet_id'], amount, new_balance, staff_id)
                )  
                await cur.execute("DELETE FROM PlayerOTP WHERE player_id = %s", (player_id,))
                await conn.commit()
                log_activity(
                    tenant_id=staff.get("tenant_id"),
                    user_email=staff.get("email", "unknown"),
                    action="COMPLETE_WITHDRAWAL",
                    details=f"Verified withdrawal for {data.player_email}: {amount}"
                )
                return {"status": "success", "new_balance": new_balance}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(500, str(e))


# change password
@router.put("/me/password")
async def update_staff_password(data: PasswordUpdate, staff: dict = Depends(verify_staff_is_active)):
    staff_id = staff["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT password_hash FROM TenantUser WHERE tenant_user_id = %s", (staff_id,))
            row = await cur.fetchone()
            if not row or not verify_password(data.old_password, row['password_hash']):
                raise HTTPException(400, "Incorrect old password")
                
            new_hash = hash_password(data.new_password)
            await cur.execute("UPDATE TenantUser SET password_hash = %s WHERE tenant_user_id = %s", (new_hash, staff_id))
            await conn.commit()
            log_activity(
                tenant_id=staff.get("tenant_id"),
                user_email=staff.get("email", "unknown"),
                action="UPDATE_PASSWORD",
                details="Staff updated their own password"
            )
            return {"message": "Password updated"}




@router.get("/my-transactions")
async def get_my_transactions(staff: dict = Depends(verify_staff_is_active)):
    staff_id = str(staff["user_id"]) 
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT wt.wallet_txn_id as transaction_id, 
                       wt.transaction_type, 
                       wt.amount, 
                       wt.created_at, 
                       p.username, 
                       p.email
                FROM WalletTransaction wt
                JOIN Wallet w ON wt.wallet_id = w.wallet_id
                JOIN Player p ON w.player_id = p.player_id
                WHERE wt.reference_id = %s::text
                  AND wt.reference_type IN ('STAFF_OTP', 'CASHIER_DESK', 'DEPOSIT', 'WITHDRAWAL')
                ORDER BY wt.created_at DESC 
                LIMIT 50
                """,
                (staff_id,)
            )
            return await cur.fetchall()

# player kyc upload
@router.post("/player/upload-kyc-json")
async def staff_upload_player_kyc_json(
    data: KYCUploadRequest,
    staff: dict = Depends(verify_staff_is_active)
):
    staff_id = staff["user_id"]
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (staff_id,))
            tenant_id = (await cur.fetchone())['tenant_id']
            await cur.execute("SELECT player_id, username FROM Player WHERE email = %s AND tenant_id = %s", (data.player_email, tenant_id))
            player = await cur.fetchone()
            
            if not player: 
                raise HTTPException(status_code=404, detail="Player not found in your casino.")

            player_name = player['username'] if player['username'] else "Player"

            try:
                await cur.execute(
                    """
                    UPDATE Player 
                    SET kyc_status = 'PENDING', kyc_document_reference = %s
                    WHERE player_id = %s
                    """,
                    (data.doc_url, player['player_id'])
                )

                await cur.execute(
                    """
                    INSERT INTO PlayerKYCProfile 
                    (player_id, full_name, document_type, document_reference, kyc_status, submitted_at)
                    VALUES (%s, %s, 'ID_CARD', %s, 'PENDING', NOW())
                    ON CONFLICT (player_id) 
                    DO UPDATE SET 
                        document_reference = EXCLUDED.document_reference, 
                        kyc_status = 'PENDING', 
                        submitted_at = NOW();
                    """,
                    (player['player_id'], player_name, data.doc_url)
                )
                
                await conn.commit()
                log_activity(
                    tenant_id=tenant_id,
                    user_email=staff.get("email", "unknown"),
                    action="UPLOAD_KYC",
                    details=f"Uploaded KYC for {data.player_email}"
                )
                return {"status": "success", "message": "KYC Uploaded successfully"}

            except Exception as e:
                await conn.rollback()
                print(f"DATABASE ERROR: {e}") 
                raise HTTPException(status_code=400, detail=f"DB Error: {str(e)}")