import asyncio
import logging
from sqlalchemy import select
import app.core.database as db_module
from app.core.security import get_password_hash, verify_password
from app.models.models import Dispatcher

logger = logging.getLogger("app.init_admin")

async def seed_initial_admin():
    """
    Гарантує створення або актуалізацію облікових записів:
    - 'admin' (пароль: 'admin123' або 'admin') - SUPERUSER
    - 'dispatcher' (пароль: 'dispatcher123') - CENTRAL_DISPATCHER
    - 'planner' (пароль: 'planner123') - PLANNER
    Працює як для PostgreSQL, так і для SQLite.
    """
    users_to_seed = [
        {
            "username": "admin",
            "password": "admin123",
            "full_name": "Головний Адміністратор & Диспетчер ОМЕТ",
            "role": "SUPERUSER",
            "is_superuser": True
        },
        {
            "username": "dispatcher",
            "password": "dispatcher123",
            "full_name": "Черговий Диспетчер Лінії ОМЕТ",
            "role": "CENTRAL_DISPATCHER",
            "is_superuser": False
        },
        {
            "username": "planner",
            "password": "planner123",
            "full_name": "Інженер-Плановик Служби Руху",
            "role": "PLANNER",
            "is_superuser": False
        }
    ]

    async with db_module.AsyncSessionLocal() as session:
        try:
            for u in users_to_seed:
                query = select(Dispatcher).where(Dispatcher.username == u["username"])
                result = await session.execute(query)
                user = result.scalar_one_or_none()
                
                if not user:
                    user = Dispatcher(
                        username=u["username"],
                        hashed_password=get_password_hash(u["password"]),
                        full_name=u["full_name"],
                        role=u["role"],
                        is_active=True,
                        is_superuser=u["is_superuser"]
                    )
                    session.add(user)
                    print(f"✅ Користувача '{u['username']}' (пароль: '{u['password']}') успішно створено.")
                else:
                    user.hashed_password = get_password_hash(u["password"])
                    user.is_active = True
                    user.is_superuser = u["is_superuser"]
                    user.role = u["role"]
                    user.full_name = u["full_name"]
            
            await session.commit()
            print("✅ Стандартні акаунти КП ОМЕТ синхронізовано.")
        except Exception as e:
            print(f"⚠️ Помилка при ініціалізації користувачів: {e}")

if __name__ == "__main__":
    async def main():
        await db_module.init_db()
        await seed_initial_admin()
    asyncio.run(main())
