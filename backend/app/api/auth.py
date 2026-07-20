from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.crud.crud_user import crud_user
from app.schemas.user import (
    Token,
    UserCreate,
    UserResponse,
    ForgotPasswordRequest,
    UserLogin
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate
) -> Any:
    """
    Create a new user account.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = await crud_user.create(db, obj_in=user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get access token. Handles both OAuth2 standard form data (for docs UI)
    and JSON content (for frontend).
    """
    email = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("username") or body.get("email")
            password = body.get("password")
        except Exception:
            pass
    
    # Fallback to form data
    if not email or not password:
        try:
            form = await request.form()
            email = form.get("username")
            password = form.get("password")
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request format. Must provide email/username and password."
        )

    user = await crud_user.authenticate(db, email=email, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user profile.
    """
    return current_user


@router.post("/forgot-password")
async def forgot_password(
    *,
    db: AsyncSession = Depends(get_db),
    payload: ForgotPasswordRequest
) -> Any:
    """
    Trigger password recovery.
    """
    user = await crud_user.get_by_email(db, email=payload.email)
    if user:
        # Mock sending reset password link (e.g. printing to stdout/logs)
        print(f"[MAIL MOCK] Reset password link requested for: {user.email}")
        
    return {"message": "Password reset email sent if the account exists."}
