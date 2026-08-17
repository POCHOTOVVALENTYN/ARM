# backend/app/models/models.py
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(String, primary_key=True, index=True)
    type = Column(String, default="TRAM", nullable=True)
    model = Column(String, default="Tatra T3", nullable=True)
    status = Column(String, default="AVAILABLE")
    is_active = Column(Boolean, default=True)
    current_trip_id = Column(String, nullable=True)
    depot_id = Column(String, ForeignKey("depots.id", ondelete="SET NULL"), nullable=True)

    depot = relationship("DepotModel", back_populates="vehicles")

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
    status = Column(String, default="NEW", nullable=True)
    source = Column(String, default="SYSTEM", nullable=True)
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
    id = Column(String, primary_key=True, index=True)
    number = Column(String)
    name = Column(String)
    type = Column(String)
    status = Column(String)
    primaryTerminalId = Column(String)
    secondaryTerminalId = Column(String)
    lengthDir1Km = Column(Float)
    lengthDir2Km = Column(Float)
    stations = Column(JSON)
    allStations = Column(JSON)
    segments = Column(JSON)
    activeVehiclesCount = Column(JSON)
    description = Column(String)
    color = Column(String, nullable=True)

class VehicleBlockModel(Base):
    __tablename__ = "vehicle_blocks"
    id = Column(String, primary_key=True, index=True)
    route_id = Column(String)
    vehicle_id = Column(String)
    status = Column(String)
    trips = Column(JSON)
    start_time = Column(Integer)
    end_time = Column(Integer)
    is_completed = Column(Boolean, default=False)
    
from sqlalchemy import Date

class DriverDuty(Base):
    __tablename__ = "driver_duties"
    id = Column(String, primary_key=True, index=True)
    duty_id = Column(Integer, nullable=True)
    block_id = Column(String, nullable=True)
    driver_id = Column(String, nullable=True)
    vehicle_id = Column(String, nullable=True)
    target_date = Column(Date, nullable=True)
    dispatcher_id = Column(Integer, nullable=True)
    start_time = Column(Integer, nullable=True)
    end_time = Column(Integer, nullable=True)
    status = Column(String, default="ASSIGNED")
    breaks = Column(JSON, nullable=True)

DriverDutyModel = DriverDuty

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    full_name = Column(String, nullable=True, default="Водій ОМЕТ")
    class_rank = Column(Integer, default=1)
    status = Column(String, default="AVAILABLE")  # 'AVAILABLE', 'WORK', 'BREAK', 'OFF'
    is_active = Column(Boolean, default=True)
    current_vehicle_id = Column(String, nullable=True)

DriverModel = Driver

class StationModel(Base):
    __tablename__ = "stations"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)  # 'HUB', 'DEPOT', 'STOP'
    status = Column(String)  # 'ACTIVE', 'OFFLINE', 'MAINTENANCE'
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    is_dispatch_station = Column(Boolean, default=False)
    break_capacity = Column(Integer, default=0)

class EtaLog(Base):
    __tablename__ = "eta_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(String, index=True, nullable=False)
    route_id = Column(String, index=True, nullable=False)
    stop_id = Column(String, index=True, nullable=False)
    deviation_min = Column(Float, nullable=False, default=0.0)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), index=True)
    
    # Сумісність із ControlPointEtaModel
    trip_id = Column(String, index=True, nullable=True)
    station_id = Column(String, nullable=True)
    estimated_arrival_time = Column(DateTime(timezone=True), nullable=True)
    actual_arrival_time = Column(DateTime(timezone=True), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now(), nullable=True)

ControlPointEtaModel = EtaLog

class EmergencyTemplateModel(Base):
    __tablename__ = "emergency_templates"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    cause = Column(String)
    affectedRouteIds = Column(JSON)
    affectedStationIds = Column(JSON)
    detourDescription = Column(String)
    alternativeStations = Column(JSON)

class HubNodeModel(Base):
    __tablename__ = "hub_nodes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    locationDescription = Column(String)
    availableTracksCount = Column(Integer)
    minHeadwayMin = Column(Integer)
    routesConnecting = Column(JSON)
    channels = Column(JSON)

class DepotModel(Base):
    __tablename__ = "depots"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String, default="TRAM", nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    prepTimeMin = Column(Integer, default=15, nullable=True)

    vehicles = relationship("Vehicle", back_populates="depot", cascade="all, delete-orphan", lazy="selectin")

Depot = DepotModel

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
    maxCapacityVehicles = Column(Integer)
    durationMin = Column(Integer)

class Dispatcher(Base):
    __tablename__ = "dispatchers"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)  # ПІБ для аудит-логів
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False) # Для керування доступами

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    map_tile_url = Column(String, default="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    map_attribution = Column(String, default="&copy; OpenStreetMap contributors")
    enterprise_logo_url = Column(String, nullable=True)
    theme = Column(String, default="light")

class ActiveDetour(Base):
    """Журнал оперативних перемикань (об'їздів)"""
    __tablename__ = "active_detours"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(String, index=True, nullable=False)
    route_id = Column(String, nullable=False)
    reason = Column(String, nullable=False)  # Причина (ДТП, обрив мережі тощо)
    new_path_description = Column(String, nullable=False)  # Куди направлено
    
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    ended_at = Column(DateTime(timezone=True), nullable=True)  # Якщо null - об'їзд ще триває
    
    dispatcher_id = Column(Integer, nullable=True)


