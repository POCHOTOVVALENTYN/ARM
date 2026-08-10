import asyncio
import json
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, init_db
from app.models.models import RouteModel, VehicleBlockModel, DriverDutyModel, Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def main():
    print("Initializing Database...")
    await init_db()
    
    print("Reading GTFS Dump...")
    dump_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../gtfs_dump.json'))
    if not os.path.exists(dump_path):
        print(f"Error: gtfs_dump.json not found at {dump_path}")
        sys.exit(1)
        
    with open(dump_path, 'r') as f:
        data = json.load(f)
        
    routes = data.get('routes', [])
    blocks = data.get('vehicle_blocks', [])
    duties = data.get('driver_duties', [])
    
    print(f"Loaded {len(routes)} routes, {len(blocks)} blocks, {len(duties)} duties.")
    
    async with AsyncSession(engine) as session:
        # Clear existing data - using DELETE instead of TRUNCATE if tables are new
        await session.execute(text("DELETE FROM routes"))
        await session.execute(text("DELETE FROM vehicle_blocks"))
        await session.execute(text("DELETE FROM driver_duties"))
        await session.commit()
        
        # Insert Routes
        for r in routes:
            route = RouteModel(
                id=r.get('id'),
                number=r.get('number'),
                name=r.get('name'),
                type=r.get('type'),
                status=r.get('status'),
                primaryTerminalId=r.get('primaryTerminalId'),
                secondaryTerminalId=r.get('secondaryTerminalId'),
                lengthDir1Km=r.get('lengthDir1Km'),
                lengthDir2Km=r.get('lengthDir2Km'),
                stations=r.get('stations'),
                allStations=r.get('allStations'),
                segments=r.get('segments'),
                activeVehiclesCount=r.get('activeVehiclesCount'),
                description=r.get('description'),
            )
            session.add(route)
            
        # Insert Blocks
        for b in blocks:
            block = VehicleBlockModel(
                id=b.get('id'),
                route_id=b.get('route_id'),
                vehicle_id=b.get('vehicle_id'),
                status=b.get('status'),
                trips=b.get('trips'),
                start_time=b.get('start_time'),
                end_time=b.get('end_time'),
                is_completed=b.get('is_completed', False)
            )
            session.add(block)
            
        # Insert Duties
        for d in duties:
            duty = DriverDutyModel(
                id=d.get('id'),
                driver_id=d.get('driver_id'),
                block_id=d.get('block_id'),
                start_time=d.get('start_time'),
                end_time=d.get('end_time'),
                status=d.get('status'),
                breaks=d.get('breaks')
            )
            session.add(duty)
            
        await session.commit()
        print("Successfully migrated GTFS static data to PostgreSQL.")

if __name__ == "__main__":
    asyncio.run(main())
