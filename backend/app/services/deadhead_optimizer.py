# backend/app/services/deadhead_optimizer.py
"""
Сервіс оптимізації нульових рейсів (Deadhead & Pull-Out Optimizer)
КП «Одесміськелектротранс».

Виконує:
1. Матричний розрахунок відстаней та тривалостей виїздів/заїздів (PULL_OUT, PULL_IN)
   між депо (ТД-1, ТД-2, ТрД-3) та всіма ключовими кінцевими станціями Одеси.
2. Автоматичний підбір оптимального депо приписки маршруту для мінімізації
   холостого кілометражу, зносу колісних пар/шин та годин зміни водія.
3. Розрахунок енергетичної та фінансової економії (кВт·год, грн, CO2).
"""

from typing import Dict, List, Any, Optional, Tuple
import math
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.models import DepotModel, RouteModel, RouteDepotConfigModel

logger = logging.getLogger("deadhead_optimizer")

# Нормативи витрат електроенергії та тариф КП «ОМЕТ» (2026 рік)
TRAM_KWH_PER_KM = 2.50       # кВт·год на 1 км нульового пробігу трамвая (Татра Т3 / К1 / Odissey)
TROLLEY_KWH_PER_KM = 1.80    # кВт·год на 1 км нульового пробігу тролейбуса (БКМ / ЗіУ / Богдан)
ELECTRICITY_TARIFF_UAH = 8.50 # грн за кВт·год
DRIVER_HOURLY_RATE_UAH = 145.0 # грн/год середня ставка водія (з нарахуваннями)

# Середні швидкості нульового слідування (без висадки/посадки пасажирів)
DEADHEAD_SPEED_TRAM_KMH = 18.5
DEADHEAD_SPEED_TROLLEY_KMH = 21.0
DEPOT_MANEUVER_TIME_MIN = 3 # Маневровий час на віялі депо та вихідній стрілці

# Географічні координати та характеристики депо
DEPOTS_DATA: Dict[str, Dict[str, Any]] = {
    "depot_1": {
        "id": "depot_1",
        "code": "TD-1",
        "name": "Трамвайне депо №1 (ім. Шевченка)",
        "type": "TRAM",
        "address": "вул. Водопровідна, 1",
        "lat": 46.4665,
        "lng": 30.7350,
        "prep_time_min": 15,
        "default_junction": "Музкомедія"
    },
    "depot_2": {
        "id": "depot_2",
        "code": "TD-2",
        "name": "Трамвайне депо №2 (Слобідка)",
        "type": "TRAM",
        "address": "вул. Академіка Воробйова, 33",
        "lat": 46.4945,
        "lng": 30.7040,
        "prep_time_min": 15,
        "default_junction": "Пересипський міст"
    },
    "depot_3": {
        "id": "depot_3",
        "code": "TrD",
        "name": "Тролейбусне депо №1",
        "type": "TROLLEYBUS",
        "address": "вул. Інглезі (25-ї Чапаєвської дивізії), 17",
        "lat": 46.4175,
        "lng": 30.7110,
        "prep_time_min": 19,
        "default_junction": "вул. Космонавтів"
    }
}

# Реєстр основних кінцевих станцій, розворотних кілець та вузлів Одеси
TERMINALS_CATALOG: Dict[str, Dict[str, Any]] = {
    "вул. Паустовського": {"name": "вул. Паустовського", "lat": 46.5925, "lng": 30.8030, "type": "TRAM", "hub": "ДП «вул. Паустовського»"},
    "завод Центроліт": {"name": "завод Центроліт", "lat": 46.6150, "lng": 30.8250, "type": "TRAM", "hub": "вул. Чорноморського козацтва"},
    "Лузанівка": {"name": "Лузанівка", "lat": 46.5490, "lng": 30.7600, "type": "TRAM", "hub": "Лузанівка"},
    "вул. Чорноморського козацтва": {"name": "вул. Чорноморського козацтва", "lat": 46.4975, "lng": 30.7190, "type": "TRAM", "hub": "Пересипський міст"},
    "Херсонський сквер": {"name": "Херсонський сквер", "lat": 46.4960, "lng": 30.7200, "type": "TRAM", "hub": "Пересипський міст"},
    "Слобідський ринок": {"name": "Слобідський ринок", "lat": 46.4910, "lng": 30.6970, "type": "TRAM", "hub": "вул. Балківська"},
    "Хаджибейський лиман": {"name": "Хаджибейський лиман", "lat": 46.5250, "lng": 30.6550, "type": "TRAM", "hub": "вул. Балтська дорога"},
    "Автовокзал": {"name": "Автовокзал", "lat": 46.4763, "lng": 30.7077, "type": "TRAM", "hub": "вул. Балківська"},
    "Станція «Аркадія»": {"name": "Станція «Аркадія»", "lat": 46.4290, "lng": 30.7650, "type": "TRAM", "hub": "Музкомедія"},
    "Куликове поле": {"name": "Куликове поле", "lat": 46.4635, "lng": 30.7420, "type": "TRAM", "hub": "Куликове поле"},
    "пл. Старосінна": {"name": "пл. Старосінна", "lat": 46.4670, "lng": 30.7380, "type": "TRAM", "hub": "пл. Старосінна"},
    "пл. Тираспольська": {"name": "пл. Тираспольська", "lat": 46.4810, "lng": 30.7310, "type": "TRAM", "hub": "вул. Преображенська"},
    "пл. Олексіївська": {"name": "пл. Олексіївська", "lat": 46.4690, "lng": 30.7170, "type": "TRAM", "hub": "вул. Олексіївська"},
    "вул. Пастера": {"name": "вул. Пастера", "lat": 46.4930, "lng": 30.7240, "type": "TRAM", "hub": "вул. Пастера"},
    "Парк ім. Тараса Шевченка": {"name": "Парк ім. Тараса Шевченка", "lat": 46.4820, "lng": 30.7550, "type": "BOTH", "hub": "Музкомедія"},
    "11-а ст. Великого Фонтану": {"name": "11-а ст. Великого Фонтану", "lat": 46.4110, "lng": 30.7580, "type": "TRAM", "hub": "1-ша ст. Люстдорфської дороги"},
    "16-та ст. Великого Фонтану": {"name": "16-та ст. Великого Фонтану", "lat": 46.3880, "lng": 30.7510, "type": "TRAM", "hub": "1-ша ст. Люстдорфської дороги"},
    "11-а ст. Люстдорфської дороги": {"name": "11-а ст. Люстдорфської дороги", "lat": 46.3825, "lng": 30.7144, "type": "TRAM", "hub": "1-ша ст. Люстдорфської дороги"},
    "16 ст. Люстдорфської дороги": {"name": "16 ст. Люстдорфської дороги", "lat": 46.3583, "lng": 30.7017, "type": "TRAM", "hub": "11-а ст. Люстдорфської дороги"},
    "селище Люстдорф": {"name": "селище Люстдорф", "lat": 46.3503, "lng": 30.7012, "type": "TRAM", "hub": "Люстдорф"},
    "Переправа": {"name": "Переправа", "lat": 46.3350, "lng": 30.6950, "type": "TRAM", "hub": "Переправа"},
    "вул. Іцхака Рабіна": {"name": "вул. Іцхака Рабіна", "lat": 46.4380, "lng": 30.6920, "type": "TRAM", "hub": "1-ша ст. Люстдорфської дороги"},
    "ж/м Шкільний": {"name": "ж/м Шкільний", "lat": 46.4080, "lng": 30.7050, "type": "TRAM", "hub": "вул. Космонавтів"},
    "станція Застава ІІ": {"name": "станція Застава ІІ", "lat": 46.4680, "lng": 30.6850, "type": "TRAM", "hub": "вул. Балківська"},
    # Тролейбусні кінцеві
    "станція Застава I": {"name": "станція Застава I", "lat": 46.4680, "lng": 30.6850, "type": "TROLLEYBUS", "hub": "станція Застава I"},
    "вул. Архітекторська": {"name": "вул. Архітекторська", "lat": 46.3890, "lng": 30.7150, "type": "TROLLEYBUS", "hub": "пл. Незалежності"},
    "вул. Новосельського": {"name": "вул. Новосельського", "lat": 46.4850, "lng": 30.7280, "type": "TROLLEYBUS", "hub": "Тираспольська площа"},
    "Суперфосфатний завод": {"name": "Суперфосфатний завод", "lat": 46.4520, "lng": 30.6680, "type": "TROLLEYBUS", "hub": "Залізничний вокзал"},
    "вул. Інглезі": {"name": "вул. Інглезі", "lat": 46.4175, "lng": 30.7110, "type": "TROLLEYBUS", "hub": "вул. Космонавтів"},
    "вул. Рішельєвська": {"name": "вул. Рішельєвська", "lat": 46.4830, "lng": 30.7410, "type": "TROLLEYBUS", "hub": "вул. Пушкінська"},
    "вул. Приморська": {"name": "вул. Приморська", "lat": 46.4940, "lng": 30.7350, "type": "TROLLEYBUS", "hub": "Пересипський міст"},
    "вул. Центральний Аеропорт": {"name": "вул. Центральний Аеропорт", "lat": 46.4320, "lng": 30.6780, "type": "TROLLEYBUS", "hub": "вул. Святослава Ріхтера"},
    "Залізничний вокзал": {"name": "Залізничний вокзал", "lat": 46.4680, "lng": 30.7410, "type": "BOTH", "hub": "Привокзальна площа"}
}

# Точна фізична топологічна таблиця нульових рейсів (км, хвилини, коридор виїзду)
TOPOLOGICAL_OVERRIDE_MATRIX: Dict[Tuple[str, str], Dict[str, Any]] = {
    # ТД-1 (Водопровідна) до трамвайних вузлів
    ("depot_1", "Станція «Аркадія»"): {"distance_km": 5.2, "duration_min": 19, "junction": "Музкомедія", "path": "Водопровідна -> Пантелеймонівська -> Леонтовича -> Французький бульвар"},
    ("depot_1", "Куликове поле"): {"distance_km": 1.8, "duration_min": 8, "junction": "Куликове поле", "path": "Водопровідна -> Старосінна -> Куликове поле"},
    ("depot_1", "пл. Старосінна"): {"distance_km": 0.8, "duration_min": 5, "junction": "пл. Старосінна", "path": "Водопровідна -> Старосінна"},
    ("depot_1", "Автовокзал"): {"distance_km": 3.2, "duration_min": 12, "junction": "пл. Старосінна", "path": "Водопровідна -> Старосінна -> Колонтаївська"},
    ("depot_1", "вул. Пастера"): {"distance_km": 4.0, "duration_min": 14, "junction": "Тираспольська площа", "path": "Водопровідна -> Преображенська -> Пастера"},
    ("depot_1", "Парк ім. Тараса Шевченка"): {"distance_km": 3.5, "duration_min": 12, "junction": "Музкомедія", "path": "Водопровідна -> Пантелеймонівська -> Бєлінського"},
    ("depot_1", "11-а ст. Великого Фонтану"): {"distance_km": 6.5, "duration_min": 21, "junction": "1-ша ст. Люстдорфської дороги", "path": "Водопровідна -> Фонтанська дорога"},
    ("depot_1", "16-та ст. Великого Фонтану"): {"distance_km": 9.8, "duration_min": 31, "junction": "1-ша ст. Люстдорфської дороги", "path": "Водопровідна -> Фонтанська дорога"},
    ("depot_1", "11-а ст. Люстдорфської дороги"): {"distance_km": 8.5, "duration_min": 26, "junction": "1-ша ст. Люстдорфської дороги", "path": "Водопровідна -> Люстдорфська дорога"},
    ("depot_1", "16 ст. Люстдорфської дороги"): {"distance_km": 13.2, "duration_min": 39, "junction": "11-а ст. Люстдорфської дороги", "path": "Люстдорфська дорога"},
    ("depot_1", "селище Люстдорф"): {"distance_km": 14.8, "duration_min": 43, "junction": "Люстдорф", "path": "Водопровідна -> Люстдорфська дорога"},
    ("depot_1", "Переправа"): {"distance_km": 16.5, "duration_min": 48, "junction": "Переправа", "path": "Люстдорфська дорога -> Переправа"},
    ("depot_1", "вул. Іцхака Рабіна"): {"distance_km": 5.4, "duration_min": 17, "junction": "1-ша ст. Люстдорфської дороги", "path": "Водопровідна -> Філатова -> Рабіна"},
    ("depot_1", "ж/м Шкільний"): {"distance_km": 7.6, "duration_min": 23, "junction": "вул. Космонавтів", "path": "Водопровідна -> Люстдорфська дорога -> Шкільний"},
    ("depot_1", "пл. Тираспольська"): {"distance_km": 3.0, "duration_min": 11, "junction": "пл. Тираспольська", "path": "Водопровідна -> Преображенська"},
    ("depot_1", "пл. Олексіївська"): {"distance_km": 2.1, "duration_min": 9, "junction": "вул. Олексіївська", "path": "Водопровідна -> Степова"},
    ("depot_1", "станція Застава ІІ"): {"distance_km": 4.2, "duration_min": 14, "junction": "вул. Балківська", "path": "Водопровідна -> Колонтаївська -> Застава"},
    ("depot_1", "Херсонський сквер"): {"distance_km": 5.8, "duration_min": 19, "junction": "Пересипський міст", "path": "Водопровідна -> Преображенська -> Софіївська"},
    ("depot_1", "вул. Чорноморського козацтва"): {"distance_km": 6.2, "duration_min": 20, "junction": "Пересипський міст", "path": "Водопровідна -> Софіївська -> Пересипський міст"},
    ("depot_1", "Лузанівка"): {"distance_km": 11.8, "duration_min": 35, "junction": "Пересипський міст", "path": "Водопровідна -> Пересип -> Миколаївська дорога"},
    ("depot_1", "вул. Паустовського"): {"distance_km": 18.5, "duration_min": 54, "junction": "Пересипський міст", "path": "Водопровідна -> Пересип -> Добровольського"},
    ("depot_1", "завод Центроліт"): {"distance_km": 18.8, "duration_min": 55, "junction": "Пересипський міст", "path": "Водопровідна -> Пересип -> Центроліт"},
    ("depot_1", "Слобідський ринок"): {"distance_km": 6.5, "duration_min": 21, "junction": "вул. Балківська", "path": "Водопровідна -> Балківська -> Слобідка"},
    ("depot_1", "Хаджибейський лиман"): {"distance_km": 9.8, "duration_min": 30, "junction": "вул. Балтська дорога", "path": "Водопровідна -> Пересип -> Балтська дорога"},
    ("depot_1", "Залізничний вокзал"): {"distance_km": 1.2, "duration_min": 6, "junction": "Привокзальна площа", "path": "Водопровідна -> Старосінна площа"},

    # ТД-2 (Слобідка) до трамвайних вузлів
    ("depot_2", "Слобідський ринок"): {"distance_km": 1.2, "duration_min": 5, "junction": "Слобідський ринок", "path": "Воробйова -> Градоначальницька"},
    ("depot_2", "Херсонський сквер"): {"distance_km": 3.8, "duration_min": 13, "junction": "Пересипський міст", "path": "Воробйова -> Балківська -> Херсонський сквер"},
    ("depot_2", "вул. Чорноморського козацтва"): {"distance_km": 4.0, "duration_min": 14, "junction": "Пересипський міст", "path": "Воробйова -> Ольгіївський узвіз -> Пересипський міст"},
    ("depot_2", "Лузанівка"): {"distance_km": 9.5, "duration_min": 28, "junction": "Пересипський міст", "path": "Воробйова -> Пересипський міст -> Миколаївська дорога"},
    ("depot_2", "вул. Паустовського"): {"distance_km": 14.2, "duration_min": 42, "junction": "Пересипський міст", "path": "Воробйова -> Пересипський міст -> Добровольського"},
    ("depot_2", "завод Центроліт"): {"distance_km": 16.5, "duration_min": 48, "junction": "Пересипський міст", "path": "Воробйова -> Пересипський міст -> Чорноморського козацтва"},
    ("depot_2", "Хаджибейський лиман"): {"distance_km": 5.2, "duration_min": 17, "junction": "вул. Балтська дорога", "path": "Воробйова -> Балківська -> Балтська дорога"},
    ("depot_2", "вул. Пастера"): {"distance_km": 3.8, "duration_min": 13, "junction": "вул. Пастера", "path": "Воробйова -> Ольгіївська -> Пастера"},
    ("depot_2", "пл. Тираспольська"): {"distance_km": 4.8, "duration_min": 16, "junction": "Тираспольська площа", "path": "Воробйова -> Нежинська -> Тираспольська"},
    ("depot_2", "пл. Олексіївська"): {"distance_km": 3.8, "duration_min": 13, "junction": "вул. Олексіївська", "path": "Воробйова -> Балківська -> Олексіївська"},
    ("depot_2", "Автовокзал"): {"distance_km": 3.5, "duration_min": 13, "junction": "вул. Балківська", "path": "Воробйова -> Балківська -> Автовокзал"},
    ("depot_2", "Станція «Аркадія»"): {"distance_km": 8.4, "duration_min": 28, "junction": "Музкомедія", "path": "Воробйова -> Преображенська -> Французький б-р"},
    ("depot_2", "Куликове поле"): {"distance_km": 6.2, "duration_min": 20, "junction": "Куликове поле", "path": "Воробйова -> Тираспольська -> Куликове поле"},
    ("depot_2", "пл. Старосінна"): {"distance_km": 5.4, "duration_min": 18, "junction": "пл. Старосінна", "path": "Воробйова -> Колонтаївська -> Старосінна"},
    ("depot_2", "станція Застава ІІ"): {"distance_km": 4.5, "duration_min": 15, "junction": "вул. Балківська", "path": "Воробйова -> Балківська -> Застава ІІ"},
    ("depot_2", "Парк ім. Тараса Шевченка"): {"distance_km": 6.8, "duration_min": 22, "junction": "Музкомедія", "path": "Воробйова -> Преображенська -> Бєлінського"},
    ("depot_2", "11-а ст. Великого Фонтану"): {"distance_km": 11.5, "duration_min": 35, "junction": "1-ша ст. Люстдорфської дороги", "path": "Воробйова -> Водопровідна -> Фонтан"},
    ("depot_2", "16-та ст. Великого Фонтану"): {"distance_km": 14.8, "duration_min": 44, "junction": "1-ша ст. Люстдорфської дороги", "path": "Воробйова -> Водопровідна -> 16 ст. Фонтану"},
    ("depot_2", "11-а ст. Люстдорфської дороги"): {"distance_km": 13.8, "duration_min": 41, "junction": "1-ша ст. Люстдорфської дороги", "path": "Воробйова -> Водопровідна -> Люстдорфська дорога"},
    ("depot_2", "16 ст. Люстдорфської дороги"): {"distance_km": 18.2, "duration_min": 53, "junction": "11-а ст. Люстдорфської дороги", "path": "Воробйова -> Люстдорфська дорога"},
    ("depot_2", "селище Люстдорф"): {"distance_km": 19.5, "duration_min": 57, "junction": "Люстдорф", "path": "Воробйова -> Люстдорфська дорога"},
    ("depot_2", "Переправа"): {"distance_km": 21.5, "duration_min": 62, "junction": "Переправа", "path": "Воробйова -> Переправа"},
    ("depot_2", "вул. Іцхака Рабіна"): {"distance_km": 8.9, "duration_min": 27, "junction": "1-ша ст. Люстдорфської дороги", "path": "Воробйова -> Балківська -> Рабіна"},
    ("depot_2", "ж/м Шкільний"): {"distance_km": 12.2, "duration_min": 37, "junction": "вул. Космонавтів", "path": "Воробйова -> Люстдорфська -> Шкільний"},
    ("depot_2", "Залізничний вокзал"): {"distance_km": 5.8, "duration_min": 19, "junction": "Привокзальна площа", "path": "Воробйова -> Пантелеймонівська -> Вокзал"},

    # ТрД (Інглезі) до тролейбусних вузлів
    ("depot_3", "вул. Інглезі"): {"distance_km": 1.2, "duration_min": 5, "junction": "вул. Космонавтів", "path": "Інглезі -> Космонавтів"},
    ("depot_3", "вул. Архітекторська"): {"distance_km": 4.8, "duration_min": 15, "junction": "пл. Незалежності", "path": "Інглезі -> Корольова -> Архітекторська"},
    ("depot_3", "вул. Центральний Аеропорт"): {"distance_km": 4.2, "duration_min": 13, "junction": "вул. Святослава Ріхтера", "path": "Інглезі -> Радісна -> Аеропорт"},
    ("depot_3", "станція Застава I"): {"distance_km": 5.2, "duration_min": 16, "junction": "вул. Стовпова", "path": "Інглезі -> Мельницька -> Стовпова"},
    ("depot_3", "Суперфосфатний завод"): {"distance_km": 7.2, "duration_min": 21, "junction": "Залізничний вокзал", "path": "Інглезі -> Дальницька -> Хімічна"},
    ("depot_3", "Залізничний вокзал"): {"distance_km": 6.5, "duration_min": 19, "junction": "Привокзальна площа", "path": "Інглезі -> Краснова -> Середньофонтанська"},
    ("depot_3", "вул. Рішельєвська"): {"distance_km": 7.1, "duration_min": 21, "junction": "вул. Пушкінська", "path": "Інглезі -> Краснова -> Рішельєвська"},
    ("depot_3", "вул. Новосельського"): {"distance_km": 8.2, "duration_min": 24, "junction": "Тираспольська площа", "path": "Інглезі -> Краснова -> Новосельського"},
    ("depot_3", "Парк ім. Тараса Шевченка"): {"distance_km": 7.8, "duration_min": 23, "junction": "Музкомедія", "path": "Інглезі -> Шевченка -> Маразліївська"},
    ("depot_3", "вул. Приморська"): {"distance_km": 9.5, "duration_min": 27, "junction": "Пересипський міст", "path": "Інглезі -> Центр -> Приморська"}
}

def calculate_haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Розрахунок прямолінійної відстані між двома точками за формулою гаверсинусів."""
    R = 6371.0 # Радіус Землі в км
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def get_deadhead_between(depot_id: str, terminal_name: str, transport_type: str) -> Dict[str, Any]:
    """
    Повертає точні параметри нульового рейсу (км, хвилини, коридор, вузол примикання)
    між депо та вказаною кінцевою зупинкою.
    """
    # 1. Шукаємо точний запис у топологічній матриці
    override_key = (depot_id, terminal_name)
    if override_key in TOPOLOGICAL_OVERRIDE_MATRIX:
        item = TOPOLOGICAL_OVERRIDE_MATRIX[override_key]
        return {
            "depot_id": depot_id,
            "terminal_name": terminal_name,
            "distance_km": item["distance_km"],
            "duration_min": item["duration_min"],
            "junction_stop": item["junction"],
            "path_description": item["path"],
            "is_exact_topological": True
        }

    # Спроба знайти за частковим збігом назви кінцевої
    for (d_id, t_name), item in TOPOLOGICAL_OVERRIDE_MATRIX.items():
        if d_id == depot_id and (terminal_name in t_name or t_name in terminal_name):
            return {
                "depot_id": depot_id,
                "terminal_name": terminal_name,
                "distance_km": item["distance_km"],
                "duration_min": item["duration_min"],
                "junction_stop": item["junction"],
                "path_description": item["path"],
                "is_exact_topological": True
            }

    # 2. Якщо точного запису немає — математична модель на основі геокоординат + коефіцієнта звивистості
    depot_info = DEPOTS_DATA.get(depot_id)
    term_info = TERMINALS_CATALOG.get(terminal_name)

    if not depot_info:
        return {
            "depot_id": depot_id,
            "terminal_name": terminal_name,
            "distance_km": 5.0,
            "duration_min": 18,
            "junction_stop": "Куликове поле",
            "path_description": "Стандартний нульовий коридор",
            "is_exact_topological": False
        }

    if term_info:
        raw_dist = calculate_haversine_km(depot_info["lat"], depot_info["lng"], term_info["lat"], term_info["lng"])
    else:
        raw_dist = 4.0 # Запасне значення якщо координати станції не зареєстровані

    is_trolley = (transport_type.upper() in ["TROLLEYBUS", "TROLLEY", "ТРОЛЕЙБУС"] or depot_id == "depot_3")
    winding_factor = 1.25 if is_trolley else 1.32
    speed_kmh = DEADHEAD_SPEED_TROLLEY_KMH if is_trolley else DEADHEAD_SPEED_TRAM_KMH

    distance_km = round(raw_dist * winding_factor, 1)
    duration_min = round(DEPOT_MANEUVER_TIME_MIN + (distance_km / speed_kmh) * 60)
    default_junction = depot_info.get("default_junction", "Привокзальна площа")

    return {
        "depot_id": depot_id,
        "terminal_name": terminal_name,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "junction_stop": default_junction,
        "path_description": f"Магістральний коридор від {depot_info['code']} до {terminal_name}",
        "is_exact_topological": False
    }

def extract_terminals_from_route(route: RouteModel) -> Tuple[str, str]:
    """Визначає кінцеву А та кінцеву Б з назви маршруту або наявних полів."""
    if route.name and " — " in route.name:
        parts = route.name.split(" — ")
        return parts[0].strip(), parts[1].strip()
    if route.name and " - " in route.name:
        parts = route.name.split(" - ")
        return parts[0].strip(), parts[1].strip()
    return "Станція А", "Станція Б"

class DeadheadOptimizer:
    """
    Математичний рушій оптимізації депо та нульових рейсів.
    """

    @staticmethod
    def get_full_matrix() -> Dict[str, Any]:
        """Повертає повну матрицю відстаней та часу між 3 депо та всіма кінцевими."""
        matrix_records = []
        for depot_id, d_info in DEPOTS_DATA.items():
            for t_name, t_info in TERMINALS_CATALOG.items():
                # Пропускаємо несумісні пари (наприклад трамвайні кінцеві для тролейбусного депо, крім BOTH)
                if d_info["type"] == "TRAM" and t_info["type"] == "TROLLEYBUS":
                    continue
                if d_info["type"] == "TROLLEYBUS" and t_info["type"] == "TRAM":
                    continue

                dh = get_deadhead_between(depot_id, t_name, d_info["type"])
                matrix_records.append({
                    "depot_id": depot_id,
                    "depot_name": d_info["name"],
                    "depot_code": d_info["code"],
                    "terminal_name": t_name,
                    "terminal_type": t_info["type"],
                    "distance_km": dh["distance_km"],
                    "duration_min": dh["duration_min"],
                    "junction_stop": dh["junction_stop"],
                    "path_description": dh["path_description"]
                })

        return {
            "depots": list(DEPOTS_DATA.values()),
            "terminals_count": len(TERMINALS_CATALOG),
            "records_count": len(matrix_records),
            "matrix": matrix_records,
            "tariffs": {
                "tram_kwh_per_km": TRAM_KWH_PER_KM,
                "trolley_kwh_per_km": TROLLEY_KWH_PER_KM,
                "electricity_tariff_uah": ELECTRICITY_TARIFF_UAH,
                "driver_hourly_rate_uah": DRIVER_HOURLY_RATE_UAH
            }
        }

    @staticmethod
    async def evaluate_network(db: AsyncSession) -> Dict[str, Any]:
        """
        Аналізує всі активні маршрути в БД, оцінює їхній поточний стан нульових рейсів,
        знаходить глобально оптимальне закріплення за депо та розраховує системну економію.
        """
        result = await db.execute(select(RouteModel).order_by(RouteModel.type, RouteModel.number))
        routes: List[RouteModel] = result.scalars().all()

        route_evaluations = []
        total_current_daily_km = 0.0
        total_optimal_daily_km = 0.0
        total_current_daily_min = 0
        total_optimal_daily_min = 0

        total_kwh_saved_daily = 0.0
        total_cost_saved_daily = 0.0

        for r in routes:
            t_type = r.type or "TRAM"
            is_trolley = t_type.upper() in ["TROLLEYBUS", "TROLLEY", "ТРОЛЕЙБУС"]
            term_a, term_b = extract_terminals_from_route(r)

            # Оцінка кількості випусків (нарядів)
            # Якщо задано activeVehiclesCount або розклад, беремо його, або евристично 6-12 нарядів
            duties_count = 8
            if r.activeVehiclesCount and isinstance(r.activeVehiclesCount, int) and r.activeVehiclesCount > 0:
                duties_count = r.activeVehiclesCount
            elif r.number in ["7", "18", "5", "3", "Tr7", "Tr8"]:
                duties_count = 12
            elif r.number in ["1", "10", "13", "28", "Tr9", "Tr10"]:
                duties_count = 8
            else:
                duties_count = 5

            candidate_depots = ["depot_3"] if is_trolley else ["depot_1", "depot_2"]
            current_depot_id = r.primary_depot_id if r.primary_depot_id in candidate_depots else candidate_depots[0]

            depot_variants = []
            for d_id in candidate_depots:
                pull_out = get_deadhead_between(d_id, term_a, t_type)
                pull_in = get_deadhead_between(d_id, term_b, t_type)

                total_run_km = round(pull_out["distance_km"] + pull_in["distance_km"], 2)
                total_run_min = pull_out["duration_min"] + pull_in["duration_min"]

                # Добовий нульовий пробіг для даного депо
                daily_km = round(total_run_km * duties_count, 1)
                daily_min = total_run_min * duties_count

                depot_variants.append({
                    "depot_id": d_id,
                    "depot_code": DEPOTS_DATA[d_id]["code"],
                    "depot_name": DEPOTS_DATA[d_id]["name"],
                    "pull_out_km": pull_out["distance_km"],
                    "pull_out_min": pull_out["duration_min"],
                    "pull_out_junction": pull_out["junction_stop"],
                    "pull_out_path": pull_out["path_description"],
                    "pull_in_km": pull_in["distance_km"],
                    "pull_in_min": pull_in["duration_min"],
                    "pull_in_junction": pull_in["junction_stop"],
                    "pull_in_path": pull_in["path_description"],
                    "total_per_duty_km": total_run_km,
                    "total_per_duty_min": total_run_min,
                    "daily_km": daily_km,
                    "daily_min": daily_min
                })

            # Визначаємо найкраще депо за мінімумом щоденного нульового пробігу
            best_variant = min(depot_variants, key=lambda v: (v["daily_km"], v["daily_min"]))
            current_variant = next((v for v in depot_variants if v["depot_id"] == current_depot_id), best_variant)

            delta_km = round(current_variant["daily_km"] - best_variant["daily_km"], 1)
            delta_min = current_variant["daily_min"] - best_variant["daily_min"]

            total_current_daily_km += current_variant["daily_km"]
            total_optimal_daily_km += best_variant["daily_km"]
            total_current_daily_min += current_variant["daily_min"]
            total_optimal_daily_min += best_variant["daily_min"]

            # Розрахунок зекономленої енергії для маршруту
            kwh_rate = TROLLEY_KWH_PER_KM if is_trolley else TRAM_KWH_PER_KM
            route_kwh_saved = round(delta_km * kwh_rate, 1)
            route_cost_saved = round(route_kwh_saved * ELECTRICITY_TARIFF_UAH + (delta_min / 60.0) * DRIVER_HOURLY_RATE_UAH, 2)

            total_kwh_saved_daily += route_kwh_saved
            total_cost_saved_daily += route_cost_saved

            route_evaluations.append({
                "route_id": r.id,
                "route_number": r.number,
                "route_name": r.name,
                "transport_type": t_type,
                "duties_count": duties_count,
                "terminals": {"terminal_a": term_a, "terminal_b": term_b},
                "current_depot": {
                    "id": current_depot_id,
                    "code": DEPOTS_DATA[current_depot_id]["code"],
                    "name": DEPOTS_DATA[current_depot_id]["name"],
                    "pull_out_min": current_variant["pull_out_min"],
                    "pull_in_min": current_variant["pull_in_min"],
                    "daily_km": current_variant["daily_km"],
                    "daily_min": current_variant["daily_min"]
                },
                "optimal_depot": {
                    "id": best_variant["depot_id"],
                    "code": best_variant["depot_code"],
                    "name": best_variant["depot_name"],
                    "pull_out_km": best_variant["pull_out_km"],
                    "pull_out_min": best_variant["pull_out_min"],
                    "pull_out_junction": best_variant["pull_out_junction"],
                    "pull_out_path": best_variant["pull_out_path"],
                    "pull_in_km": best_variant["pull_in_km"],
                    "pull_in_min": best_variant["pull_in_min"],
                    "pull_in_junction": best_variant["pull_in_junction"],
                    "pull_in_path": best_variant["pull_in_path"],
                    "daily_km": best_variant["daily_km"],
                    "daily_min": best_variant["daily_min"]
                },
                "is_already_optimal": (current_depot_id == best_variant["depot_id"]),
                "savings": {
                    "delta_km_daily": delta_km,
                    "delta_min_daily": delta_min,
                    "kwh_saved_daily": route_kwh_saved,
                    "cost_saved_uah_daily": route_cost_saved
                },
                "variants": depot_variants
            })

        daily_km_saved = round(total_current_daily_km - total_optimal_daily_km, 1)
        daily_hours_saved = round((total_current_daily_min - total_optimal_daily_min) / 60.0, 1)
        annual_cost_saved = round(total_cost_saved_daily * 365, 0)
        co2_tons_saved_annual = round(total_kwh_saved_daily * 365 * 0.00045, 1) # ~450g CO2 на кВт·год у мережі

        return {
            "summary": {
                "total_routes_analyzed": len(routes),
                "suboptimal_routes_count": sum(1 for re in route_evaluations if not re["is_already_optimal"]),
                "current_total_daily_km": round(total_current_daily_km, 1),
                "optimal_total_daily_km": round(total_optimal_daily_km, 1),
                "daily_km_saved": daily_km_saved,
                "daily_hours_saved": daily_hours_saved,
                "daily_kwh_saved": round(total_kwh_saved_daily, 1),
                "daily_cost_saved_uah": round(total_cost_saved_daily, 2),
                "annual_cost_saved_uah": annual_cost_saved,
                "annual_co2_tons_saved": co2_tons_saved_annual
            },
            "routes": route_evaluations
        }

    @staticmethod
    async def apply_optimal_assignments(db: AsyncSession) -> Dict[str, Any]:
        """
        Застосовує оптимальні параметри приписки депо та точні нульові рейси (хвилини, км, вузли)
        до таблиці `routes` та створює/оновлює конфігурації у `route_depot_configs`.
        """
        eval_result = await DeadheadOptimizer.evaluate_network(db)
        routes_data = eval_result["routes"]

        applied_count = 0
        updated_routes = []

        for r_item in routes_data:
            r_id = r_item["route_id"]
            opt = r_item["optimal_depot"]

            # 1. Оновлюємо RouteModel
            await db.execute(
                update(RouteModel)
                .where(RouteModel.id == r_id)
                .values(
                    primary_depot_id=opt["id"],
                    depot_pullout_min=opt["pull_out_min"],
                    depot_pullin_min=opt["pull_in_min"],
                    depot_junction_stop_id=opt["pull_out_junction"]
                )
            )

            # 2. Оновлюємо або створюємо RouteDepotConfigModel
            cfg_id = f"cfg_{r_id}"
            res_cfg = await db.execute(select(RouteDepotConfigModel).where(RouteDepotConfigModel.id == cfg_id))
            existing_cfg = res_cfg.scalar_one_or_none()

            avg_dist = round((opt["pull_out_km"] + opt["pull_in_km"]) / 2.0, 1)
            avg_time = round((opt["pull_out_min"] + opt["pull_in_min"]) / 2)
            path_desc = f"Виїзд: {opt['pull_out_path']} | Заїзд: {opt['pull_in_path']}"

            if existing_cfg:
                existing_cfg.primaryDepotId = opt["id"]
                existing_cfg.distanceKm = avg_dist
                existing_cfg.travelTimeMin = avg_time
                existing_cfg.pathDescription = path_desc
            else:
                new_cfg = RouteDepotConfigModel(
                    id=cfg_id,
                    routeId=r_id,
                    primaryDepotId=opt["id"],
                    distanceKm=avg_dist,
                    travelTimeMin=avg_time,
                    pathDescription=path_desc
                )
                db.add(new_cfg)

            applied_count += 1
            updated_routes.append({
                "route_id": r_id,
                "number": r_item["route_number"],
                "optimal_depot": opt["code"],
                "pull_out_min": opt["pull_out_min"],
                "pull_in_min": opt["pull_in_min"],
                "junction": opt["pull_out_junction"]
            })

        await db.commit()
        logger.info(f"✅ Оптимізацію нульових рейсів успішно застосовано до {applied_count} маршрутів")

        return {
            "status": "SUCCESS",
            "applied_count": applied_count,
            "updated_routes": updated_routes,
            "savings_summary": eval_result["summary"]
        }
