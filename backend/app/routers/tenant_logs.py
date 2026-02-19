from fastapi import APIRouter, Depends
from app.core.dependencies import require_tenant_admin
import os

router = APIRouter(prefix="/tenant/logs", tags=["Audit Logs"])

LOG_FILE = "logs/tenant_audit.log"

@router.get("/")
async def get_audit_logs(admin: dict = Depends(require_tenant_admin)):
    tenant_id = str(admin['tenant_id'])
    logs = []

    if not os.path.exists(LOG_FILE):
        return []

    # Read file in reverse (newest first)
    try:
        with open(LOG_FILE, "r") as f:
            lines = f.readlines()
            
        for line in reversed(lines):
            try:
                # Parse format: TIMESTAMP | TENANT_ID | EMAIL | ACTION | DETAILS
                parts = line.strip().split(" | ")
                if len(parts) < 5:
                    continue

                timestamp, log_tenant_id, email, action, details = parts[0], parts[1], parts[2], parts[3], parts[4]

                # SECURITY CHECK: Only show logs for THIS tenant
                if log_tenant_id == tenant_id:
                    logs.append({
                        "timestamp": timestamp,
                        "staff_email": email,
                        "action": action,
                        "details": details
                    })
                
                # Limit to last 100 logs to prevent payload explosion
                if len(logs) >= 100:
                    break

            except Exception:
                continue # Skip malformed lines

    except Exception as e:
        print(f"Error reading logs: {e}")
        return []

    return logs