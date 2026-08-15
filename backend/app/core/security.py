from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
import bcrypt
from sqlalchemy import select
from app.core.config import settings
from app.core.database import async_session_maker
from app.models.models import Dispatcher

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Перевіряє, чи збігається введений пароль із хешем у БД."""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Генерує bcrypt хеш для збереження в БД."""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Створює JWT токен доступу для диспетчера."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 'sub' (subject) - стандартне поле JWT, куди записуємо ID користувача
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def verify_ws_token(token: str) -> Optional[Dispatcher]:
    """Перевіряє JWT токен для WebSocket підключень диспетчерів."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        async with async_session_maker() as db:
            result = await db.execute(select(Dispatcher).where(Dispatcher.id == int(user_id)))
            user = result.scalar_one_or_none()
            if user and user.is_active:
                return user
    except Exception as e:
        print(f"WS token verification error: {e}")
        return None
    return None
