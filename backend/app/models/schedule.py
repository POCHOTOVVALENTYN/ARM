from sqlalchemy import Column, Integer, String, ForeignKey, Time, Float, Boolean, Enum as SQLEnum, Date, DateTime
from sqlalchemy.orm import relationship
from app.models.models import Base
from datetime import datetime
import enum

class ScheduleStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    active_date = Column(Date, nullable=False)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    duties = relationship("StaticDuty", back_populates="schedule", cascade="all, delete-orphan")

class ServiceDay(str, enum.Enum):
    WORKDAY = "WORKDAY"       # Будні
    WEEKEND = "WEEKEND"       # Вихідні
    HOLIDAY = "HOLIDAY"       # Свята

class DutyType(str, enum.Enum):
    SINGLE = "SINGLE"         # Однозмінний
    DOUBLE = "DOUBLE"         # Двозмінний (1 вагон, 2 водії)
    PEAK = "PEAK"             # Піковий (тільки ранок і вечір)
    SPLIT = "SPLIT"           # Розривний (2 вагони, 1 розклад)

class TripDirection(str, enum.Enum):
    FORWARD = "FORWARD"
    BACKWARD = "BACKWARD"
    PULL_OUT = "PULL_OUT"     # Виїзд з депо
    PULL_IN = "PULL_IN"       # Заїзд у депо

class StaticDuty(Base):
    __tablename__ = "static_duties"
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False)
    route_id = Column(String, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(SQLEnum(ServiceDay), nullable=False) # Графік робочого чи вихідного дня
    duty_number = Column(String, nullable=False)
    duty_type = Column(SQLEnum(DutyType), nullable=False)

    schedule = relationship("Schedule", back_populates="duties")
    shifts = relationship("StaticShift", back_populates="duty", cascade="all, delete-orphan")

class StaticShift(Base):
    """
    Зміна в межах наряду. Фіксує робочий час конкретного водія/вагона.
    """
    __tablename__ = "static_shifts"
    id = Column(Integer, primary_key=True, index=True)
    duty_id = Column(Integer, ForeignKey("static_duties.id", ondelete="CASCADE"), nullable=False)
    shift_sequence = Column(Integer, nullable=False) # 1 - перша зміна, 2 - друга зміна
    has_break = Column(Boolean, default=False)
    break_start_time = Column(Time, nullable=True)
    break_duration_minutes = Column(Integer, nullable=True)

    duty = relationship("StaticDuty", back_populates="shifts")
    trips = relationship("StaticTrip", back_populates="shift", cascade="all, delete-orphan")

class StaticTrip(Base):
    __tablename__ = "static_trips"
    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("static_shifts.id", ondelete="CASCADE"), nullable=False)
    trip_sequence = Column(Integer, nullable=False)
    direction = Column(SQLEnum(TripDirection), nullable=False)
    smoothing_state = Column(String, default="normal")
    smoothing_delta = Column(Float, default=0.0)
    
    shift = relationship("StaticShift", back_populates="trips")
    stop_times = relationship("StaticStopTime", back_populates="trip", cascade="all, delete-orphan")

class StaticStopTime(Base):
    __tablename__ = "static_stop_times"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("static_trips.id", ondelete="CASCADE"), nullable=False)
    stop_id = Column(String, ForeignKey("stations.id"), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    arrival_time = Column(Time, nullable=False)
    departure_time = Column(Time, nullable=False)
    is_break_location = Column(Boolean, default=False) # Флаг, якщо тут відбувається обід

    trip = relationship("StaticTrip", back_populates="stop_times")

StaticSchedule = Schedule

