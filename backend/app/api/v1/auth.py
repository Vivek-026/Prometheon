from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserLogin, UserOut, UserStatusUpdate, TokenResponse, RefreshResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """Email + password login. Returns JWT access token, sets refresh token as httpOnly cookie."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/api/v1/auth",
    )

    return TokenResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Refresh access token using the httpOnly refresh cookie."""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    access_token = create_access_token(user.id, user.role.value)

    # Rotate refresh token
    new_refresh = create_refresh_token(user.id)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/api/v1/auth",
    )

    return RefreshResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserOut.model_validate(current_user)


@router.patch("/me/status", response_model=UserOut)
async def update_status(
    body: UserStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's online/custom status."""
    if body.status is not None:
        current_user.status = body.status
    if body.custom_status is not None:
        current_user.custom_status = body.custom_status

    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)

    return UserOut.model_validate(current_user)
