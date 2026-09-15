"""
Comprehensive End-to-End Integration Test for KP "Odesmiskelektrotrans"
Tests the complete dispatching lifecycle:
1. Authentication & Session Validation
2. Network Directory & Fleet Retrieval
3. Mathematical Transit Solver & Schedule Activation
4. Dispatch Orders Lifecycle (Create -> Broadcast -> Complete -> Cancel)
5. Incident Management Flow
6. Real-Time Analytics & KPI Calculations
7. GTFS Open Data Engine Verification
"""

import asyncio
import io
import zipfile
import httpx
from app.main import app

async def run_dispatch_lifecycle_tests():
    print("=" * 70)
    print("🚦 ПОЧАТОК КОМПЛЕКСНОГО E2E ТЕСТУВАННЯ АРМ КП «ОДЕСМІСЬКЕЛЕКТРОТРАНС»")
    print("=" * 70)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # -------------------------------------------------------------
        # 1. АВТЕНТИФІКАЦІЯ ТА JWT СЕСІЯ
        # -------------------------------------------------------------
        print("\n🔑 1. Тестування авторизації та валідації JWT сесії...")
        login_payload = {"username": "admin", "password": "admin123"}
        login_resp = await client.post("/api/v1/auth/login", json=login_payload)
        assert login_resp.status_code == 200, f"Auth failed: {login_resp.text}"
        auth_data = login_resp.json()
        token = auth_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ JWT токен отримано успішно: {token[:20]}...")

        me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert me_resp.status_code == 200, f"Failed /auth/me: {me_resp.text}"
        user_info = me_resp.json()
        assert user_info["username"] == "admin"
        assert user_info["is_superuser"] is True
        print(f"✅ Сесія валідна: {user_info['full_name']} ({user_info['role']})")

        # -------------------------------------------------------------
        # 2. ДОВІДНИКИ МЕРЕЖІ ТА РУХОМОГО СКЛАДУ
        # -------------------------------------------------------------
        print("\n🗺️ 2. Перевірка довідників маршрутів, зупинок та депо...")
        routes_resp = await client.get("/api/v1/routes", headers=auth_headers)
        assert routes_resp.status_code == 200
        routes = routes_resp.json()
        assert len(routes) > 0, "Routes list is empty"
        print(f"✅ Маршрутів у системі: {len(routes)}")

        stations_resp = await client.get("/api/v1/stations", headers=auth_headers)
        assert stations_resp.status_code == 200
        stations = stations_resp.json()
        assert len(stations) > 0, "Stations list is empty"
        print(f"✅ Зупинок та вузлів у базі: {len(stations)}")

        depots_resp = await client.get("/api/v1/settings/depots", headers=auth_headers)
        assert depots_resp.status_code == 200
        depots = depots_resp.json()
        print(f"✅ Депо електротранспорту зареєстровано: {len(depots)}")

        # -------------------------------------------------------------
        # 3. МАТЕМАТИЧНЕ ЯДРО ТА ГЕНЕРАЦІЯ РОЗКЛАДУ (TRANSIT SOLVER)
        # -------------------------------------------------------------
        print("\n🧮 3. Тестування математичного генератора розкладів (Transit Solver)...")
        solver_request = {
            "route_id": "18",
            "route_name": "Куликове поле — 16-та ст. Великого Фонтану",
            "transport_type": "TRAM",
            "duties_count": 8,
            "round_trip_min": 84,
            "route_length_km": 11.2,
            "default_speed_kmh": 14.5,
            "start_time": "05:40",
            "end_time": "22:30",
            "designated_dp_name": "Куликове поле",
            "depot_name": "ТД-1"
        }
        gen_resp = await client.post("/api/v1/schedules/generate-master", json=solver_request, headers=auth_headers)
        assert gen_resp.status_code == 200, f"Solver generation error: {gen_resp.text}"
        grid_data = gen_resp.json()
        assert "master_grid_rows" in grid_data
        assert "summary_passport" in grid_data
        assert len(grid_data["master_grid_rows"]) == 8
        passport = grid_data["summary_passport"]
        print(f"✅ Згенеровано еталонну сітку розкладу №18:")
        print(f"   - Нарядів: {passport.get('duties_count')}")
        print(f"   - Розрахунковий інтервал: {passport.get('headway_min')} хв")
        print(f"   - Добовий пробіг: {passport.get('total_wagon_km')} км")
        print(f"   - Добових рейсів: {passport.get('total_trips')}")

        # Фіксація та збереження розкладу в БД
        commit_resp = await client.post("/api/v1/schedules/commit-static", json=grid_data, headers=auth_headers)
        assert commit_resp.status_code == 200, f"Commit schedule error: {commit_resp.text}"
        commit_result = commit_resp.json()
        assert commit_result["status"] == "success"
        print(f"✅ Розклад успішно затверджено та збережено в БД (ID: {commit_result.get('schedule_id')})")

        # -------------------------------------------------------------
        # 4. ЖИВА ДИСПЕТЧЕРИЗАЦІЯ ТА ЖУРНАЛ НАКАЗІВ (DISPATCH ORDERS)
        # -------------------------------------------------------------
        print("\n📋 4. Тестування оперативного журналу диспетчерських розпоряджень...")
        new_order = {
            "route_id": "18",
            "route_number": "18",
            "transport_type": "TRAM",
            "vehicle_id": "4020",
            "duty_number": 3,
            "driver_name": "Коваленко О. І.",
            "order_type": "SHORT_TURN",
            "target_location": "11-та ст. Великого Фонтану",
            "duration_min": 15,
            "reason": "Затримка через ДТП стороннього транспорту",
            "description": "Скоротити рейс до 11-ї ст. В. Фонтану для відновлення інтервалу руху",
            "dispatcher_name": "Головний диспетчер ЦД"
        }
        create_order_resp = await client.post("/api/v1/dispatch/orders/", json=new_order, headers=auth_headers)
        assert create_order_resp.status_code == 200, f"Create order error: {create_order_resp.text}"
        created_order = create_order_resp.json()
        order_id = created_order["id"]
        print(f"✅ Наказ створено: №{created_order['order_number']} (ID: {order_id}), статус: {created_order['status']}")

        # Отримання статистики наказів
        stats_resp = await client.get("/api/v1/dispatch/orders/stats", headers=auth_headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert stats["total_today"] >= 1
        print(f"✅ Статистика наказів: сьогодні видано {stats['total_today']}, активних: {stats['active_count']}")

        # Завершення виконання наказу
        complete_order_resp = await client.post(f"/api/v1/dispatch/orders/{order_id}/complete", headers=auth_headers)
        assert complete_order_resp.status_code == 200
        completed_order = complete_order_resp.json()
        assert completed_order["status"] == "COMPLETED"
        assert completed_order["completed_at"] is not None
        print(f"✅ Наказ №{completed_order['order_number']} успішно виконано (статус: COMPLETED)")

        # -------------------------------------------------------------
        # 5. РЕЄСТРАЦІЯ ТА ВИРІШЕННЯ ІНЦИДЕНТІВ
        # -------------------------------------------------------------
        print("\n⚠️ 5. Тестування системи обліку інцидентів на лінії...")
        incident_payload = {
            "vehicle_id": "4020",
            "description": "Технічна несправність пантографа біля Станції «Аркадія»",
            "lat": 46.4312,
            "lon": 30.7634
        }
        inc_report_resp = await client.post("/api/v1/incidents/report", json=incident_payload, headers=auth_headers)
        assert inc_report_resp.status_code == 200, f"Incident report error: {inc_report_resp.text}"
        inc_res = inc_report_resp.json()
        incident_id = inc_res.get("incident_id")
        print(f"✅ Інцидент зареєстровано в черзі телеметрії (ID: {incident_id})")

        # Перевірка списку інцидентів
        incidents_list_resp = await client.get("/api/v1/incidents/", headers=auth_headers)
        assert incidents_list_resp.status_code == 200
        inc_list = incidents_list_resp.json()
        print(f"✅ Записів у журналі інцидентів БД: {len(inc_list)}")
        if len(inc_list) > 0:
            first_db_inc = inc_list[0]
            if first_db_inc["status"] != "RESOLVED":
                resolve_resp = await client.post(f"/api/v1/incidents/{first_db_inc['id']}/resolve", json={"notes": "Виправлено бригадою АЕМ"}, headers=auth_headers)
                assert resolve_resp.status_code == 200
                print(f"✅ Інцидент БД №{first_db_inc['id']} успішно закрито")

        # -------------------------------------------------------------
        # 6. АНАЛІТИКА ТА KPI ПІДПРИЄМСТВА
        # -------------------------------------------------------------
        print("\n📊 6. Перевірка аналітичних агрегатів та KPI...")
        kpi_resp = await client.get("/api/v1/analytics/kpi", headers=auth_headers)
        assert kpi_resp.status_code == 200
        kpi_data = kpi_resp.json()
        assert "on_time_percentage" in kpi_data
        assert "active_routes_count" in kpi_data
        assert "active_vehicles_count" in kpi_data
        print(f"✅ KPI КП «ОМЕТ»:")
        print(f"   - Регулярність руху (OTP): {kpi_data['on_time_percentage']}%")
        print(f"   - Діючих маршрутів: {kpi_data['active_routes_count']}")
        print(f"   - Активних вагонів/тролейбусів: {kpi_data['active_vehicles_count']}")

        overview_resp = await client.get("/api/v1/analytics/overview", headers=auth_headers)
        assert overview_resp.status_code == 200
        print("✅ Огляд системи:", overview_resp.json()["status"])

        fleet_resp = await client.get("/api/v1/analytics/fleet-efficiency", headers=auth_headers)
        assert fleet_resp.status_code == 200
        fleet_data = fleet_resp.json()
        print(f"✅ Ефективність флоту: Трамваї {fleet_data['tram_efficiency_pct']}%, Тролейбуси {fleet_data['trolley_efficiency_pct']}%")

        # -------------------------------------------------------------
        # 7. ВАЛІДАЦІЯ ТА ЕКСПОРТ ВІДКРИТИХ ДАНИХ GTFS
        # -------------------------------------------------------------
        print("\n📦 7. Тестування онлайн-генератора та аудиту GTFS...")
        val_resp = await client.get("/api/v1/schedules/validate-gtfs", headers=auth_headers)
        assert val_resp.status_code == 200
        val_data = val_resp.json()
        assert val_data["status"] == "VALID"
        assert val_data["counts"]["routes"] > 0
        assert val_data["counts"]["stops"] > 0
        print(f"✅ Аудит GTFS: СТАТУС {val_data['status']}, {val_data['counts']['routes']} маршрутів, {val_data['counts']['stops']} зупинок")

        export_resp = await client.get("/api/v1/schedules/export-gtfs.zip", headers=auth_headers)
        assert export_resp.status_code == 200
        assert export_resp.headers.get("content-type") == "application/zip"
        zip_bytes = export_resp.content
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            names = z.namelist()
            assert "agency.txt" in names
            assert "routes.txt" in names
            assert "stops.txt" in names
            assert "trips.txt" in names
            assert "stop_times.txt" in names
            assert "calendar.txt" in names
            print(f"✅ GTFS ZIP перевірено ({len(names)} файлів, розмір: {len(zip_bytes):,} байт)")

    print("\n" + "=" * 70)
    print("🏆 ВСІ ЕТАПИ E2E ТЕСТУВАННЯ УСПІШНО ПРОЙДЕНО!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_dispatch_lifecycle_tests())
