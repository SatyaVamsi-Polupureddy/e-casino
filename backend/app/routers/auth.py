from fastapi import APIRouter, HTTPException, status, Depends
from app.core.database import get_db_connection
from app.core.security import verify_password, create_access_token, hash_password
from app.schemas.auth_schema import LoginRequest, Token, SignupRequest
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from app.core.dependencies import require_player 
import random
import string
import requests 

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "164a4fd15693caa042f0b4a5dbb7a6f4021a8b8e897f7cbfac4e242dfeff0f9b")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID")
EMAILJS_TEMPLATE_ID_RESET = os.getenv("EMAILJS_TEMPLATE_ID_RESET")
EMAILJS_USER_ID = os.getenv("EMAILJS_USER_ID")
EMAILJS_PRIVATE_KEY = os.getenv("EMAILJS_PRIVATE_KEY") 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

 
router = APIRouter(prefix="/auth", tags=["Authentication"])

# login
@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest):
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            user = None
            role = credentials.login_type.upper() 
            user_id = None
            user_status = "ACTIVE"
            found_hash = None
            
            if role == "SUPER_ADMIN":
                await cur.execute(
                    "SELECT platform_user_id, password_hash, status FROM PlatformUser WHERE email = %s", 
                    (credentials.email,)
                )
                user = await cur.fetchone()
                if user:
                    user_id = user['platform_user_id']
                    found_hash = user['password_hash']
                    user_status = user['status']

            elif role in ["TENANT_ADMIN", "TENANT_STAFF"]:
                query = """
                    SELECT tu.tenant_user_id, tu.password_hash, r.role_name, tu.status 
                    FROM TenantUser tu
                    JOIN Role r ON tu.role_id = r.role_id
                    WHERE tu.email = %s
                """
                params = [credentials.email]
                
            
                await cur.execute(query, tuple(params))
                user = await cur.fetchone()
                
                if user:
                    role = user['role_name'] 
                    user_id = user['tenant_user_id']
                    found_hash = user['password_hash']
                    user_status = user['status']

            elif role == "PLAYER":
                query = "SELECT player_id, password_hash, status FROM Player WHERE email = %s"
                params = [credentials.email]
                if credentials.tenant_id:
                    query += " AND tenant_id = %s"
                    params.append(credentials.tenant_id)
                await cur.execute(query, tuple(params))
                user = await cur.fetchone()
                if user:
                    user_id = user['player_id']
                    found_hash = user['password_hash']
                    user_status = user['status']

            if not user:
                raise HTTPException(status_code=404, detail="Invalid Credentials")

            if not verify_password(credentials.password, found_hash):
                raise HTTPException(status_code=401, detail="Incorrect password")

           
            allowed_statuses = ['ACTIVE', 'PENDING', 'PENDING_KYC']
            if user_status not in allowed_statuses:
                 raise HTTPException(status_code=403, detail=f"Account is {user_status}. Please contact support.")

            # Success
            access_token = create_access_token(subject=str(user_id), role=role)    
            return {
                "access_token": access_token, 
                "token_type": "bearer", 
                "role": role,
                "status": user_status 
            }

@router.post("/register/super-admin")
async def create_super_admin(data: SignupRequest):
    """Temporary route to create your first Super Admin"""
    hashed = hash_password(data.password)
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(
                    """
                    INSERT INTO PlatformUser (email, password_hash, role_id, status)
                    VALUES (%s, %s, 1, 'ACTIVE')
                    RETURNING platform_user_id
                    """,
                    (data.email, hashed)
                )
                await conn.commit()
                return {"status": "Super Admin Created"}
            except Exception as e:
                if "23505" in str(e) or "unique constraint" in str(e).lower():
                    raise HTTPException(status_code=400, detail="Account already exists.")
                raise HTTPException(status_code=400, detail=str(e))
            
@router.post("/logout")
async def logout_player(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
        return payload 
    except JWTError:
        raise credentials_exception
    


def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    return ''.join(random.choice(chars) for i in range(length))

def send_emailjs_backend(to_email, temp_pass):
    url = "https://api.emailjs.com/api/v1.0/email/send"
    payload = {
        "service_id": EMAILJS_SERVICE_ID,
        "template_id": EMAILJS_TEMPLATE_ID_RESET,
        "user_id": EMAILJS_USER_ID,        #  Public Key
        "accessToken": EMAILJS_PRIVATE_KEY, # Private Key
        "template_params": {
            "to_email": to_email,
            "temp_password": temp_pass
        }
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code != 200:
            print(f" EmailJS Failed! Status: {response.status_code}")
            print(f" Error Message: {response.text}")
        else:
            print(f"Email sent successfully to {to_email}")
            
    except Exception as e:
        print(f"Network/Code Error: {e}")

@router.post("/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email")
    if not email: raise HTTPException(400, "Email required")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Check Player Table
            await cur.execute("SELECT player_id FROM Player WHERE email = %s", (email,))
            player = await cur.fetchone()
            
            # 2. Check Tenant User Table (if not player)
            tenant_user = None
            if not player:
                await cur.execute("SELECT tenant_user_id FROM TenantUser WHERE email = %s", (email,))
                tenant_user = await cur.fetchone()

            if not player and not tenant_user:
                return {"message": "If email exists, password sent."}

            # 3. Generate & Hash
            temp_pass = generate_temp_password()
            hashed_pass = hash_password(temp_pass)

            # 4. Update DB
            if player:
                await cur.execute("UPDATE Player SET password_hash = %s WHERE email = %s", (hashed_pass, email))
            elif tenant_user:
                await cur.execute("UPDATE TenantUser SET password_hash = %s WHERE email = %s", (hashed_pass, email))
            
            await conn.commit()

            # 5. Send Email
            send_emailjs_backend(email, temp_pass)

            return {"message": "Temporary password sent to email."}
   