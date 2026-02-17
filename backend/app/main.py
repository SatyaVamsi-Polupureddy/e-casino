from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import pool
from app.routers import auth, admin, players, tenant_admin, kyc,  wallet, staff,game_engine, bonus, tenant_stats


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Raw SQL Backend for Casino Platform"
)

origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Database (Open on start, close on stop)
@app.on_event("startup")
async def startup_db():
    await pool.open()
    print("New  Database Connection Pool Opened")

@app.on_event("shutdown")
async def shutdown_db():
    await pool.close()
    print("Database Connection Pool Closed")

app.include_router(auth.router)
app.include_router(tenant_admin.router)
app.include_router(tenant_stats.router)
app.include_router(kyc.router)

# app.include_router(jackpot.router)
app.include_router(wallet.router)
app.include_router(staff.router)

app.include_router(game_engine.router)
app.include_router(players.router)
app.include_router(admin.router, prefix="/admin", tags=["Super Admin"])
app.include_router(bonus.router)
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Grand Casino API",
        "docs_url": "/docs",
        "health": "OK"
    }