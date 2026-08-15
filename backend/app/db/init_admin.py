import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import Dispatcher

async def seed_initial_admin():
    async with AsyncSessionLocal() as session:
        try:
            query = select(Dispatcher).where(Dispatcher.username == "admin")
            result = await session.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                admin_user = Dispatcher(
                    username="admin",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Головний Диспетчер ОМЕТ",
                    is_active=True,
                    is_superuser=True
                )
                session.add(admin_user)
                await session.commit()
                print("✅ Початкового адміністратора 'admin' (пароль: 'admin123') успішно створено.")
            else:
                print("ℹ️ Адміністратор 'admin' вже існує в БД.")
        except Exception as e:
            print(f"⚠️ Помилка при ініціалізації адміна: {e}")

if __name__ == "__main__":
    asyncio.run(seed_initial_admin())
