import asyncio
import csv
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, init_db
from app.models.models import RouteModel, StationModel, VehicleBlockModel, Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def main():
    print("Initializing Database...")
    await init_db()
    
    gtfs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../gtfs_static_data'))
    
    print("Parsing routes.txt...")
    routes = []
    with open(os.path.join(gtfs_dir, 'routes.txt'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            routes.append(RouteModel(
                id=row['route_id'],
                number=row.get('route_short_name', ''),
                name=row.get('route_long_name', ''),
                type=row.get('route_type', '3'),
                status='ACTIVE',
                color=row.get('route_color', '000000')
            ))
            
    print("Parsing stops.txt...")
    stations = []
    with open(os.path.join(gtfs_dir, 'stops.txt'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            stations.append(StationModel(
                id=row['stop_id'],
                name=row.get('stop_name', ''),
                type='STOP',
                status='ACTIVE',
                lat=float(row['stop_lat']) if row.get('stop_lat') else 0.0,
                lon=float(row['stop_lon']) if row.get('stop_lon') else 0.0
            ))
            
    print("Parsing stop_times.txt...")
    # Group stop_times by trip_id
    trip_stops = {}
    with open(os.path.join(gtfs_dir, 'stop_times.txt'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            t_id = row['trip_id']
            if t_id not in trip_stops:
                trip_stops[t_id] = []
            
            # Convert HH:MM:SS to seconds for simplicity, GTFS can have times like 25:00:00
            # Some GTFS times might omit leading zeros, so we safely split
            time_parts = row['arrival_time'].strip().split(':')
            if len(time_parts) == 3:
                seconds = int(time_parts[0]) * 3600 + int(time_parts[1]) * 60 + int(time_parts[2])
            else:
                seconds = 0
                
            trip_stops[t_id].append({
                "node_id": row['stop_id'],
                "arrival_time": seconds,
                "departure_time": seconds,
                "sequence": int(row['stop_sequence'])
            })
            
    for t_id in trip_stops:
        trip_stops[t_id].sort(key=lambda x: x['sequence'])
        
    print("Parsing trips.txt and creating blocks...")
    blocks = []
    with open(os.path.join(gtfs_dir, 'trips.txt'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            t_id = row['trip_id']
            stops = trip_stops.get(t_id, [])
            if not stops:
                continue
                
            start_time = stops[0]['arrival_time']
            end_time = stops[-1]['arrival_time']
            
            blocks.append(VehicleBlockModel(
                id=t_id,
                route_id=row['route_id'],
                vehicle_id=f"veh_{t_id}",
                status='SCHEDULED',
                start_time=start_time,
                end_time=end_time,
                is_completed=False,
                trips=[{
                    "trip_id": t_id,
                    "direction_id": row.get('direction_id', '0'),
                    "nodes": stops
                }]
            ))
            
    print(f"Loaded {len(routes)} routes, {len(stations)} stations, {len(blocks)} blocks.")
    
    async with AsyncSession(engine) as session:
        print("Clearing tables...")
        await session.execute(text("DELETE FROM routes"))
        await session.execute(text("DELETE FROM stations"))
        await session.execute(text("DELETE FROM vehicle_blocks"))
        await session.execute(text("DELETE FROM driver_duties"))
        await session.commit()
        
        print("Inserting routes...")
        session.add_all(routes)
        print("Inserting stations...")
        session.add_all(stations)
        
        # Batch insert blocks due to large size
        print("Inserting blocks in batches...")
        batch_size = 1000
        for i in range(0, len(blocks), batch_size):
            session.add_all(blocks[i:i+batch_size])
            await session.commit()
            
        print("Successfully migrated GTFS static data to PostgreSQL.")

if __name__ == "__main__":
    asyncio.run(main())
