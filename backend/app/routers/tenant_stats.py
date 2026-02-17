from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_db_connection
from app.core.dependencies import require_tenant_admin
from typing import Optional

router = APIRouter(prefix="/tenant/stats", tags=["Tenant Analytics"])

@router.get("/summary")
async def get_stats_summary(admin: dict = Depends(require_tenant_admin)):
    tenant_id = admin['tenant_id']
    
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            # 1. Total Players
            await cur.execute("SELECT COUNT(*) as total FROM player WHERE tenant_id = %s", (tenant_id,))
            total_players = (await cur.fetchone())['total']
            await cur.execute("""
                SELECT COUNT(DISTINCT player_id) as total FROM gamesession 
                WHERE started_at >= CURRENT_DATE 
                AND player_id IN (SELECT player_id FROM player WHERE tenant_id = %s)
            """, (tenant_id,))
            active_today = (await cur.fetchone())['total']

          
            await cur.execute("""
                SELECT 
                    COALESCE(SUM(b.bet_amount), 0) - COALESCE(SUM(bo.payout_amount), 0) as ggr
                FROM bet b
                LEFT JOIN betoutcome bo ON b.bet_id = bo.bet_id
                WHERE b.tenant_id = %s AND b.created_at >= CURRENT_DATE
            """, (tenant_id,))
            ggr_today = (await cur.fetchone())['ggr']

    return {
        "total_players": total_players,
        "active_today": active_today,
        "inactive_today": max(0, total_players - active_today),
        "ggr_today": float(ggr_today)
    }

@router.get("/players")
async def get_player_stats(
    filter_type: str = Query(..., description="HIGH_ROLLERS, ACTIVE, BIG_WINNERS, TOP_LOSERS, CHURN_RISK"),
    threshold: float = Query(100.0, description="Bet amount threshold"),
    month: Optional[str] = Query(None, description="Filter by Month (YYYY-MM)"),
    admin: dict = Depends(require_tenant_admin)
):
    tenant_id = admin['tenant_id']
    
    date_filter_bet = "AND TO_CHAR(b.created_at, 'YYYY-MM') = %s" if month else "AND b.created_at >= CURRENT_DATE"
    date_filter_session = "AND TO_CHAR(gs.started_at, 'YYYY-MM') = %s" if month else "AND gs.started_at >= CURRENT_DATE"
    
    query = ""
    params = []

    if filter_type == "HIGH_ROLLERS":
        query = f"""
            SELECT DISTINCT p.player_id, p.username, p.email, MAX(b.bet_amount) as max_val, MAX(b.created_at) as last_active
            FROM player p
            JOIN bet b ON p.player_id = b.player_id
            WHERE p.tenant_id = %s AND b.bet_amount >= %s {date_filter_bet.replace('%s', '%s' if month else '')}
            GROUP BY p.player_id
            ORDER BY max_val DESC
        """

        params = [tenant_id, threshold]
        if month: params.append(month)

    elif filter_type in ["ACTIVE", "ACTIVE_TODAY"]:
        
        sub_clause = date_filter_session.replace('%s', '%s' if month else '')
        main_clause = date_filter_session.replace('%s', '%s' if month else '')

        query = f"""
            SELECT DISTINCT p.player_id, p.username, p.email, 
                   (SELECT COUNT(*) FROM gamesession gs WHERE gs.player_id = p.player_id {sub_clause}) as max_val,
                   NOW() as last_active
            FROM player p
            JOIN gamesession gs ON p.player_id = gs.player_id
            WHERE p.tenant_id = %s {main_clause}
        """
        
        
        params = []
        if month: params.append(month)  
        params.append(tenant_id)       
        if month: params.append(month) 


    elif filter_type == "BIG_WINNERS":
        winner_clause = f"AND TO_CHAR(b.created_at, 'YYYY-MM') = %s" if month else ""
        
        query = f"""
            SELECT p.player_id, p.username, p.email, 
                   (SUM(bo.payout_amount) - SUM(b.bet_amount)) as max_val,
                   MAX(b.created_at) as last_active
            FROM player p
            JOIN bet b ON p.player_id = b.player_id
            JOIN betoutcome bo ON b.bet_id = bo.bet_id
            WHERE p.tenant_id = %s {winner_clause.replace('%s', '%s' if month else '')}
            GROUP BY p.player_id
            HAVING (SUM(bo.payout_amount) - SUM(b.bet_amount)) > 0
            ORDER BY max_val DESC
        """
        params = [tenant_id]
        if month: params.append(month)

    elif filter_type == "TOP_LOSERS":
        loser_clause = f"AND TO_CHAR(b.created_at, 'YYYY-MM') = %s" if month else ""
        
        query = f"""
            SELECT p.player_id, p.username, p.email, 
                   (SUM(b.bet_amount) - SUM(bo.payout_amount)) as max_val,
                   MAX(b.created_at) as last_active
            FROM player p
            JOIN bet b ON p.player_id = b.player_id
            JOIN betoutcome bo ON b.bet_id = bo.bet_id
            WHERE p.tenant_id = %s {loser_clause.replace('%s', '%s' if month else '')}
            GROUP BY p.player_id
            HAVING (SUM(b.bet_amount) - SUM(bo.payout_amount)) > 0
            ORDER BY max_val DESC
        """
        params = [tenant_id]
        if month: params.append(month)

    elif filter_type == "CHURN_RISK":
        query = """
            SELECT p.player_id, p.username, p.email, 
                   EXTRACT(DAY FROM (NOW() - MAX(gs.started_at))) as max_val,
                   MAX(gs.started_at) as last_active
            FROM player p
            LEFT JOIN gamesession gs ON p.player_id = gs.player_id
            WHERE p.tenant_id = %s
            GROUP BY p.player_id
            HAVING MAX(gs.started_at) < NOW() - INTERVAL '30 DAYS' OR MAX(gs.started_at) IS NULL
        """
        params = [tenant_id]
    
    else:
        raise HTTPException(400, "Invalid filter type")

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, tuple(params))
            rows = await cur.fetchall()
            
    return [dict(row) for row in rows]