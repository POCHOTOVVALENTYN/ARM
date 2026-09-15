import sqlite3
import json
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "omet.db")

def run_sync():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    print(f"📦 Підключено до БД: {DB_PATH}")

    # 1. Створення нових таблиць, якщо вони не існують
    c.execute("""
    CREATE TABLE IF NOT EXISTS stop_passing_routes (
        id VARCHAR PRIMARY KEY,
        stop_id VARCHAR NOT NULL,
        stop_name VARCHAR NOT NULL,
        transport_type VARCHAR NOT NULL,
        routes_list JSON NOT NULL,
        route_count INTEGER NOT NULL DEFAULT 1,
        is_shared BOOLEAN NOT NULL DEFAULT 0,
        is_dispatch_station BOOLEAN NOT NULL DEFAULT 0,
        break_capacity INTEGER NOT NULL DEFAULT 0,
        lat FLOAT,
        lng FLOAT,
        corridor_name VARCHAR
    );
    """)
    c.execute("CREATE INDEX IF NOT EXISTS ix_stop_passing_routes_stop_id ON stop_passing_routes (stop_id);")

    c.execute("""
    CREATE TABLE IF NOT EXISTS route_shared_corridors (
        id VARCHAR PRIMARY KEY,
        base_route_id VARCHAR NOT NULL,
        base_route_number VARCHAR NOT NULL,
        target_route_id VARCHAR NOT NULL,
        target_route_number VARCHAR NOT NULL,
        target_route_name VARCHAR,
        target_route_color VARCHAR DEFAULT '#3b82f6',
        transport_type VARCHAR NOT NULL,
        shared_stops_count INTEGER NOT NULL,
        start_stop VARCHAR NOT NULL,
        end_stop VARCHAR NOT NULL,
        shared_stops JSON NOT NULL,
        shared_stop_ids JSON NOT NULL,
        min_headway_min INTEGER NOT NULL DEFAULT 2,
        corridor_name VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    c.execute("CREATE INDEX IF NOT EXISTS ix_route_shared_corridors_base ON route_shared_corridors (base_route_id);")
    c.execute("CREATE INDEX IF NOT EXISTS ix_route_shared_corridors_target ON route_shared_corridors (target_route_id);")

    # Перевірка колонок у routes та stations
    c.execute("PRAGMA table_info(routes);")
    route_cols = [r["name"] for r in c.fetchall()]
    if "active_variant" not in route_cols:
        c.execute("ALTER TABLE routes ADD COLUMN active_variant VARCHAR DEFAULT 'OPERATIONAL_SHORT';")
    if "variant_notes" not in route_cols:
        c.execute("ALTER TABLE routes ADD COLUMN variant_notes VARCHAR;")

    c.execute("PRAGMA table_info(stations);")
    station_cols = [r["name"] for r in c.fetchall()]
    if "transport_type" not in station_cols:
        c.execute("ALTER TABLE stations ADD COLUMN transport_type VARCHAR DEFAULT 'MIXED';")

    conn.commit()

    # 2. Коригування зупинок трамвая № 27 (11-а ст. — Рибний порт)
    print("🚋 Оновлення траси Трамвая № 27 (11-а ст. — Рибний порт, 15 зупинок)...")
    
    ROUTE_27_STOPS_DIR0 = [
        ("708912", "11-а станція Люстдорфської дороги"),
        ("708914", "12-а станція Люстдорфської дороги"),
        ("708915", "13-а станція Люстдорфської дороги"),
        ("708916", "14-а станція Люстдорфської дороги"),
        ("708917", "15-а станція Люстдорфської дороги"),
        ("708918", "16-а станція Люстдорфської дороги"),
        ("708919", "вул. Костанді"),
        ("708920", "пров. Ліверпуський"),
        ("708922", "Дача Ковалевського"),
        ("708923", "Монастир"),
        ("708924", "Санаторій \"Люстдорф\""),
        ("708921", "селище Люстдорф"),
        ("708925", "вул. Зої Космодем'янської"),
        ("708926", "с-ще Бурлача Балка"),
        ("708927", "Рибний порт")
    ]

    # Переконуємось, що всі ці зупинки існують у таблиці stations
    for sid, sname in ROUTE_27_STOPS_DIR0:
        c.execute("SELECT id FROM stations WHERE id = ?", (sid,))
        if not c.fetchone():
            c.execute("""
                INSERT INTO stations (id, name, type, status, lat, lon, lng, is_dispatch_station, break_capacity, transport_type)
                VALUES (?, ?, 'STOP', 'ACTIVE', 46.36, 30.70, 30.70, ?, ?, 'TRAM')
            """, (sid, sname, 1 if "11-а" in sname or "Рибний" in sname else 0, 3 if "11-а" in sname else 0))

    # Очищуємо старі записи для route_id '27'
    c.execute("DELETE FROM route_stations WHERE route_id = '27'")

    # Додаємо Dir 0
    for idx, (sid, sname) in enumerate(ROUTE_27_STOPS_DIR0, 1):
        c.execute("INSERT INTO route_stations (route_id, direction_id, stop_id, stop_sequence) VALUES ('27', 0, ?, ?)", (sid, idx))

    # Додаємо Dir 1 (зворотний)
    for idx, (sid, sname) in enumerate(reversed(ROUTE_27_STOPS_DIR0), 1):
        c.execute("INSERT INTO route_stations (route_id, direction_id, stop_id, stop_sequence) VALUES ('27', 1, ?, ?)", (sid, idx))

    # Оновлюємо опис та параметри маршруту 27 в routes
    c.execute("""
        UPDATE routes
        SET name = '11-а ст. Люстдорфської дороги — Рибний порт',
            length_km = 14.7,
            lengthDir1Km = 7.4,
            lengthDir2Km = 7.3,
            round_trip_min = 56,
            t_dir0_min = 25,
            t_dir1_min = 25,
            layover_min = 6,
            default_speed_kmh = 16.0,
            active_variant = 'OPERATIONAL_SHORT',
            variant_notes = 'Скорочена оперативна схема (через дефіцит е/е): 11-а ст. — Рибний порт (15 зупинок)'
        WHERE id = '27'
    """)

    # 3. Виправлення перетину «Куликове поле» між Трамваями 17/18 та Тролейбусом 9
    # Трамваї 17 та 18 мають зупинятися на трамвайному кільці (798880), а не на тролейбусній станції (702501)
    c.execute("""
        UPDATE route_stations 
        SET stop_id = '798880' 
        WHERE route_id IN ('17', '18') AND stop_id = '702501'
    """)

    # Перевіримо, чи існує зупинка 798880 у stations
    c.execute("SELECT id FROM stations WHERE id = '798880'")
    if not c.fetchone():
        c.execute("""
            INSERT INTO stations (id, name, type, status, lat, lon, lng, is_dispatch_station, break_capacity, transport_type)
            VALUES ('798880', 'Куликове поле (трамвайне кільце)', 'HUB', 'ACTIVE', 46.466847, 30.745904, 30.745904, 1, 4, 'TRAM')
        """)

    conn.commit()

    # 4. Оновлення transport_type у таблиці stations на основі маршрутів, що через них курсують
    print("🚏 Класифікація зупинок за типом транспорту (TRAM vs TROLLEYBUS)...")
    c.execute("""
        SELECT rs.stop_id, GROUP_CONCAT(DISTINCT r.type) as types
        FROM route_stations rs
        JOIN routes r ON rs.route_id = r.id
        GROUP BY rs.stop_id
    """)
    station_types = c.fetchall()
    for row in station_types:
        sid = row["stop_id"]
        types_str = row["types"] or ""
        if "TRAM" in types_str and "TROLLEYBUS" not in types_str:
            stype = "TRAM"
        elif "TROLLEYBUS" in types_str and "TRAM" not in types_str:
            stype = "TROLLEYBUS"
        else:
            stype = "MIXED"
        c.execute("UPDATE stations SET transport_type = ? WHERE id = ?", (stype, sid))
    conn.commit()

    # 5. Генерація таблиці 1: stop_passing_routes
    print("📊 Генерація таблиці stop_passing_routes...")
    c.execute("DELETE FROM stop_passing_routes;")

    c.execute("""
        SELECT 
            s.id as stop_id,
            s.name as stop_name,
            s.lat,
            s.lng,
            s.type as station_type,
            s.is_dispatch_station,
            s.break_capacity,
            s.transport_type,
            r.type as route_type,
            GROUP_CONCAT(DISTINCT r.number) as route_numbers,
            COUNT(DISTINCT r.number) as r_count
        FROM stations s
        JOIN route_stations rs ON s.id = rs.stop_id
        JOIN routes r ON rs.route_id = r.id
        GROUP BY s.id, r.type
    """)
    passing_rows = c.fetchall()

    inserted_stops = 0
    for row in passing_rows:
        sid = row["stop_id"]
        sname = row["stop_name"]
        rtype = row["route_type"]
        rnums = sorted(list(set(row["route_numbers"].split(","))), key=lambda x: (len(x), x))
        rcnt = len(rnums)
        is_shared = 1 if rcnt >= 2 else 0

        c.execute("""
            INSERT INTO stop_passing_routes (
                id, stop_id, stop_name, transport_type, routes_list, route_count,
                is_shared, is_dispatch_station, break_capacity, lat, lng
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"{sid}_{rtype}",
            sid,
            sname,
            rtype,
            json.dumps(rnums, ensure_ascii=False),
            rcnt,
            is_shared,
            row["is_dispatch_station"] or 0,
            row["break_capacity"] or 0,
            row["lat"],
            row["lng"]
        ))
        inserted_stops += 1

    conn.commit()
    print(f"✅ Успішно збережено {inserted_stops} записів у stop_passing_routes!")

    # 6. Генерація таблиці 2: route_shared_corridors
    print("🛤️ Розрахунок точних суміщених ділянок між парами маршрутів (route_shared_corridors)...")
    c.execute("DELETE FROM route_shared_corridors;")

    c.execute("SELECT id, number, name, type, color FROM routes ORDER BY type, cast(number as integer)")
    all_routes = c.fetchall()

    total_overlaps_created = 0

    for r_base in all_routes:
        b_id = r_base["id"]
        b_num = r_base["number"]
        b_type = r_base["type"]

        # Отримуємо впорядковані зупинки прямого напрямку (dir 0) для базового маршруту
        c.execute("""
            SELECT rs.stop_sequence, rs.stop_id, s.name as stop_name
            FROM route_stations rs
            JOIN stations s ON rs.stop_id = s.id
            WHERE rs.route_id = ? AND rs.direction_id = 0
            ORDER BY rs.stop_sequence
        """, (b_id,))
        base_dir0_stops = c.fetchall()

        if not base_dir0_stops:
            continue

        base_stop_ids_order = [s["stop_id"] for s in base_dir0_stops]
        base_stop_names_map = {s["stop_id"]: s["stop_name"] for s in base_dir0_stops}

        for r_target in all_routes:
            t_id = r_target["id"]
            t_num = r_target["number"]
            t_type = r_target["type"]

            # Суворе правило 1: однаковий вид транспорту!
            if b_type != t_type:
                continue

            # Суворе правило 2: не порівнюємо маршрут сам із собою!
            if b_id == t_id or b_num == t_num:
                continue

            # Отримуємо всі унікальні stop_id цільового маршруту (в обох напрямках)
            c.execute("SELECT DISTINCT stop_id FROM route_stations WHERE route_id = ?", (t_id,))
            target_stop_ids = set(r["stop_id"] for r in c.fetchall())

            # Знаходимо спільні зупинки, зберігаючи послідовність базового маршруту
            shared_ids = [sid for sid in base_stop_ids_order if sid in target_stop_ids]
            shared_names = [base_stop_names_map[sid] for sid in shared_ids]

            # Суворе правило 3: додаємо запис ТІЛЬКИ якщо є хоча б одна спільна зупинка!
            if len(shared_ids) == 0:
                continue

            start_stop = shared_names[0]
            end_stop = shared_names[-1]
            overlap_id = f"overlap_{b_type.lower()}_{b_num}_{t_num}"

            # Визначаємо мінімальний безпечний інтервал h_min
            # Якщо спільних зупинок більше 10 — магістральний коридор (2 хв)
            # Якщо 1 зупинка — вузол примикання/розгалуження (2 хв)
            # В інших випадках — 3 хв
            min_headway = 2 if len(shared_ids) >= 10 or len(shared_ids) == 1 else 3

            corridor_label = None
            if len(shared_ids) >= 15:
                corridor_label = "Магістральний спільний коридор"
            elif len(shared_ids) == 1:
                corridor_label = f"Вузол примикання ({start_stop})"
            else:
                corridor_label = f"Суміщена ділянка ({len(shared_ids)} зуп.)"

            c.execute("""
                INSERT INTO route_shared_corridors (
                    id, base_route_id, base_route_number, target_route_id,
                    target_route_number, target_route_name, target_route_color,
                    transport_type, shared_stops_count, start_stop, end_stop,
                    shared_stops, shared_stop_ids, min_headway_min, corridor_name, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                overlap_id,
                b_id,
                b_num,
                t_id,
                t_num,
                r_target["name"],
                r_target["color"] or "#3b82f6",
                b_type,
                len(shared_ids),
                start_stop,
                end_stop,
                json.dumps(shared_names, ensure_ascii=False),
                json.dumps(shared_ids, ensure_ascii=False),
                min_headway,
                corridor_label
            ))
            total_overlaps_created += 1

    conn.commit()
    print(f"✅ Успішно збережено {total_overlaps_created} суміщених ділянок у route_shared_corridors!")

    # 7. Контрольна перевірка
    print("\n🔍 Контрольна перевірка суміщених ділянок за route_id:")
    for test_id in ["1", "7", "21", "27", "28", "Tr7", "Tr9"]:
        c.execute("""
            SELECT target_route_number, shared_stops_count, start_stop, end_stop
            FROM route_shared_corridors
            WHERE base_route_id = ?
            ORDER BY shared_stops_count DESC
        """, (test_id,))
        rows = c.fetchall()
        if rows:
            details = [f"№{r['target_route_number']} ({r['shared_stops_count']} зуп: {r['start_stop']} ⟶ {r['end_stop']})" for r in rows]
            print(f"  • Маршрут ID={test_id}: {', '.join(details)}")
        else:
            print(f"  • Маршрут ID={test_id}: ВІДОКРЕМЛЕНИЙ РУХ (0 перетинів)")

    conn.close()
    print("\n🎉 Синхронізацію успішно завершено!")

if __name__ == "__main__":
    run_sync()
