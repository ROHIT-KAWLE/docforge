from fastapi import APIRouter, HTTPException, Depends, Request, status
from ..models.schemas import UnlockRequest, AuthResponse, AuthStatus, SetupPasswordRequest
from ..security.auth import (
    is_setup_required, set_password, verify_password, get_auth_data,
    create_session, check_rate_limit, record_failed_attempt, require_auth, verify_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.get("/status", response_model=AuthStatus)
def auth_status(request: Request):
    setup_req = is_setup_required()
    auth_header = request.headers.get("Authorization")
    token_param = request.query_params.get("token")
    cookie_token = request.cookies.get("docforge_token")
    
    resolved_token = None
    if auth_header:
        scheme, _, token = auth_header.partition(" ")
        if scheme.lower() == "bearer" and token:
            resolved_token = token.strip()
    if not resolved_token and token_param:
        resolved_token = token_param.strip()
    if not resolved_token and cookie_token:
        resolved_token = cookie_token.strip()

    is_auth = False
    if resolved_token:
        is_auth = verify_token(resolved_token)
    return AuthStatus(is_authenticated=is_auth, setup_required=setup_req)

@router.post("/setup")
def setup_initial_password(req: SetupPasswordRequest):
    if not is_setup_required():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password already configured. Use change password instead."
        )
    try:
        set_password(req.password)
        token, duration = create_session(remember=True)
        return {
            "success": True,
            "message": "Password configured successfully.",
            "token": token,
            "expires_in": duration
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/unlock", response_model=AuthResponse)
def unlock_app(req: UnlockRequest, request: Request):
    if is_setup_required():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setup required. Please configure initial password."
        )
    
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    auth_data = get_auth_data()
    stored_hash = auth_data["password_hash"]
    salt = auth_data["salt"]

    if not verify_password(req.password, stored_hash, salt):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password."
        )

    token, duration = create_session(remember=req.remember)
    return AuthResponse(
        token=token,
        message="Unlocked successfully.",
        expires_in=duration
    )

@router.post("/change-password", dependencies=[Depends(require_auth)])
def change_password(data: dict):
    old_pw = data.get("current_password")
    new_pw = data.get("new_password")
    if not old_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Current and new password required.")
    
    auth_data = get_auth_data()
    if not verify_password(old_pw, auth_data["password_hash"], auth_data["salt"]):
        raise HTTPException(status_code=400, detail="Current password incorrect.")
    
    try:
        set_password(new_pw)
        return {"success": True, "message": "Password changed successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
