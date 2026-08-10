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

class ControlPointEtaModel(Base):
    __tablename__ = "eta_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_id = Column(String, index=True)
    station_id = Column(String)
    estimated_arrival_time = Column(DateTime)
    actual_arrival_time = Column(DateTime, nullable=True)
    timestamp = Column(DateTime)
