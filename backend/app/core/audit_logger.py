import logging
import os
from logging.handlers import RotatingFileHandler

# Ensure logs directory exists
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "tenant_audit.log")

# Configure the specialized Audit Logger
audit_logger = logging.getLogger("tenant_audit")
audit_logger.setLevel(logging.INFO)

# Format: TIMESTAMP | TENANT_ID | USER_EMAIL | ACTION | DETAILS
formatter = logging.Formatter('%(asctime)s | %(message)s')

# Rotate logs: Max 5MB per file, keep last 3 backup files
handler = RotatingFileHandler(LOG_FILE, maxBytes=5*1024*1024, backupCount=3)
handler.setFormatter(formatter)
audit_logger.addHandler(handler)

def log_activity(tenant_id: str, user_email: str, action: str, details: str):
    """
    Helper to write structured logs.
    Usage: log_activity(user['tenant_id'], user['email'], "UPDATE_PLAYER", "Banned player X")
    """
    # We use a separator '|' to make parsing easy later
    log_message = f"{tenant_id} | {user_email} | {action} | {details}"
    audit_logger.info(log_message)