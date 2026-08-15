# backend/app/models/models.py
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON

Base = declarative_base()

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(String, primary_key=True, index=True)
    status = Column(String)
    current_trip_id = Column(String, nullable=True)

class Trip(Base):
    __tablename__ = "trips"
    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String)
    status = Column(String)

class IncidentLog(Base):
    __tablename__ = "incident_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(String, nullable=True)
    trip_id = Column(String)
    old_vehicle_id = Column(String)
    new_vehicle_id = Column(String)
    action = Column(String)
    reason = Column(String)
    timestamp = Column(DateTime)

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
    
class DriverDutyModel(Base):
    __tablename__ = "driver_duties"
    id = Column(String, primary_key=True, index=True)
    driver_id = Column(String)
    block_id = Column(String)
    start_time = Column(Integer)
    end_time = Column(Integer)
    status = Column(String)
    breaks = Column(JSON)

class DriverModel(Base):
    __tablename__ = "drivers"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    status = Column(String)  # 'WORK', 'BREAK', 'OFF'
    current_vehicle_id = Column(String, nullable=True)

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

class ControlPointEtaModel(Base):
    __tablename__ = "eta_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_id = Column(String, index=True)
    station_id = Column(String)
    estimated_arrival_time = Column(DateTime)
    actual_arrival_time = Column(DateTime, nullable=True)
    timestamp = Column(DateTime)

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
    type = Column(String)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    prepTimeMin = Column(Integer)

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

