import asyncio
import logging
from sqlalchemy import select
import app.core.database as db_module
from app.core.security import get_password_hash, verify_password
from app.models.models import Dispatcher

logger = logging.getLogger("app.init_admin")

async def seed_initial_admin():
    """
    Гарантує створення або актуалізацію облікового запису 'admin' з паролем 'admin123'.
    Працює як для PostgreSQL, так і для SQLite.
    """
    async with db_module.AsyncSessionLocal() as session:
        try:
            query = select(Dispatcher).where(Dispatcher.username == "admin")
            result = await session.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                admin_user = Dispatcher(
                    username="admin",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Головний Диспетчер ОМЕТ",
                    role="SUPERUSER",
                    is_active=True,
                    is_superuser=True
                )
                session.add(admin_user)
                await session.commit()
                print("✅ Початкового адміністратора 'admin' (пароль: 'admin123') успішно створено.")
            else:
                admin_user.hashed_password = get_password_hash("admin123")
                admin_user.is_active = True
                admin_user.is_superuser = True
                admin_user.role = "SUPERUSER"
                await session.commit()
                print("✅ Пароль адміністратора 'admin' актуалізовано до 'admin123'.")
        except Exception as e:
            print(f"⚠️ Помилка при ініціалізації адміна: {e}")

if __name__ == "__main__":
    async def main():
        await db_module.init_db()
        await seed_initial_admin()
    asyncio.run(main())
