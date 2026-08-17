import os
import csv
import json
import asyncio
from sqlalchemy import delete, insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker, init_db
from app.models.models import Route, Station, RouteShape, RouteStation

# Коди GTFS: 0 - Трамвай, 7 - Фунікулер, 11 / 800 - Тролейбус
ALLOWED_ROUTE_TYPES = ['0', '7', '11', '800']

possible_dirs = [
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "gtfs_static_data"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "gtfs_static_data"),
    "/app/gtfs_static_data",
    "gtfs_static_data"
]
GTFS_DIR = next((d for d in possible_dirs if os.path.exists(d)), possible_dirs[0])

def chunked(iterable, size=200):
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]

async def parse_gtfs():
    print(f"🚀 Початок інтеграції GTFS (Одеса - Електротранспорт)... Шлях: {GTFS_DIR}")
    
    await init_db()

    async with async_session_maker() as db:
        # 1. Очищення старих даних
        print("Очищення старих довідників...")
        await db.execute(delete(RouteStation))
        await db.execute(delete(RouteShape))
        await db.execute(delete(Route))
        await db.execute(delete(Station))
        await db.commit()

        # 2. Читання маршрутів (routes.txt)
        print("Парсинг маршрутів (routes.txt)...")
        valid_routes = {}
        routes_to_insert = []
        seen_route_ids = set()
        routes_path = os.path.join(GTFS_DIR, "routes.txt")
        if not os.path.exists(routes_path):
            print(f"❌ Помилка: Файл не знайдено: {routes_path}")
            return

        with open(routes_path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['route_type'] in ALLOWED_ROUTE_TYPES:
                    r_type = "TRAM" if row['route_type'] == '0' else "FUNICULAR" if row['route_type'] == '7' else "TROLLEYBUS"
                    short_name = row['route_short_name'].strip()
                    valid_routes[row['route_id']] = short_name
                    
                    if short_name not in seen_route_ids:
                        seen_route_ids.add(short_name)
                        routes_to_insert.append({
                            "id": short_name,
                            "number": short_name,
                            "name": row.get('route_long_name') or f"Маршрут №{short_name}",
                            "type": r_type,
                            "status": "ACTIVE"
                        })
        
        for batch in chunked(routes_to_insert, 100):
            await db.execute(insert(Route).values(batch))
        await db.commit()
        print(f"✅ Імпортовано {len(routes_to_insert)} унікальних маршрутів електротранспорту.")

        # 3. Читання зупинок (stops.txt)
        print("Парсинг зупинок (stops.txt)...")
        stops_to_insert = []
        seen_stop_ids = set()
        with open(os.path.join(GTFS_DIR, "stops.txt"), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stop_id = row['stop_id'].strip()
                if stop_id not in seen_stop_ids:
                    seen_stop_ids.add(stop_id)
                    lat = float(row['stop_lat'])
                    lng = float(row['stop_lon'])
                    stops_to_insert.append({
                        "id": stop_id,
                        "name": row['stop_name'],
                        "lat": lat,
                        "lon": lng,
                        "lng": lng,
                        "type": "STOP",
                        "status": "ACTIVE"
                    })
        for batch in chunked(stops_to_insert, 200):
            await db.execute(insert(Station).values(batch))
        await db.commit()
        print(f"✅ Імпортовано {len(stops_to_insert)} зупинок.")

        # 4. Прив'язка shapes та trips (trips.txt)
        print("Аналіз напрямків та рейсів (trips.txt)...")
        route_shape_map = {}
        reference_trips = {}

        with open(os.path.join(GTFS_DIR, "trips.txt"), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                route_id = row['route_id']
                if route_id in valid_routes:
                    short_name = valid_routes[route_id]
                    dir_id = int(row['direction_id']) if 'direction_id' in row and row['direction_id'] != '' else 0
                    
                    key = (short_name, dir_id)
                    if key not in route_shape_map and 'shape_id' in row and row['shape_id']:
                        route_shape_map[key] = row['shape_id']
                        reference_trips[key] = row['trip_id']

        # 5. Побудова геометрії (shapes.txt)
        print("Формування геометрії кривих (shapes.txt)...")
        shapes_data = {}
        with open(os.path.join(GTFS_DIR, "shapes.txt"), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                s_id = row['shape_id']
                if s_id not in shapes_data:
                    shapes_data[s_id] = []
                shapes_data[s_id].append({
                    "lat": float(row['shape_pt_lat']),
                    "lng": float(row['shape_pt_lon']),
                    "seq": int(row['shape_pt_sequence'])
                })

        shapes_to_insert = []
        for (route_num, dir_id), shape_id in route_shape_map.items():
            if shape_id in shapes_data:
                sorted_pts = sorted(shapes_data[shape_id], key=lambda x: x["seq"])
                geom = [{"lat": p["lat"], "lng": p["lng"]} for p in sorted_pts]
                
                shapes_to_insert.append({
                    "route_id": route_num,
                    "direction_id": dir_id,
                    "geometry": geom
                })
        
        for batch in chunked(shapes_to_insert, 50):
            await db.execute(insert(RouteShape).values(batch))
        await db.commit()
        print(f"✅ Збережено {len(shapes_to_insert)} ліній маршрутів на мапі.")

        # 6. Послідовність зупинок (stop_times.txt)
        print("Формування послідовності зупинок на маршрутах...")
        ref_trip_ids = set(reference_trips.values())
        trip_to_route_dir = {v: k for k, v in reference_trips.items()}
        
        route_stations_to_insert = []
        seen_station_keys = set()
        
        with open(os.path.join(GTFS_DIR, "stop_times.txt"), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                t_id = row['trip_id']
                if t_id in ref_trip_ids:
                    route_num, dir_id = trip_to_route_dir[t_id]
                    seq = int(row['stop_sequence'])
                    stop_id = row['stop_id']
                    station_key = (route_num, dir_id, stop_id, seq)
                    if station_key not in seen_station_keys:
                        seen_station_keys.add(station_key)
                        route_stations_to_insert.append({
                            "route_id": route_num,
                            "direction_id": dir_id,
                            "stop_id": stop_id,
                            "stop_sequence": seq
                        })

        for batch in chunked(route_stations_to_insert, 200):
            await db.execute(insert(RouteStation).values(batch))
        await db.commit()
        print(f"✅ Зв'язано {len(route_stations_to_insert)} зупинок з напрямками.")

        print("🎉 Імпорт GTFS успішно завершено! Дані готові для генерації нарядів.")

if __name__ == "__main__":
    asyncio.run(parse_gtfs())
