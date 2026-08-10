import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.database import engine, Base
from app.models.models import *

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        print("Dropped and recreated all tables.")

if __name__ == "__main__":
    asyncio.run(main())
