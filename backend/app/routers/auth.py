from fastapi import APIRouter, HTTPException, status, Depends
from app.core.database import get_db_connection
from app.core.security import verify_password, create_access_token, hash_password
from app.schemas.auth_schema import LoginRequest, Token, SignupRequest
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from app.core.dependencies import require_player # or require_user depending on your setup

# 1. Load the .env file
load_dotenv()

# 2. Get variables (with a fallback just in case)
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

 
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            user = None
            role = "PLAYER"
            user_id = None
            user_status = "ACTIVE"
            
            # 1. Check PlatformUser (Super Admin)
            await cur.execute("SELECT platform_user_id, password_hash, role_id, status FROM PlatformUser WHERE email = %s", (credentials.email,))
            user = await cur.fetchone()
            
            if user:
                role = "SUPER_ADMIN"
                user_id = user['platform_user_id']
                user_status = user['status']
            
            # 2. Check TenantUser (Staff OR Admin)
            if not user:
                # ✅ CRITICAL FIX: Join with Role table to get the REAL role (TENANT_ADMIN or TENANT_STAFF)
                await cur.execute(
                    """
                    SELECT tu.tenant_user_id, tu.password_hash, r.role_name, tu.status 
                    FROM TenantUser tu
                    JOIN Role r ON tu.role_id = r.role_id
                    WHERE tu.email = %s
                    """, 
                    (credentials.email,)
                )
                user = await cur.fetchone()
                if user:
                    role = user['role_name'] # <--- This will now correctly be 'TENANT_STAFF'
                    user_id = user['tenant_user_id']
                    user_status = user['status']

            # 3. Check Player
            if not user:
                await cur.execute("SELECT player_id, password_hash, status FROM Player WHERE email = %s", (credentials.email,))
                user = await cur.fetchone()

                if user:
                    role = "PLAYER"
                    user_id = user['player_id']
                    user_status = user['status'] 

            # 4. Password Validation
            if not user or not verify_password(credentials.password, user['password_hash']):
                raise HTTPException(status_code=401, detail="Incorrect email or password")

            # 5. Status Check
            if user_status != 'ACTIVE':
                 raise HTTPException(status_code=403, detail="Account is Inactive, Suspended, or Terminated.")

            # 6. Generate Token
            access_token = create_access_token(subject=str(user_id), role=role)
            return {"access_token": access_token, "token_type": "bearer", "role": role}


@router.post("/register/super-admin")
async def create_super_admin(data: SignupRequest):
    """Temporary route to create your first Super Admin"""
    hashed = hash_password(data.password)
    
    # CORRECTED: Open the connection directly in the async with statement
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                # Assuming Role ID 1 is SUPER_ADMIN
                await cur.execute(
                    """
                    INSERT INTO PlatformUser (email, password_hash, role_id, status)
                    VALUES (%s, %s, 1, 'ACTIVE')
                    RETURNING platform_user_id
                    """,
                    (data.email, hashed)
                )
                # Note: In psycopg3 context managers, commit is often automatic on exit if no error,
                # but explicit commit is safer for INSERTs.
                await conn.commit()
                return {"status": "Super Admin Created"}
            except Exception as e:
                # If unique constraint violation (email already exists)
                if "23505" in str(e) or "unique constraint" in str(e).lower():
                    raise HTTPException(status_code=400, detail="Super Admin with this email already exists.")
                raise HTTPException(status_code=400, detail=str(e))
            


# ... existing imports ...

@router.post("/logout")
async def logout_player(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # FORCE END ALL ACTIVE GAME SESSIONS
            await cur.execute(
                """
                UPDATE GameSession 
                SET ended_at = NOW() 
                WHERE player_id = %s AND ended_at IS NULL
                """,
                (player_id,)
            )
            await conn.commit()
            
    return {"status": "success", "message": "Logged out and sessions closed"}


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Decodes the JWT token.
    Returns the payload (e.g., {'sub': 'user@email.com', 'role': 'PLAYER'})
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # SECRET_KEY and ALGORITHM should match what you used to create the token
        # If they are defined earlier in this file, use them directly.
        # Otherwise, ensure you import them or define them here.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
        return payload  # We return the whole dict so we can check roles later
    except JWTError:
        raise credentials_exception
   