from typing import List, Dict, Any, Optional, Tuple
from datetime import time
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import text

from app.models.models import RouteModel, StationModel, RouteStation, RouteSharedCorridorModel
from app.models.schedule import Schedule, ScheduleStatus, StaticDuty, StaticShift, StaticTrip, StaticStopTime, TripDirection
from app.services.shift_solver import parse_time_str, minutes_to_time

class InterlineSyncEngine:
    """
    Модуль Синхронізації Суміщених Ділянок Маршрутів «Зв'язок» КП «Одесміськелектротранс».
    Забезпечує мінімальний безпечний інтервал 2.0-3.0 хвилини між вагонами різних маршрутів
    на спільних зупинках / контрольних точках після розрахунку нарядів.
    """

    ODESSA_CORRIDORS: List[Dict[str, Any]] = [
        {
            "id": "corridor_peresyp",
            "name": "Пересипський магістральний коридор",
            "type": "TRAM",
            "routes": ["1", "6", "7"],
            "key_stations": ["Пересипський міст", "Ярмаркова площа", "Лузанівка", "вул. Кишинівська"],
            "min_headway_min": 2.0,
            "description": "Суміщений рух магістралі вул. Чорноморського козацтва — Миколаївська дорога"
        },
        {
            "id": "corridor_fontan",
            "name": "Коридор Великого Фонтану",
            "type": "TRAM",
            "routes": ["17", "18"],
            "key_stations": ["Куликове поле", "4-а станція Великого Фонтану", "9-а станція Великого Фонтану", "11-а станція Великого Фонтану"],
            "min_headway_min": 3.0,
            "description": "Суміщений рух вздовж Фонтанської дороги від Куликового поля до 11-ї ст."
        },
        {
            "id": "corridor_lustdorf",
            "name": "Люстдорфський магістральний коридор",
            "type": "TRAM",
            "routes": ["7", "13", "26"],
            "key_stations": ["пл. Старосінна", "1-а ст. Люстдорфської дороги", "3-я ст. Люстдорфської дороги", "11-а ст. Люстдорфської дороги"],
            "min_headway_min": 2.0,
            "description": "Спільна магістральна ділянка Люстдорфської дороги від Старосінної площі"
        },
        {
            "id": "corridor_lustdorf_suburban",
            "name": "Вузол 11-ї ст. Люстдорфської дороги",
            "type": "TRAM",
            "routes": ["7", "26", "27"],
            "key_stations": ["11-а ст. Люстдорфської дороги"],
            "min_headway_min": 2.0,
            "description": "Вузлове стикування скороченого маршруту №27 з магістральними лініями №7 та №26"
        },
        {
            "id": "corridor_privoz_vokzal",
            "name": "Привокзально-Преображенський коридор",
            "type": "TRAM",
            "routes": ["5", "28"],
            "key_stations": ["Залізничний вокзал", "вул. Пантелеймонівська", "вул. Преображенська", "Театр Музкомедії"],
            "min_headway_min": 2.5,
            "description": "Суміщений рух через Старосінну площу, Вокзал та Преображенську"
        },
        {
            "id": "corridor_slobidka",
            "name": "Слобідський трамвайний коридор",
            "type": "TRAM",
            "routes": ["12", "15"],
            "key_stations": ["Слобідський ринок", "Міська лікарня №11", "узвіз Маловського", "Ольгіївський узвіз"],
            "min_headway_min": 3.5,
            "description": "Спільні ділянки колій на Слобідці та узвозі Маловського"
        },
        {
            "id": "corridor_moldavanka",
            "name": "Молдавансько-Тираспольський коридор",
            "type": "TRAM",
            "routes": ["7", "10", "11", "15"],
            "key_stations": ["пл. Тираспольська", "пл. Олексіївська", "вул. Прохоровська"],
            "min_headway_min": 3.0,
            "description": "Вузол Тираспольської та Олексіївської площ"
        },
        {
            "id": "corridor_shevchenko",
            "name": "Фонтансько-Шевченківський тролейбусний коридор",
            "type": "TROLLEYBUS",
            "routes": ["Tr7", "Tr9", "Tr10"],
            "key_stations": ["Політехнічний інститут", "просп. Гагаріна", "пл. 10 Квітня", "вул. Сегедська"],
            "min_headway_min": 2.0,
            "description": "Спільна контактна мережа проспекту Шевченка та вул. Сегедської"
        },
        {
            "id": "corridor_tairova",
            "name": "Таїровський тролейбусний коридор",
            "type": "TROLLEYBUS",
            "routes": ["Tr7", "Tr12"],
            "key_stations": ["вул. Архітекторська", "Ринок Південний", "вул. Академіка Корольова"],
            "min_headway_min": 3.0,
            "description": "Магістральний вихід з Таїрова по вул. Корольова"
        },
        {
            "id": "corridor_preobrazhenska_trolley",
            "name": "Преображенсько-Мечниковський коридор",
            "type": "TROLLEYBUS",
            "routes": ["Tr3", "Tr8"],
            "key_stations": ["вул. Преображенська", "вул. Мечникова", "вул. Богдана Хмельницького"],
            "min_headway_min": 3.5,
            "description": "Спільний рух по вул. Мечникова та вул. Богдана Хмельницького"
        },
        {
            "id": "corridor_center_trolley",
            "name": "Новосельського — Соборна площа",
            "type": "TROLLEYBUS",
            "routes": ["Tr2", "Tr7"],
            "key_stations": ["вул. Новосельського", "Соборна площа", "вул. Торгова"],
            "min_headway_min": 3.5,
            "description": "Центральне кільце навколо Соборної площі"
        }
    ]

    async def get_corridors_status(self, db: AsyncSession, min_headway_min: float = 2.0) -> List[Dict[str, Any]]:
        """
        Повертає статус готовності кожного з 10 коридорів:
        перевіряє, які маршрути мають активні розклади, а які потребують складання нарядів.
        """
        # 1. Отримуємо всі активні розклади
        sched_res = await db.execute(
            select(Schedule.route_id)
            .where(Schedule.status == ScheduleStatus.ACTIVE)
        )
        active_route_ids = set(sched_res.scalars().all())

        # 2. Отримуємо назви маршрутів
        routes_res = await db.execute(select(RouteModel))
        routes_map = {r.id: r for r in routes_res.scalars().all()}

        results = []
        for corridor in self.ODESSA_CORRIDORS:
            c_routes = corridor["routes"]
            ready_routes = []
            missing_routes = []

            for r_id in c_routes:
                r_obj = routes_map.get(r_id)
                r_info = {
                    "route_id": r_id,
                    "number": r_obj.number if r_obj else r_id,
                    "name": r_obj.name if r_obj else f"Маршрут №{r_id}",
                    "type": r_obj.type if r_obj else corridor["type"].lower(),
                    "has_active_schedule": r_id in active_route_ids
                }
                if r_id in active_route_ids:
                    ready_routes.append(r_info)
                else:
                    missing_routes.append(r_info)

            can_sync = len(missing_routes) == 0 and len(ready_routes) >= 2

            # Оцінка скупчень
            conflicts_count = 0
            if can_sync:
                # Якщо всі готові, рахуємо конфлікти на ключовому вузлі
                passages_res = await self._get_passages_for_corridor(db, corridor, min_headway_min)
                conflicts_count = passages_res.get("conflicts_count", 0)

            results.append({
                "id": corridor["id"],
                "name": corridor["name"],
                "type": corridor["type"],
                "routes": corridor["routes"],
                "key_stations": corridor["key_stations"],
                "min_headway_min": corridor.get("min_headway_min", min_headway_min),
                "description": corridor.get("description", ""),
                "can_sync": can_sync,
                "ready_routes": ready_routes,
                "missing_routes": missing_routes,
                "status": "SYNCHRONIZED" if can_sync and conflicts_count == 0 else ("NEEDS_SYNC" if can_sync else "MISSING_SCHEDULES"),
                "conflicts_count": conflicts_count
            })

        return results

    async def check_route_pair(
        self,
        db: AsyncSession,
        route_a: str,
        route_b: str,
        min_headway_min: float = 2.0
    ) -> Dict[str, Any]:
        """
        Перевірка конкретної пари маршрутів (наприклад, Трамваї 5 та 28, або 1 та 7):
        - Знаходить спільні зупинки між ними;
        - Перевіряє наявність активного розкладу для кожного;
        - Якщо обидва активні — розраховує хронологію проходження ключової спільної зупинки
          та виявляє скупчення (< min_headway_min).
        """
        # 1. Завантаження даних маршрутів
        r_a_res = await db.execute(select(RouteModel).where(RouteModel.id == route_a))
        r_b_res = await db.execute(select(RouteModel).where(RouteModel.id == route_b))
        r_a = r_a_res.scalar_one_or_none()
        r_b = r_b_res.scalar_one_or_none()

        if not r_a or not r_b:
            return {
                "status": "ERROR",
                "message": "Один або обидва маршрути не знайдено в базі даних"
            }

        # 2. Знаходимо спільні зупинки
        q_shared = text("""
            SELECT s.id, s.name
            FROM route_stations rs1
            JOIN route_stations rs2 ON rs1.stop_id = rs2.stop_id
            JOIN stations s ON rs1.stop_id = s.id
            WHERE rs1.route_id = :r_a AND rs2.route_id = :r_b
            GROUP BY s.id, s.name
            ORDER BY MIN(rs1.stop_sequence) ASC
        """)
        shared_rows = (await db.execute(q_shared, {"r_a": route_a, "r_b": route_b})).fetchall()
        shared_stops = [{"id": row[0], "name": row[1]} for row in shared_rows]

        # 3. Перевірка наявності активних розкладів
        sched_a_res = await db.execute(
            select(Schedule).where((Schedule.route_id == route_a) & (Schedule.status == ScheduleStatus.ACTIVE)).order_by(Schedule.id.desc())
        )
        sched_b_res = await db.execute(
            select(Schedule).where((Schedule.route_id == route_b) & (Schedule.status == ScheduleStatus.ACTIVE)).order_by(Schedule.id.desc())
        )
        sched_a = sched_a_res.scalars().first()
        sched_b = sched_b_res.scalars().first()

        route_a_info = {
            "route_id": route_a,
            "number": r_a.number or route_a,
            "name": r_a.name,
            "type": r_a.type or "tram",
            "has_active_schedule": sched_a is not None,
            "schedule_id": sched_a.id if sched_a else None
        }

        route_b_info = {
            "route_id": route_b,
            "number": r_b.number or route_b,
            "name": r_b.name,
            "type": r_b.type or "tram",
            "has_active_schedule": sched_b is not None,
            "schedule_id": sched_b.id if sched_b else None
        }

        can_sync = sched_a is not None and sched_b is not None

        # Якщо один або обидва не мають розкладу
        if not can_sync:
            missing_names = []
            if not sched_a:
                missing_names.append(f"№{r_a.number or route_a}")
            if not sched_b:
                missing_names.append(f"№{r_b.number or route_b}")

            return {
                "status": "MISSING_SCHEDULES",
                "can_sync": False,
                "route_a": route_a_info,
                "route_b": route_b_info,
                "shared_stops_count": len(shared_stops),
                "shared_stops": shared_stops,
                "message": f"Синхронізація заблокована: для маршруту {', '.join(missing_names)} відсутній активний затверджений розклад. Складіть наряди у Конструкторі нарядів."
            }

        # 4. Якщо обидва активні — формуємо похвилинну стрічку перетину на ключовому вузлі
        matching_corridor = next((c for c in self.ODESSA_CORRIDORS if route_a in c["routes"] and route_b in c["routes"]), None)
        key_stations = matching_corridor.get("key_stations") if matching_corridor else None

        hub_info = await self._resolve_shared_hub(db, [route_a, route_b], key_stations)
        primary_stop = {"id": hub_info["primary_id"], "name": hub_info["name"]} if hub_info else (shared_stops[0] if shared_stops else {"id": "1", "name": "Вузлова зупинка"})
        passages = await self._collect_passages_at_stop(db, [sched_a, sched_b], [r_a, r_b], primary_stop["id"], primary_stop["name"], min_headway_min)

        return {
            "status": "READY_TO_SYNC",
            "can_sync": True,
            "route_a": route_a_info,
            "route_b": route_b_info,
            "shared_stops_count": len(shared_stops),
            "shared_stops": shared_stops,
            "primary_hub_stop": primary_stop,
            "conflicts_count": passages["conflicts_count"],
            "min_headway_min": min_headway_min,
            "passages": passages["timeline"]
        }

    async def _resolve_shared_hub(
        self,
        db: AsyncSession,
        route_ids: List[str],
        key_station_names: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Знаходить ключовий вузол перетину для маршрутів:
        Повертає назву вузла та словник платформ по напрямках {0: stop_id_0, 1: stop_id_1}
        """
        if len(route_ids) < 2:
            return None

        q_shared = text("""
            SELECT s.id, s.name, rs1.direction_id, MIN(rs1.stop_sequence) as min_seq
            FROM route_stations rs1
            JOIN route_stations rs2 ON rs1.stop_id = rs2.stop_id AND rs1.direction_id = rs2.direction_id
            JOIN stations s ON rs1.stop_id = s.id
            WHERE rs1.route_id = :r_a AND rs2.route_id = :r_b
            GROUP BY s.id, s.name, rs1.direction_id
            ORDER BY rs1.direction_id ASC, min_seq ASC
        """)
        rows = (await db.execute(q_shared, {"r_a": route_ids[0], "r_b": route_ids[1]})).fetchall()
        if not rows:
            q_shared_loose = text("""
                SELECT s.id, s.name, rs1.direction_id, MIN(rs1.stop_sequence) as min_seq
                FROM route_stations rs1
                JOIN route_stations rs2 ON rs1.stop_id = rs2.stop_id
                JOIN stations s ON rs1.stop_id = s.id
                WHERE rs1.route_id = :r_a AND rs2.route_id = :r_b
                GROUP BY s.id, s.name, rs1.direction_id
                ORDER BY min_seq ASC
            """)
            rows = (await db.execute(q_shared_loose, {"r_a": route_ids[0], "r_b": route_ids[1]})).fetchall()

        if not rows:
            return None

        hub_name = None
        if key_station_names:
            for k in key_station_names:
                matched = next((r for r in rows if k.lower() in r[1].lower()), None)
                if matched:
                    hub_name = matched[1]
                    break
        if not hub_name:
            hub_name = rows[0][1]

        stops_by_dir: Dict[int, str] = {}
        for r in rows:
            if r[1].lower() == hub_name.lower():
                stops_by_dir[int(r[2])] = str(r[0])

        primary_id = str(rows[0][0])
        if 0 not in stops_by_dir and stops_by_dir:
            stops_by_dir[0] = next(iter(stops_by_dir.values()))
        if 1 not in stops_by_dir and stops_by_dir:
            stops_by_dir[1] = next(iter(stops_by_dir.values()))

        return {
            "name": hub_name,
            "stops_by_dir": stops_by_dir,
            "primary_id": primary_id
        }

    def _calc_passage_time_min(
        self,
        trip: StaticTrip,
        r_id: str,
        target_stop_id: Optional[str],
        route_stations_map: Dict[Tuple[str, int], List[str]]
    ) -> Optional[int]:
        """Розраховує точний або пропорційно інтерпольований час проходження зупинки target_stop_id з урахуванням напрямку"""
        if not trip.stop_times or not target_stop_id:
            return None

        # 1. Точний пошук зупинки у збережених stop_times
        for st in trip.stop_times:
            if str(st.stop_id) == str(target_stop_id):
                t = st.departure_time or st.arrival_time
                if t:
                    return t.hour * 60 + t.minute

        # 2. Інтерполяція за послідовністю зупинок у даному напрямку
        dir_id = 0 if trip.direction == TripDirection.FORWARD else 1
        seq = route_stations_map.get((str(r_id), dir_id), [])

        st_first = trip.stop_times[0].departure_time or trip.stop_times[0].arrival_time
        if not st_first:
            return None
        start_min = st_first.hour * 60 + st_first.minute

        st_last = trip.stop_times[-1].arrival_time or trip.stop_times[-1].departure_time
        end_min = (st_last.hour * 60 + st_last.minute) if st_last else (start_min + 30)
        if end_min < start_min:
            end_min += 1440
        trip_duration = max(1, end_min - start_min)

        if target_stop_id in seq and len(seq) > 1:
            idx = seq.index(target_stop_id)
            ratio = idx / (len(seq) - 1)
            return (start_min + int(round(trip_duration * ratio))) % 1440

        return None

    async def apply_sync_pair(
        self,
        db: AsyncSession,
        route_ids: List[str],
        min_headway_min: float = 2.0
    ) -> Dict[str, Any]:
        """
        Застосовує фазові мікро-зсуви відправлень для усунення скупчень на спільних зупинках:
        - Розраховує реальний час зустрічі на спільній вузловій зупинці для кожного напрямку;
        - Зсуває рейси веденого маршруту на +1..3 хв за наявності небезпечного зближення (< min_headway_min);
        - Каскадно оновлює ВСІ зупинки рейсу у static_stop_times;
        - Повертає список скоригованих рейсів та оновлений лічильник скупчень.
        """
        if len(route_ids) < 2:
            return {"status": "ERROR", "message": "Для синхронізації потрібно щонайменше 2 маршрути"}

        scheds_res = await db.execute(
            select(Schedule)
            .where((Schedule.route_id.in_(route_ids)) & (Schedule.status == ScheduleStatus.ACTIVE))
            .options(
                selectinload(Schedule.duties)
                .selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
        )
        scheds = scheds_res.scalars().all()
        if len(scheds) < len(route_ids):
            return {"status": "ERROR", "message": "Не всі маршрути мають активний розклад"}

        matching_corridor = next((c for c in self.ODESSA_CORRIDORS if all(r in c["routes"] for r in route_ids)), None)
        key_stations = matching_corridor.get("key_stations") if matching_corridor else None

        hub_info = await self._resolve_shared_hub(db, route_ids, key_stations)
        if not hub_info:
            return {"status": "ERROR", "message": "Спільних зупинок між маршрутами не виявлено"}

        hub_name = hub_info["name"]
        hub_stops = hub_info["stops_by_dir"]

        rs_res = await db.execute(
            select(RouteStation)
            .where(RouteStation.route_id.in_(route_ids))
            .order_by(RouteStation.route_id, RouteStation.direction_id, RouteStation.stop_sequence)
        )
        all_rs = rs_res.scalars().all()
        route_stations_map: Dict[Tuple[str, int], List[str]] = {}
        for rs in all_rs:
            k = (str(rs.route_id), int(rs.direction_id))
            if k not in route_stations_map:
                route_stations_map[k] = []
            route_stations_map[k].append(str(rs.stop_id))

        scheds_sorted = sorted(scheds, key=lambda s: len(s.duties), reverse=True)
        lead_sched = scheds_sorted[0]
        follower_scheds = scheds_sorted[1:]

        lead_pass: Dict[int, List[int]] = {0: [], 1: []}
        for duty in lead_sched.duties:
            for shift in duty.shifts:
                for trip in shift.trips:
                    dir_id = 0 if trip.direction == TripDirection.FORWARD else 1
                    target_stop = hub_stops.get(dir_id)
                    p_min = self._calc_passage_time_min(trip, str(lead_sched.route_id), target_stop, route_stations_map)
                    if p_min is not None:
                        lead_pass[dir_id].append(p_min)

        for d in [0, 1]:
            lead_pass[d].sort()

        adjusted_trips: List[Dict[str, Any]] = []
        conflicts_resolved = 0

        for f_sched in follower_scheds:
            for duty in f_sched.duties:
                for shift in duty.shifts:
                    for trip in shift.trips:
                        if not trip.stop_times:
                            continue
                        dir_id = 0 if trip.direction == TripDirection.FORWARD else 1
                        target_stop = hub_stops.get(dir_id)
                        f_pass_min = self._calc_passage_time_min(trip, str(f_sched.route_id), target_stop, route_stations_map)
                        if f_pass_min is None:
                            continue

                        has_conflict = any(abs(f_pass_min - l_min) < min_headway_min for l_min in lead_pass[dir_id])
                        if has_conflict:
                            chosen_delta = 0
                            for cand_delta in [2, 3, 1, 4, -2, -1, 5, -3]:
                                cand_p = (f_pass_min + cand_delta) % 1440
                                if all(abs(cand_p - l) >= min_headway_min for l in lead_pass[dir_id]):
                                    chosen_delta = cand_delta
                                    break
                            if chosen_delta == 0:
                                chosen_delta = int(math.ceil(min_headway_min))

                            conflicts_resolved += 1
                            old_first_dep = trip.stop_times[0].departure_time.strftime("%H:%M") if trip.stop_times and trip.stop_times[0].departure_time else ""

                            for st in trip.stop_times:
                                if st.departure_time:
                                    cur_m = st.departure_time.hour * 60 + st.departure_time.minute
                                    new_m = (cur_m + chosen_delta) % 1440
                                    st.departure_time = time(new_m // 60, new_m % 60)
                                if st.arrival_time:
                                    cur_m = st.arrival_time.hour * 60 + st.arrival_time.minute
                                    new_m = (cur_m + chosen_delta) % 1440
                                    st.arrival_time = time(new_m // 60, new_m % 60)

                            new_first_dep = trip.stop_times[0].departure_time.strftime("%H:%M") if trip.stop_times and trip.stop_times[0].departure_time else ""
                            new_p = (f_pass_min + chosen_delta) % 1440
                            lead_pass[dir_id].append(new_p)
                            lead_pass[dir_id].sort()

                            adjusted_trips.append({
                                "route_id": f_sched.route_id,
                                "duty_number": duty.duty_number,
                                "shift_sequence": shift.shift_sequence,
                                "trip_sequence": trip.trip_sequence,
                                "shift_delta_min": chosen_delta,
                                "old_time": old_first_dep,
                                "new_time": new_first_dep
                            })

        await db.commit()

        return {
            "status": "SUCCESS",
            "message": f"Синхронізацію успішно застосовано! Усунено {conflicts_resolved} скупчень на вузлі «{hub_name}». Каскадно скориговано {len(adjusted_trips)} рейсів.",
            "conflicts_resolved": conflicts_resolved,
            "adjusted_count": len(adjusted_trips),
            "adjusted_trips": adjusted_trips
        }

    async def _get_passages_for_corridor(self, db: AsyncSession, corridor: Dict[str, Any], min_headway_min: float) -> Dict[str, Any]:
        """Підрахунок рейсів та скупчень для коридору на ключовій спільній зупинці з урахуванням напрямків"""
        c_routes = corridor["routes"]
        scheds_res = await db.execute(
            select(Schedule)
            .where((Schedule.route_id.in_(c_routes)) & (Schedule.status == ScheduleStatus.ACTIVE))
            .options(
                selectinload(Schedule.duties)
                .selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
        )
        scheds = scheds_res.scalars().all()
        if len(scheds) < 2:
            return {"conflicts_count": 0, "timeline": []}

        hub_info = await self._resolve_shared_hub(db, c_routes, corridor.get("key_stations"))
        if not hub_info:
            return {"conflicts_count": 0, "timeline": []}

        hub_stops = hub_info["stops_by_dir"]

        rs_res = await db.execute(
            select(RouteStation)
            .where(RouteStation.route_id.in_(c_routes))
            .order_by(RouteStation.route_id, RouteStation.direction_id, RouteStation.stop_sequence)
        )
        all_rs = rs_res.scalars().all()
        route_stations_map: Dict[Tuple[str, int], List[str]] = {}
        for rs in all_rs:
            k = (str(rs.route_id), int(rs.direction_id))
            if k not in route_stations_map:
                route_stations_map[k] = []
            route_stations_map[k].append(str(rs.stop_id))

        all_passages = []
        for s in scheds:
            for duty in s.duties:
                for shift in duty.shifts:
                    for trip in shift.trips:
                        dir_id = 0 if trip.direction == TripDirection.FORWARD else 1
                        target_stop_id = hub_stops.get(dir_id)
                        p_min = self._calc_passage_time_min(trip, str(s.route_id), target_stop_id, route_stations_map)
                        if p_min is not None:
                            h = p_min // 60
                            m = p_min % 60
                            all_passages.append({
                                "route_id": s.route_id,
                                "duty_number": duty.duty_number,
                                "direction": dir_id,
                                "time_min": p_min,
                                "time_str": f"{h:02d}:{m:02d}"
                            })

        conflicts = 0
        for d in [0, 1]:
            d_pass = [p for p in all_passages if p["direction"] == d]
            d_pass.sort(key=lambda p: p["time_min"])
            for i in range(1, len(d_pass)):
                if d_pass[i]["route_id"] != d_pass[i-1]["route_id"]:
                    delta = d_pass[i]["time_min"] - d_pass[i-1]["time_min"]
                    if 0 <= delta < min_headway_min:
                        conflicts += 1

        all_passages.sort(key=lambda p: p["time_min"])
        return {"conflicts_count": conflicts, "timeline": all_passages}

    async def _collect_passages_at_stop(
        self,
        db: AsyncSession,
        scheds: List[Schedule],
        routes: List[RouteModel],
        stop_id: str,
        stop_name: str,
        min_headway_min: float
    ) -> Dict[str, Any]:
        """Формує детальну хронологічну рейс-стрічку на спільній зупинці з урахуванням напрямків руху"""
        routes_map = {r.id: r for r in routes}
        route_ids = [s.route_id for s in scheds]

        hub_info = await self._resolve_shared_hub(db, route_ids, [stop_name])
        hub_stops = hub_info["stops_by_dir"] if hub_info else {0: stop_id, 1: stop_id}

        rs_res = await db.execute(
            select(RouteStation)
            .where(RouteStation.route_id.in_(route_ids))
            .order_by(RouteStation.route_id, RouteStation.direction_id, RouteStation.stop_sequence)
        )
        all_rs = rs_res.scalars().all()
        route_stations_map: Dict[Tuple[str, int], List[str]] = {}
        for rs in all_rs:
            k = (str(rs.route_id), int(rs.direction_id))
            if k not in route_stations_map:
                route_stations_map[k] = []
            route_stations_map[k].append(str(rs.stop_id))

        passages = []
        for s in scheds:
            r_obj = routes_map.get(s.route_id)
            r_num = r_obj.number if r_obj else s.route_id

            duties_res = await db.execute(
                select(StaticDuty)
                .where(StaticDuty.schedule_id == s.id)
                .options(
                    selectinload(StaticDuty.shifts)
                    .selectinload(StaticShift.trips)
                    .selectinload(StaticTrip.stop_times)
                )
            )
            duties = duties_res.scalars().all()

            for duty in duties:
                for shift in duty.shifts:
                    for trip in shift.trips:
                        dir_id = 0 if trip.direction == TripDirection.FORWARD else 1
                        target_stop = hub_stops.get(dir_id, stop_id)
                        t_min = self._calc_passage_time_min(trip, str(s.route_id), str(target_stop), route_stations_map)
                        if t_min is not None:
                            h = t_min // 60
                            m = t_min % 60
                            passages.append({
                                "trip_id": trip.id,
                                "route_id": s.route_id,
                                "route_number": r_num,
                                "duty_number": duty.duty_number,
                                "shift_index": shift.shift_sequence,
                                "direction": dir_id,
                                "time_min": t_min,
                                "time_str": f"{h:02d}:{m:02d}",
                                "trip_type": trip.trip_type
                            })

        conflicts = 0
        analyzed_timeline = []

        for d in [0, 1]:
            d_passages = [p for p in passages if p["direction"] == d]
            d_passages.sort(key=lambda p: p["time_min"])
            for i, p in enumerate(d_passages):
                headway = None
                status = "NORMAL"
                if i > 0:
                    prev_p = d_passages[i - 1]
                    delta = p["time_min"] - prev_p["time_min"]
                    headway = round(delta, 1)

                    if p["route_id"] != prev_p["route_id"]:
                        if 0 <= delta < min_headway_min:
                            status = "CLUMPING"
                            conflicts += 1
                        elif delta < 2.5:
                            status = "ACCEPTABLE"
                        else:
                            status = "GOOD"
                    else:
                        status = "SAME_ROUTE"

                analyzed_timeline.append({
                    **p,
                    "headway_from_prev_min": headway,
                    "interval_status": status
                })

        analyzed_timeline.sort(key=lambda p: p["time_min"])

        return {
            "conflicts_count": conflicts,
            "timeline": analyzed_timeline[:100]
        }

interline_sync_engine = InterlineSyncEngine()

