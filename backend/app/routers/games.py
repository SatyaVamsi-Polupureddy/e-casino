from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db_connection
from app.core.dependencies import verify_tenant_is_approved, require_player
from app.schemas.game_schema import GameCreateRequest, GameResponse

router = APIRouter(prefix="/games", tags=["Game Management"])

# --- TENANT ADMIN: Add New Game ---
@router.post("/create", response_model=GameResponse)
async def create_game(
    game_data: GameCreateRequest, 
    admin: dict = Depends(verify_tenant_is_approved)
):
    admin_id = admin["user_id"]
    
    # Simple Validation to ensure name matches logic
    valid_types = ["SLOT", "DICE", "WHEEL", "COIN", "HIGHLOW"]
    if not any(t in game_data.game_name.upper() for t in valid_types):
         raise HTTPException(status_code=400, detail=f"Game name must contain one of: {valid_types}")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # Get Tenant ID
            await cur.execute("SELECT tenant_id FROM TenantUser WHERE tenant_user_id = %s", (admin_id,))
            tenant_id = (await cur.fetchone())['tenant_id']

            try:
                await cur.execute(
                    """
                    INSERT INTO Game 
                    (tenant_id, game_name, min_bet, max_bet, payout_multiplier, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, 'ACTIVE', NOW())
                    RETURNING game_id;
                    """,
                    (tenant_id, game_data.game_name, game_data.min_bet, game_data.max_bet, game_data.payout_multiplier)
                )
                new_game = await cur.fetchone()
                await conn.commit()
                
                return {
                    "game_id": str(new_game['game_id']),
                    "game_name": game_data.game_name,
                    "min_bet": game_data.min_bet,
                    "max_bet": game_data.max_bet,
                    "status": "ACTIVE"
                }
            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=400, detail=str(e))

# --- PLAYER: List Available Games ---

# In backend/app/routers/player.py

@router.get("/list", response_model=list[GameResponse])
async def list_games(user: dict = Depends(require_player)):
    player_id = user["user_id"]
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Find Player's Tenant
            await cur.execute("SELECT tenant_id FROM Wallet WHERE player_id = %s LIMIT 1", (player_id,))
            wallet_row = await cur.fetchone()
            
            if not wallet_row: return []
                
            tenant_id = wallet_row['tenant_id']
            
            # 2. List Games (STRICT FILTER)
            await cur.execute(
                """
                SELECT 
                    tg.tenant_game_id as game_id,
                    COALESCE(tg.custom_name, pg.title) as game_name,
                    pg.game_type,
                    pg.default_thumbnail_url as thumbnail_url,
                    pg.provider,
                    tg.min_bet, 
                    tg.max_bet, 
                    tg.is_active as status 
                FROM TenantGame tg
                JOIN PlatformGame pg ON tg.platform_game_id = pg.platform_game_id
                WHERE tg.tenant_id = %s 
                  AND tg.is_active = TRUE    -- 1. Tenant Enabled it
                  AND pg.is_active = TRUE    -- 2. Super Admin Enabled it (CRITICAL)
                """,
                (tenant_id,)
            )
            return await cur.fetchall()