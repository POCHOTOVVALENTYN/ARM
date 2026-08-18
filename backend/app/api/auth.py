from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.dependencies import get_db, get_current_dispatcher, get_current_active_superuser
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import Dispatcher
from app.schemas.auth import Token, DispatcherResponse, DispatcherCreate

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Авторизація диспетчера/адміністратора та видача JWT токена."""
    # 1. Знайти користувача за username
    query = select(Dispatcher).where(Dispatcher.username == form_data.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    # 2. Перевірити пароль
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невірний логін або пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Акаунт деактивовано"
        )

    # 3. Видати токен
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=DispatcherResponse)
async def read_current_user(
    current_user: Dispatcher = Depends(get_current_dispatcher)
):
    """Повертає профіль поточного авторизованого диспетчера."""
    return current_user

@router.post("/register", response_model=DispatcherResponse, status_code=status.HTTP_201_CREATED)
async def register_dispatcher(
    user_in: DispatcherCreate,
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser) # Закрито: Тільки для Superuser!
):
    """Реєстрація нового диспетчера (Доступно виключно Адміністратору підприємства)."""
    # Перевірка унікальності username
    query = select(Dispatcher).where(Dispatcher.username == user_in.username)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Користувач із таким логіном вже існує"
        )
    
    new_dispatcher = Dispatcher(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "DISPATCHER",
        is_active=True,
        is_superuser=user_in.is_superuser
    )
    db.add(new_dispatcher)
    await db.commit()
    await db.refresh(new_dispatcher)
    return new_dispatcher

@router.get("/users", response_model=List[DispatcherResponse])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    """Список усіх користувачів системи (Тільки для Адміністратора)."""
    result = await db.execute(select(Dispatcher).order_by(Dispatcher.id.asc()))
    return result.scalars().all()
