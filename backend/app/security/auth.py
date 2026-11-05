import os
import json
import time
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Dict
from fastapi import Header, Query, Cookie, HTTPException, status

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "storage"))
AUTH_FILE = os.path.join(STORAGE_DIR, ".docforge_auth.json")
SESSIONS_FILE = os.path.join(STORAGE_DIR, ".docforge_sessions.json")

# In-memory session cache backed by disk persistence
ACTIVE_SESSIONS: Dict[str, Dict[str, float]] = {}

def load_sessions() -> Dict[str, Dict[str, float]]:
    global ACTIVE_SESSIONS
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                ACTIVE_SESSIONS = json.load(f)
        except Exception:
            pass
    return ACTIVE_SESSIONS

def save_sessions():
    os.makedirs(STORAGE_DIR, exist_ok=True)
    try:
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(ACTIVE_SESSIONS, f, indent=2)
    except Exception:
        pass

# Load existing sessions upon module load
load_sessions()

# Rate limiting failed attempts: ip -> [timestamps]
FAILED_ATTEMPTS: Dict[str, list] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_PERIOD_SECONDS = 60

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    # PBKDF2 HMAC SHA-256 with 100,000 iterations
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return key.hex(), salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, stored_hash)

def get_auth_data() -> Optional[dict]:
    if os.path.exists(AUTH_FILE):
        try:
            with open(AUTH_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def save_auth_data(data: dict):
    os.makedirs(STORAGE_DIR, exist_ok=True)
    with open(AUTH_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def is_setup_required() -> bool:
    auth_data = get_auth_data()
    return auth_data is None or "password_hash" not in auth_data

def set_password(password: str):
    if len(password) < 4:
        raise ValueError("Password must be at least 4 characters.")
    h, salt = hash_password(password)
    save_auth_data({
        "password_hash": h,
        "salt": salt,
        "updated_at": datetime.utcnow().isoformat()
    })

def check_rate_limit(client_id: str):
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(client_id, [])
    recent = [t for t in attempts if now - t < LOCKOUT_PERIOD_SECONDS]
    FAILED_ATTEMPTS[client_id] = recent
    if len(recent) >= MAX_FAILED_ATTEMPTS:
        wait_time = int(LOCKOUT_PERIOD_SECONDS - (now - recent[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed unlock attempts. Please wait {wait_time} seconds before trying again."
        )

def record_failed_attempt(client_id: str):
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(client_id, [])
    attempts.append(now)
    FAILED_ATTEMPTS[client_id] = attempts

def create_session(remember: bool = False) -> tuple[str, int]:
    load_sessions()
    token = secrets.token_urlsafe(32)
    # Session duration: 24 hours normally, 30 days if remember
    duration = 30 * 86400 if remember else 86400
    now = time.time()
    ACTIVE_SESSIONS[token] = {
        "created_at": now,
        "expires_at": now + duration
    }
    save_sessions()
    return token, duration

def verify_token(token: str) -> bool:
    load_sessions()
    session = ACTIVE_SESSIONS.get(token)
    if not session:
        return False
    if time.time() > session["expires_at"]:
        ACTIVE_SESSIONS.pop(token, None)
        save_sessions()
        return False
    return True

async def require_auth(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    docforge_token: Optional[str] = Cookie(None)
):
    if is_setup_required():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password setup required."
        )

    # 1. Check Authorization: Bearer <token> header
    resolved_token = None
    if authorization:
        scheme, _, bearer_token = authorization.partition(" ")
        if scheme.lower() == "bearer" and bearer_token:
            resolved_token = bearer_token.strip()

    # 2. Check query parameter ?token=... (for <img> tags and downloads)
    if not resolved_token and token:
        resolved_token = token.strip()

    # 3. Check Cookie
    if not resolved_token and docforge_token:
        resolved_token = docforge_token.strip()

    if not resolved_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )

    if not verify_token(resolved_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token."
        )
    return True
