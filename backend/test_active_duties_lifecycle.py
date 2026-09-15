import asyncio
from app.core.database import AsyncSessionLocal
from app.models.schedule import Schedule, ScheduleStatus
from sqlalchemy import select

async def main():
    print("=" * 60)
    print("⚡ ТЕСТУВАННЯ ЕНДПОІНТІВ «АКТИВНІ НАРЯДИ» ТА «АРХІВ» В БД ОМЕТ")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # 1. Тестування реєстру активних нарядів
        from app.api.schedules import (
            get_active_duties_registry, 
            save_schedule_as_template, 
            SaveScheduleTemplateRequest,
            get_schedule_templates,
            schedule_activation_planned,
            ScheduleActivationRequest,
            get_archive_registry
        )

        class DummyUser:
            id = 1
            badge = "12345"
            role = "ADMIN"

        user = DummyUser()

        active_list = await get_active_duties_registry(transport_type="ALL", depot_id=None, search=None, db=db, current_user=user)
        print(f"✅ Реєстр активних нарядів повернув: {len(active_list)} маршрутів")
        for r in active_list[:3]:
            print(f"  - Маршрут №{r['route_number']} ({r['transport_type']}): нарядів={r['duties_count']}, рейсів={r['total_trips']}, пробіг={r['total_wagon_km']} км, інтервал={r['headway_min']} хв")

        # 2. Тестування збереження в шаблон
        if active_list:
            first_sched_id = active_list[0]["schedule_id"]
            save_req = SaveScheduleTemplateRequest(
                name="Базовий літній робочий день (Тест)",
                description="Тестовий еталонний шаблон на базі діючого графіка"
            )
            tpl_res = await save_schedule_as_template(first_sched_id, save_req, db=db, current_user=user)
            assert tpl_res["status"] == "SUCCESS"
            print(f"\n✅ Збереження у шаблон: {tpl_res['message']} (ID: {tpl_res['template_id']})")

            # Отримання списку шаблонів
            templates = await get_schedule_templates(route_id=None, db=db, current_user=user)
            print(f"✅ Усього шаблонів у базі: {len(templates)}")

        # 3. Тестування Сценарію 1 (Планове введення в дію з завтрашньої дати)
        from datetime import date, timedelta
        tomorrow = str(date.today() + timedelta(days=1))
        # Візьмемо один з архівних розкладів маршруту 18 (наприклад ID 25)
        act_req = ScheduleActivationRequest(effective_date=tomorrow)
        act_res = await schedule_activation_planned(25, act_req, db=db, current_user=user)
        assert act_res["status"] == "SUCCESS"
        print(f"\n✅ Сценарій 1 (Планова активація): {act_res['message']}")

        # 4. Перевірка реєстру архівних розкладів
        archive_list = await get_archive_registry(transport_type="ALL", search=None, db=db, current_user=user)
        print(f"\n✅ Реєстр архівних розкладів: {len(archive_list)} версій у сховищі")

    print("\n" + "=" * 60)
    print("🏆 ВСІ ЕНДПОІНТИ АКТИВНИХ НАРЯДІВ ТА АРХІВУ ПРАЦЮЮТЬ БЕЗДОГАННО!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
