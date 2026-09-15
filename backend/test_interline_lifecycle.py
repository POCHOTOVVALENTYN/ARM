import asyncio
from app.core.database import AsyncSessionLocal
from app.services.interline_sync import interline_sync_engine

async def main():
    print("=" * 60)
    print("📻 ТЕСТУВАННЯ МОДУЛЯ СИНХРОНІЗАЦІЇ «ЗВ'ЯЗОК» КП «ОМЕТ»")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # 1. Перевірка статусу коридорів
        corrs = await interline_sync_engine.get_corridors_status(db, min_headway_min=2.0)
        print(f"✅ Отримано коридорів: {len(corrs)}")
        for c in corrs:
            ready_str = ", ".join(r["number"] for r in c["ready_routes"]) or "немає"
            missing_str = ", ".join(r["number"] for r in c["missing_routes"]) or "немає"
            print(f"  - [{c['type']}] {c['name']}: {c['status']} | Готові: {ready_str} | Без розкладу: {missing_str}")

        # 2. Перевірка пари з активними нарядами (5 та 28)
        pair_ready = await interline_sync_engine.check_route_pair(db, "5", "28", min_headway_min=2.0)
        assert pair_ready["status"] == "READY_TO_SYNC", f"Expected READY_TO_SYNC, got {pair_ready['status']}"
        assert pair_ready["can_sync"] is True
        print(f"\n✅ Перевірка пари 5 & 28: Спільних зупинок: {pair_ready['shared_stops_count']}, Конфліктів: {pair_ready['conflicts_count']}")
        print(f"  Ключовий вузол: {pair_ready['primary_hub_stop']['name']}")
        print(f"  Записів у стрічці проходження: {len(pair_ready['passages'])}")

        # 3. Перевірка пари з відсутнім розкладом (1 та 7 - маршрут 1 не має розкладу)
        pair_missing = await interline_sync_engine.check_route_pair(db, "1", "7", min_headway_min=2.0)
        assert pair_missing["status"] == "MISSING_SCHEDULES", f"Expected MISSING_SCHEDULES, got {pair_missing['status']}"
        assert pair_missing["can_sync"] is False
        assert pair_missing["route_a"]["has_active_schedule"] is False
        assert pair_missing["route_b"]["has_active_schedule"] is True
        print(f"\n✅ Перевірка пари 1 & 7: Коректно заблоковано через відсутність розкладу для №1")
        print(f"  Повідомлення: {pair_missing['message']}")

        # 4. Застосування алгоритму фазового мікро-зсуву для пари 5 & 28
        sync_res = await interline_sync_engine.apply_sync_pair(db, ["5", "28"], min_headway_min=2.0)
        assert sync_res["status"] == "SUCCESS", f"Expected SUCCESS, got {sync_res['status']}"
        print(f"\n✅ Застосування фазового зсуву для 5 & 28:")
        print(f"  Усунуто скупчень: {sync_res['conflicts_resolved']}")
        print(f"  Скориговано рейсів: {sync_res['adjusted_count']}")
        print(f"  Повідомлення: {sync_res['message']}")

    print("\n" + "=" * 60)
    print("🏆 ВСІ ТЕСТИ СИНХРОНІЗАЦІЇ «ЗВ'ЯЗОК» ПРОЙДЕНО УСПІШНО!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
