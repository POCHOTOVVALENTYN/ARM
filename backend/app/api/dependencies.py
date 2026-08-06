from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    # TODO: Реалізувати реальну фабрику сесій
    yield None
