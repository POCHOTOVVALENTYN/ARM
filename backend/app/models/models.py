# backend/app/models/models.py
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, DateTime

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
