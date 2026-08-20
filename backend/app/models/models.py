# backend/app/models/models.py
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey, Time, Date
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(String, primary_key=True, index=True) # Бортовий номер (напр. "4020", "3012")
    type = Column(String, default="TRAM", nullable=True) # TRAM, TROLLEYBUS, ELECTROBUS
    model = Column(String, default="Tatra T3", nullable=True)
    status = Column(String, default="AVAILABLE") # AVAILABLE, ON_ROUTE, DETOUR, BREAK, MAINTENANCE, OFFLINE
    is_active = Column(Boolean, default=True)
    current_trip_id = Column(String, nullable=True)
    depot_id = Column(String, ForeignKey("depots.id", ondelete="SET NULL"), nullable=True)

    depot = relationship("DepotModel", back_populates="vehicles")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(String, primary_key=True, index=True) # Табельний номер
    name = Column(String, nullable=True)
    full_name = Column(String, nullable=True, default="Водій ОМЕТ")
    class_rank = Column(Integer, default=1) # Клас кваліфікації водія (1, 2, 3)
    status = Column(String, default="AVAILABLE") # AVAILABLE, WORK, BREAK, OFF
    is_active = Column(Boolean, default=True)
    current_vehicle_id = Column(String, nullable=True)

DriverModel = Driver

class Trip(Base):
    __tablename__ = "trips"
    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String)
    status = Column(String)

class IncidentLog(Base):
    __tablename__ = "incident_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(String, nullable=True)
    vehicle_id = Column(String, index=True, nullable=False)
    route_id = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="NEW", nullable=True) # NEW, IN_PROGRESS, RESOLVED
    source = Column(String, default="SYSTEM", nullable=True) # SYSTEM, DISPATCHER, DRIVER
    trip_id = Column(String, nullable=True)
    old_vehicle_id = Column(String, nullable=True)
    new_vehicle_id = Column(String, nullable=True)
    action = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=True)

class RouteModel(Base):
    __tablename__ = "routes"
    id = Column(String, primary_key=True, index=True) # Напр. "18", "7", "5", "Tr8"
    number = Column(String, nullable=True)
    name = Column(String, nullable=True) # Напр. "Куликове поле — 16-та ст. Великого Фонтану"
    type = Column(String, default="TRAM", nullable=True) # TRAM, TROLLEYBUS, ELECTROBUS
    status = Column(String, default="ACTIVE", nullable=True)
    primaryTerminalId = Column(String, nullable=True)
    secondaryTerminalId = Column(String, nullable=True)
    lengthDir1Km = Column(Float, nullable=True)
    lengthDir2Km = Column(Float, nullable=True)
    length_km = Column(Float, default=10.5, nullable=True)
    default_speed_kmh = Column(Float, default=14.5, nullable=True)
    
    # Інженерні нормативи маршруту Служби Руху
    round_trip_min = Column(Integer, default=84, nullable=True) # Повний час обороту (туди + назад + відстої)
    t_dir0_min = Column(Integer, default=36, nullable=True) # Час рейсу в прямому напрямку
    t_dir1_min = Column(Integer, default=36, nullable=True) # Час рейсу у зворотному напрямку
    layover_min = Column(Integer, default=6, nullable=True) # Нормативний відстій на кінцевій
    depot_pullout_min = Column(Integer, default=15, nullable=True) # Нульовий виїзд з депо
    depot_pullin_min = Column(Integer, default=15, nullable=True) # Нульовий заїзд у депо
    standard_break_min = Column(Integer, default=15, nullable=True) # 15 хв для трамваїв, 20 хв для тролейбусів
    designated_break_hub = Column(String, default="ДП «вул. Паустовського»", nullable=True)

    stations = Column(JSON, nullable=True)
    allStations = Column(JSON, nullable=True)
    segments = Column(JSON, nullable=True)
    activeVehiclesCount = Column(JSON, nullable=True)
    description = Column(String, nullable=True)
    color = Column(String, nullable=True)

Route = RouteModel

class DutyTypeModel(Base):
    """Довідник типів нарядів (Двозмінний, Однозмінний, Розривний, Піковий, Черговий)"""
    __tablename__ = "duty_types"

    id = Column(String, primary_key=True, index=True) # DOUBLE, SINGLE, SPLIT, PEAK, NIGHT
    name = Column(String, nullable=False) # Напр. "Двозмінний", "Однозмінний"
    code = Column(String, nullable=False) # Напр. "ДВ", "ОД", "РОЗ", "ПІК", "ЧЕР"
    description = Column(String, nullable=True)
    max_shift_hours = Column(Float, default=8.0) # Максимальна тривалість зміни водія (КЗпП)
    color = Column(String, default="#3b82f6") # Hex колір для бейджів та діаграми Ганта
    is_active = Column(Boolean, default=True)

class ControlPoint(Base):
    """Диспетчерські пункти та ключові вузли (Hubs)"""
    __tablename__ = "control_points"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False) # Напр. "Старосінна площа", "Куликове поле", "16 ст. В. Фонтану"
    is_dispatcher_hub = Column(Boolean, default=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

class RouteShape(Base):
    __tablename__ = "route_shapes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    route_id = Column(String, index=True, nullable=False)
    direction_id = Column(Integer, nullable=False) # 0 - Прямий, 1 - Зворотній
    geometry = Column(JSON, nullable=False) # [{lat: ..., lng: ...}]

class RouteStation(Base):
    __tablename__ = "route_stations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    route_id = Column(String, index=True, nullable=False)
    direction_id = Column(Integer, nullable=False) # 0 - Прямий, 1 - Зворотній
    stop_id = Column(String, index=True, nullable=False)
    stop_sequence = Column(Integer, nullable=False)

class StationModel(Base):
    __tablename__ = "stations"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String, default="STOP", nullable=True) # HUB, DEPOT, STOP
    status = Column(String, default="ACTIVE", nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    is_dispatch_station = Column(Boolean, default=False)
    break_capacity = Column(Integer, default=0) # Місткість колій відстою/обіду (вагонів)

Station = StationModel

class DepotModel(Base):
    __tablename__ = "depots"
    id = Column(String, primary_key=True, index=True) # Напр. "depot_tram_1", "depot_tram_2", "depot_trolley_1"
    name = Column(String)
    type = Column(String, default="TRAM", nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    prepTimeMin = Column(Integer, default=15, nullable=True) # Підготовчо-заключний час

    vehicles = relationship("Vehicle", back_populates="depot", cascade="all, delete-orphan", lazy="selectin")

Depot = DepotModel

class HubNodeModel(Base):
    __tablename__ = "hub_nodes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    locationDescription = Column(String)
    availableTracksCount = Column(Integer, default=2)
    minHeadwayMin = Column(Integer, default=2)
    routesConnecting = Column(JSON, nullable=True)
    channels = Column(JSON, nullable=True)

class RouteDepotConfigModel(Base):
    __tablename__ = "route_depot_configs"
    id = Column(String, primary_key=True, index=True)
    routeId = Column(String)
    primaryDepotId = Column(String)
    secondaryDepotId = Column(String, nullable=True)
    defaultOutboundTime = Column(String)
    defaultInboundTime = Column(String)

class BreakLocationConfigModel(Base):
    __tablename__ = "break_location_configs"
    id = Column(String, primary_key=True, index=True)
    routeId = Column(String)
    locationId = Column(String)
    locationName = Column(String)
    locationType = Column(String)
    maxCapacityVehicles = Column(Integer, default=2)
    durationMin = Column(Integer, default=15)

class Dispatcher(Base):
    __tablename__ = "dispatchers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="DISPATCHER", nullable=False) # SUPERUSER, PLANNER, DISPATCHER, LINE_DISPATCHER, OBSERVER
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    map_tile_url = Column(String, default="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    map_attribution = Column(String, default="&copy; OpenStreetMap contributors")
    enterprise_logo_url = Column(String, nullable=True)
    theme = Column(String, default="light")

    # Технологічні нормативи підприємства (КП «Одесміськелектротранс»)
    prep_time_tram_min = Column(Integer, default=10, nullable=False) # 10 хв огляд трамвая
    prep_time_trolleybus_min = Column(Integer, default=19, nullable=False) # 19 хв огляд тролейбуса
    lunch_window_start_hours = Column(Float, default=4.0, nullable=False) # Обід від 4-ї години
    lunch_window_end_hours = Column(Float, default=6.0, nullable=False) # Обід до 6-ї години
    interline_min_headway_min = Column(Float, default=2.0, nullable=False) # Синхронізація «Зв'язок» мін. 2 хв
    interline_max_headway_min = Column(Float, default=3.0, nullable=False) # Синхронізація «Зв'язок» макс. 3 хв
    min_intershift_rest_hours = Column(Float, default=12.0, nullable=False) # Міжзмінний відпочинок >= 12 год
    max_single_shift_hours = Column(Float, default=8.0, nullable=False) # Макс. тривалість зміни <= 8 год

class ActiveDetour(Base):
    """Журнал оперативних перемикань (об'їздів)"""
    __tablename__ = "active_detours"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(String, index=True, nullable=False)
    route_id = Column(String, nullable=False)
    reason = Column(String, nullable=False) # Причина (ДТП, обрив мережі тощо)
    target_loop = Column(String, nullable=True) # Назва розворотного кільця
    new_path_description = Column(String, nullable=False) # Опис оперативного прямування
    
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    dispatcher_id = Column(Integer, nullable=True)

class EmergencyTemplateModel(Base):
    __tablename__ = "emergency_templates"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    cause = Column(String)
    affectedRouteIds = Column(JSON)
    affectedStationIds = Column(JSON)
    detourDescription = Column(String)
    alternativeStations = Column(JSON)
    validLoops = Column(JSON, nullable=True) # Каталог фізично валідних розворотних кілець для цього шаблону

class EtaLog(Base):
    __tablename__ = "eta_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(String, index=True, nullable=False)
    route_id = Column(String, index=True, nullable=False)
    stop_id = Column(String, index=True, nullable=False)
    deviation_min = Column(Float, nullable=False, default=0.0)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), index=True)
    trip_id = Column(String, index=True, nullable=True)
    station_id = Column(String, nullable=True)
    estimated_arrival_time = Column(DateTime(timezone=True), nullable=True)
    actual_arrival_time = Column(DateTime(timezone=True), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=True)

ControlPointEtaModel = EtaLog

class Waybill(Base):
    """Електронна Путівка (Smart Waybill) на добу із прив'язкою до Статичного Наряду"""
    __tablename__ = "waybills"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, default=func.current_date, index=True, nullable=False)
    
    duty_id = Column(Integer, ForeignKey("static_duties.id", ondelete="CASCADE"), nullable=False)
    shift_sequence = Column(Integer, default=1, nullable=False) # 1 - перша зміна, 2 - друга зміна
    vehicle_id = Column(String, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False) # ID / Табельний номер
    
    status = Column(String, default="ACTIVE") # PENDING, ACTIVE, COMPLETED, CANCELLED
    dispatcher_id = Column(Integer, nullable=True)
    
    actual_start_time = Column(Time, nullable=True)
    actual_end_time = Column(Time, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now())

    # Зв'язки
    duty = relationship("StaticDuty")
    vehicle = relationship("Vehicle")
    driver = relationship("Driver")

# --- ДВОСТОРОННІЙ ЗВ'ЯЗОК ВОДІЙ <-> ДИСПЕТЧЕР ---

class DriverAlert(Base):
    """Швидкі тривожні повідомлення та сигнали від водія диспетчеру"""
    __tablename__ = "driver_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(String, index=True, nullable=False)
    driver_id = Column(String, index=True, nullable=False)
    route_id = Column(String, index=True, nullable=False)
    
    # ACCIDENT_TRACK, POWER_OUTAGE, VEHICLE_BREAKDOWN, MEDICAL_EMERGENCY, TRAFFIC_LIGHT_DELAY, CUSTOM
    alert_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="NEW", nullable=False) # NEW, SEEN, ACKNOWLEDGED, RESOLVED
    
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    dispatcher_id = Column(Integer, nullable=True)

class DispatcherDirective(Base):
    """Вказівки та накази диспетчера водію (з підтвердженням отримання)"""
    __tablename__ = "dispatcher_directives"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(String, index=True, nullable=False)
    driver_id = Column(String, index=True, nullable=True)
    route_id = Column(String, index=True, nullable=True)
    
    # DETOUR, SPEED_UP, SLOW_DOWN, HOLD_AT_STOP, DEPOT_RETURN, CUSTOM
    directive_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), index=True)
    dispatcher_id = Column(Integer, nullable=True)

# Імпорт та експорт моделей розкладів
from app.models.schedule import Schedule, StaticSchedule, StaticDuty, StaticShift, StaticTrip, StaticStopTime
