from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db_connection
from app.core.security import hash_password,verify_password
from app.core.dependencies import require_super_admin
from app.routers.auth import get_current_user
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal 
from app.schemas.admin_schema import CreateAdminRequest, CreateTenantRequest,CountryCreate,CurrencyCreate,ExchangeRateCreate, RateUpdate, UpdateAdminStatusRequest,PasswordUpdateRequest, PlatformGameCreate, PlatformGameUpdate
router = APIRouter()

# create super admin
@router.post("/users", status_code=201)
async def create_super_admin_user(
    data: CreateAdminRequest, 
    current_user: dict = Depends(get_current_user)
    ):
    if current_user['role'] != 'SUPER_ADMIN': raise HTTPException(403, "Unauthorized")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            hashed_pwd = hash_password(data.password)
            try:
                await cur.execute(
                    """
                    INSERT INTO PlatformUser (email, password_hash, role_id, status)
                    VALUES (%s, %s, 1, 'ACTIVE')
                    """,
                    (data.email, hashed_pwd)
                )
                await conn.commit()
                return {"message": "New Super Admin created successfully"}
            except Exception as e:
                await conn.rollback()
                raise HTTPException(400, detail="Email already exists or invalid data.")

# get super admins
@router.get("/admins/all")
async def get_all_super_admins(admin: dict = Depends(require_super_admin)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT platform_user_id, email, status, created_at
                FROM platformuser
                ORDER BY created_at DESC
            """)
            return await cur.fetchall()
     
# update super admin status
@router.put("/users/status")
async def update_super_admin_status(
    data: UpdateAdminStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'SUPER_ADMIN': raise HTTPException(403, "Unauthorized")
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE PlatformUser SET status = %s WHERE email = %s",
                (data.status, data.email)
            )
            if cur.rowcount == 0:
                raise HTTPException(404, "User not found")
                
            await conn.commit()
            return {"message": f"User {data.email} status updated to {data.status}"}

# update password
@router.put("/me/password")
async def update_own_password(
    data: PasswordUpdateRequest,
    current_user: dict = Depends(get_current_user)
    ):
    user_id = current_user.get('id') or current_user.get('sub')
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Verify Old Password
            await cur.execute("SELECT password_hash FROM PlatformUser WHERE platform_user_id = %s", (user_id,))
            row = await cur.fetchone()          
            if not row or not verify_password(data.old_password, row['password_hash']):
                raise HTTPException(400, "Incorrect old password")
            # 2. Update to New Password
            new_hash = hash_password(data.new_password)
            await cur.execute(
                "UPDATE PlatformUser SET password_hash = %s WHERE platform_user_id = %s",
                (new_hash, user_id)
            )
            await conn.commit()
            return {"message": "Password updated successfully"}

   
# get tenants
@router.get("/tenants/all")
async def get_all_tenants(admin: dict = Depends(require_super_admin)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
           
            await cur.execute("""
                SELECT 
                    t.tenant_id, 
                    t.tenant_name, 
                    t.kyc_status, 
                    t.status, 
                    t.created_at,
                    c.country_name,
                    COALESCE(STRING_AGG(pg.title, ', '), '') as game_names
                FROM Tenant t
                LEFT JOIN Country c ON t.country_id = c.country_id
                LEFT JOIN TenantGame tg ON t.tenant_id = tg.tenant_id
                LEFT JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                GROUP BY 
                    t.tenant_id, 
                    t.tenant_name, 
                    t.kyc_status, 
                    t.status, 
                    t.created_at, 
                    c.country_name
                ORDER BY t.created_at DESC
            """)
            return await cur.fetchall()

# create tenant
@router.post("/tenants", status_code=201)
async def create_tenant(data: CreateTenantRequest, current_user: dict = Depends(get_current_user)):
    """
    Manually creates a new Tenant and Admin User.
    Can optionally close a KYC request if 'kyc_id' is provided.
    """
    
    if current_user.get("role") != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    super_admin_id = (
        current_user.get("user_id") or 
        current_user.get("sub") or 
        current_user.get("id") or 
        current_user.get("platform_user_id")
    )
    
    if not super_admin_id:
        raise HTTPException(status_code=500, detail="Could not determine Super Admin ID from token.")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute("BEGIN")

                # Check Email Duplication
                await cur.execute("SELECT 1 FROM TenantUser WHERE email = %s", (data.admin_email,))
                if await cur.fetchone():
                    raise HTTPException(status_code=400, detail="Admin email already exists")

                # Create Tenant 
                await cur.execute(
                    """
                    INSERT INTO Tenant (tenant_name, country_id, default_currency_code, status, created_by) 
                    VALUES (%s, %s, %s, 'ACTIVE', %s) 
                    RETURNING tenant_id
                    """,
                    (data.tenant_name, data.country_id, data.currency_code, super_admin_id)
                )
                tenant_row = await cur.fetchone()
                new_tenant_id = tenant_row['tenant_id']

                # B. Create Tenant Admin
                hashed_pw = hash_password(data.admin_password)
                
                await cur.execute(
                    """
                    INSERT INTO TenantUser (tenant_id, email, password_hash, role_id)
                    VALUES (
                        %s, 
                        %s, 
                        %s, 
                        (SELECT role_id FROM Role WHERE role_name = 'TENANT_ADMIN')
                    )
                    """,
                    (new_tenant_id, data.admin_email, hashed_pw)
                )

                # CIf this came from a KYC Request, update status to VERIFIED
                if data.kyc_id:
                    await cur.execute(
                        "UPDATE TenantKYCProfile SET kyc_status = 'VERIFIED', reviewed_at = NOW() WHERE tenant_kyc_profile_id = %s", 
                        (data.kyc_id,)
                    )

                await cur.execute("COMMIT")
                return {"message": "Tenant created successfully", "tenant_id": new_tenant_id}

            except Exception as e:
                await cur.execute("ROLLBACK")
                print(f" CREATE TENANT ERROR: {e}") 
                raise HTTPException(status_code=400, detail=str(e))

# update tenant status
@router.put("/tenants/status")
async def update_tenant_status(data: dict, admin: dict = Depends(require_super_admin)):
    # data expected: { "tenant_id": int, "status": "ACTIVE" | "SUSPENDED" | "TERMINATED" }
    
    if data.get("status") not in ['ACTIVE', 'SUSPENDED', 'TERMINATED']:
        raise HTTPException(400, "Invalid status")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Check if tenant exists
            await cur.execute("SELECT tenant_id FROM Tenant WHERE tenant_id = %s", (data["tenant_id"],))
            if not await cur.fetchone():
                raise HTTPException(404, "Tenant not found")

            # Update Status
            await cur.execute(
                "UPDATE Tenant SET status = %s WHERE tenant_id = %s",
                (data["status"], data["tenant_id"])
            )
            
            # If Terminated or Suspended, optionally terminate their admin user as well
            if data["status"] in ['SUSPENDED', 'TERMINATED']:
                await cur.execute(
                    "UPDATE TenantUser SET status = %s WHERE tenant_id = %s",
                    (data["status"], data["tenant_id"])
                )

            await conn.commit()
            return {"status": "success", "message": f"Tenant updated to {data['status']}"}

# add currency
@router.post("/currencies", status_code=201)
async def create_currency(data: CurrencyCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'SUPER_ADMIN': raise HTTPException(403, "Unauthorized")
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(
                    """INSERT INTO Currency (currency_code, currency_name, symbol, decimal_precision)
                       VALUES (%s, %s, %s, %s)""",
                    (data.currency_code.upper(), data.currency_name, data.symbol, data.decimal_precision)
                )
                await cur.execute("COMMIT")
                return {"message": "Currency created"}
            except Exception as e:
                await cur.execute("ROLLBACK")
                raise HTTPException(400, detail=f"Failed to create currency: {str(e)}")

# get currencies
@router.get("/currencies")
async def get_currencies(current_user: dict = Depends(get_current_user)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM Currency ORDER BY currency_code")
            rows = await cur.fetchall()
            return [dict(row) for row in rows]

# add country
@router.post("/countries", status_code=201)
async def create_country(data: CountryCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'SUPER_ADMIN': raise HTTPException(403, "Unauthorized")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(
                    """INSERT INTO Country (country_name, iso2_code, iso3_code, default_currency_code, default_timezone)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (data.country_name, data.iso2_code.upper(), data.iso3_code.upper(), 
                     data.default_currency_code.upper(), data.default_timezone)
                )
                await cur.execute("COMMIT")
                return {"message": "Country created"}
            except Exception as e:
                await cur.execute("ROLLBACK")
                raise HTTPException(400, detail=f"Failed to create country: {str(e)}")

# get countries
@router.get("/countries")
async def get_countries(current_user: dict = Depends(get_current_user)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM Country ORDER BY country_name")
            rows = await cur.fetchall()
            return [dict(row) for row in rows]

# get exchange rates
@router.get("/exchange-rates")
async def get_exchange_rates(current_user: dict = Depends(get_current_user)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT exchange_rate_id, base_currency_code, quote_currency_code, rate, effective_from 
                FROM ExchangeRate 
                ORDER BY base_currency_code
            """)
            rows = await cur.fetchall()
            return [
                {
                    "id": str(row['exchange_rate_id']),
                    "base": row['base_currency_code'],
                    "quote": row['quote_currency_code'],
                    "rate": row['rate'],
                    "created_at": row['effective_from']
                } for row in rows
            ]

# add exchange rates
@router.post("/exchange-rates", status_code=201)
async def create_exchange_rate(data: ExchangeRateCreate, current_user: dict = Depends(get_current_user)):
    """
    UPSERT: Inserts a new rate OR updates existing if pair exists.
    REQUIRES: UNIQUE(base_currency_code, quote_currency_code) constraint in DB.
    """
    if current_user['role'] != 'SUPER_ADMIN': raise HTTPException(403, "Unauthorized")
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                # 1. Validation: Ensure currencies exist
                await cur.execute("SELECT 1 FROM Currency WHERE currency_code = %s", (data.base_currency,))
                if not await cur.fetchone():
                    raise HTTPException(400, f"Base Currency '{data.base_currency}' does not exist.")

                await cur.execute("SELECT 1 FROM Currency WHERE currency_code = %s", (data.quote_currency,))
                if not await cur.fetchone():
                    raise HTTPException(400, f"Quote Currency '{data.quote_currency}' does not exist.")

                # 2. Upsert
                await cur.execute(
                    """INSERT INTO ExchangeRate (base_currency_code, quote_currency_code, rate, effective_from)
                       VALUES (%s, %s, %s, NOW())
                       ON CONFLICT (base_currency_code, quote_currency_code) 
                       DO UPDATE SET rate = EXCLUDED.rate, effective_from = NOW()""",
                    (data.base_currency.upper(), data.quote_currency.upper(), data.rate)
                )
                await cur.execute("COMMIT")
                return {"message": "Exchange Rate saved"}
            except HTTPException as he:
                raise he
            except Exception as e:
                await cur.execute("ROLLBACK")
                raise HTTPException(400, detail=f"Database Error: {str(e)}")

# update exchange rates
@router.put("/exchange-rates/{rate_id}")
async def update_exchange_rate_by_id(rate_id: str, data: RateUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'SUPER_ADMIN': raise HTTPException(403, "Unauthorized")
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(
                    "UPDATE ExchangeRate SET rate = %s, effective_from = NOW() WHERE exchange_rate_id = %s",
                    (data.rate, rate_id)
                )
                if cur.rowcount == 0:
                    raise HTTPException(404, "Exchange Rate ID not found")
                    
                await cur.execute("COMMIT")
                return {"message": "Rate updated successfully"}
            except Exception as e:
                await cur.execute("ROLLBACK")
                raise HTTPException(400, detail=str(e))

# get games
@router.get("/games/platform")
async def get_platform_games(current_user: dict = Depends(require_super_admin)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT platform_game_id, title, game_type, default_thumbnail_url, provider, is_active, created_at
                FROM PlatformGame
                ORDER BY created_at DESC
            """)
            return await cur.fetchall()

#  ADD NEW GAME 
@router.post("/games/platform")
async def create_platform_game(
    data: PlatformGameCreate, 
    current_user: dict = Depends(require_super_admin)
):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(
                    """
                    INSERT INTO PlatformGame 
                    (title, game_type, default_thumbnail_url, provider, video_url, is_active)
                    VALUES (%s, %s, %s, %s, %s, TRUE)
                    RETURNING platform_game_id, title, is_active, default_thumbnail_url, provider, game_type, video_url
                    """,
                    (
                        data.title, 
                        data.game_type, 
                        data.default_thumbnail_url, 
                        data.provider, 
                        data.video_url # <--- Save to DB
                    )
                )
                game = await cur.fetchone()
                await conn.commit()
                return game 
            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=500, detail=str(e))         

#  TOGGLE GAME STATUS 
@router.patch("/games/platform/{game_id}")
async def update_platform_game(game_id: str, data: PlatformGameUpdate, current_user: dict = Depends(require_super_admin)):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                UPDATE PlatformGame 
                SET is_active = %s 
                WHERE platform_game_id = %s
                RETURNING platform_game_id, is_active
                """,
                (data.is_active, game_id)
            )
            updated = await cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Game not found")
            
            await conn.commit()
            return {"status": "updated", "is_active": updated['is_active']}

# get earnings
@router.get("/earnings")
async def get_platform_earnings(
    group_by: str = "TENANT",
    time_range: str = "ALL",  # <--- CHANGED DEFAULT TO "ALL" FOR TESTING
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_super_admin)
    ):
    try:
        now = datetime.utcnow()
        query_start = None
        query_end = now + timedelta(days=2) 
        
        if time_range == "1D":
            query_start = now - timedelta(days=1)
        elif time_range == "1W":
            query_start = now - timedelta(weeks=1)
        elif time_range == "1M":
            query_start = now - timedelta(days=30)
        elif time_range == "ALL":
             # Go back 10 years to catch everything
            query_start = now - timedelta(days=3650)
        
        # Fallback
        if not query_start:
             query_start = now - timedelta(days=365)

        print(f"DEBUG: Searching Bets from {query_start} to {query_end}")

        async with get_db_connection() as conn:
            async with conn.cursor() as cur:
                # Grouping
                if group_by == "GAME":
                    select_clause = "pg.title"
                    group_clause = "pg.title"
                else:
                    select_clause = "t.tenant_name"
                    group_clause = "t.tenant_name"

                # SQL Query
                # We removed the WHERE clause for testing if time_range is 'ALL'
                sql = f"""
                    SELECT 
                        COALESCE({select_clause}, 'Unknown') AS label,
                        COALESCE(SUM(b.platform_fee_amount), 0) AS earnings,
                        COUNT(b.bet_id) AS total_bets
                    FROM Bet b
                    LEFT JOIN TenantGame tg ON b.tenant_game_id = tg.tenant_game_id
                    LEFT JOIN Tenant t ON b.tenant_id = t.tenant_id
                    LEFT JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                    WHERE b.created_at >= %s AND b.created_at <= %s
                    GROUP BY {group_clause}
                    ORDER BY earnings DESC
                """
                
                await cur.execute(sql, (query_start, query_end))
                raw_results = await cur.fetchall()
                
                print(f" DEBUG: Database returned {len(raw_results)} rows")

                clean_results = []
                total_earnings = 0.0

                for row in raw_results:
                    if isinstance(row, tuple):
                        r_label, r_earn, r_bets = row[0], row[1], row[2]
                    else:
                        r_label = row['label']
                        r_earn = row['earnings']
                        r_bets = row['total_bets']

                    if isinstance(r_earn, Decimal):
                        r_earn = float(r_earn)
                    
                    safe_earnings = r_earn or 0.0
                    total_earnings += safe_earnings

                    clean_results.append({
                        "label": r_label,
                        "earnings": safe_earnings,
                        "total_bets": r_bets
                    })

                return {
                    "total_earnings": total_earnings,
                    "breakdown": clean_results,
                    "period": {
                        "start": query_start.strftime("%Y-%m-%d"),
                        "end": query_end.strftime("%Y-%m-%d")
                    }
                }

    except Exception as e:
        print(f" ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
 
 