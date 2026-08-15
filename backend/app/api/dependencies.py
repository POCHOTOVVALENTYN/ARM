from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import AsyncGenerator
import jwt

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.models import Dispatcher

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_dispatcher(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Dispatcher:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недійсні облікові дані або термін дії токена закінчився",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (jwt.PyJWTError, Exception):
        raise credentials_exception

    query = select(Dispatcher).where(Dispatcher.id == int(user_id))
    result = await db.execute(query)
    dispatcher = result.scalar_one_or_none()
    
    if dispatcher is None or not dispatcher.is_active:
        raise credentials_exception
        
    return dispatcher

async def get_current_active_superuser(
    current_dispatcher: Dispatcher = Depends(get_current_dispatcher),
) -> Dispatcher:
    if not current_dispatcher.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостатньо прав доступу"
        )
    return current_dispatcher
