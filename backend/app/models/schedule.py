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

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    route_id = Column(String, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    active_date = Column(Date, nullable=False)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.DRAFT, nullable=False)
    version_name = Column(String, default="Еталонний розклад", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    duties = relationship("StaticDuty", back_populates="schedule", cascade="all, delete-orphan", lazy="selectin")

class ServiceDay(str, enum.Enum):
    WORKDAY = "WORKDAY"       # Будні
    WEEKEND = "WEEKEND"       # Вихідні
    HOLIDAY = "HOLIDAY"       # Свята

class DutyType(str, enum.Enum):
    SINGLE = "SINGLE"         # Однозмінний (1 вагон, 1 зміна)
    DOUBLE = "DOUBLE"         # Двозмінний (1 вагон, 2 зміни)
    PEAK = "PEAK"             # Піковий (ранок + вечір з відстоєм)
    SPLIT = "SPLIT"           # Розривний (2 різні вагони для денного ремонту/ТО в депо)

class TripDirection(str, enum.Enum):
    FORWARD = "FORWARD"
    BACKWARD = "BACKWARD"
    PULL_OUT = "PULL_OUT"     # Виїзд з депо на лінію (з пасажирами)
    PULL_IN = "PULL_IN"       # Заїзд у депо з лінії

class StaticDuty(Base):
    __tablename__ = "static_duties"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False)
    route_id = Column(String, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(SQLEnum(ServiceDay), default=ServiceDay.WORKDAY, nullable=False)
    duty_number = Column(String, nullable=False) # Напр. "18-01", "7-04"
    duty_type = Column(SQLEnum(DutyType), default=DutyType.DOUBLE, nullable=False)

    schedule = relationship("Schedule", back_populates="duties")
    shifts = relationship("StaticShift", back_populates="duty", cascade="all, delete-orphan", lazy="selectin")

class StaticShift(Base):
    """
    Зміна в межах наряду. Фіксує робочий час конкретного водія/вагона.
    """
    __tablename__ = "static_shifts"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    duty_id = Column(Integer, ForeignKey("static_duties.id", ondelete="CASCADE"), nullable=False)
    shift_sequence = Column(Integer, nullable=False) # 1 - перша зміна, 2 - друга зміна
    vehicle_id = Column(String, nullable=True) # Для розривних нарядів (SPLIT) фіксує конкретний вагон
    has_break = Column(Boolean, default=False)
    break_start_time = Column(Time, nullable=True)
    break_duration_minutes = Column(Integer, nullable=True)
    break_location_id = Column(String, nullable=True)

    duty = relationship("StaticDuty", back_populates="shifts")
    trips = relationship("StaticTrip", back_populates="shift", cascade="all, delete-orphan", lazy="selectin")

class StaticTrip(Base):
    __tablename__ = "static_trips"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shift_id = Column(Integer, ForeignKey("static_shifts.id", ondelete="CASCADE"), nullable=False)
    trip_sequence = Column(Integer, nullable=False)
    direction = Column(SQLEnum(TripDirection), nullable=False)
    trip_type = Column(String, default="REGULAR", nullable=False) # REGULAR, PULL_OUT, PULL_IN, DETOUR
    is_zero_run = Column(Boolean, default=False, nullable=False)
    smoothing_state = Column(String, default="normal") # normal, delay, catchup
    smoothing_delta = Column(Float, default=0.0)
    
    shift = relationship("StaticShift", back_populates="trips")
    stop_times = relationship("StaticStopTime", back_populates="trip", cascade="all, delete-orphan", lazy="selectin")

class StaticStopTime(Base):
    __tablename__ = "static_stop_times"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_id = Column(Integer, ForeignKey("static_trips.id", ondelete="CASCADE"), nullable=False)
    stop_id = Column(String, ForeignKey("stations.id"), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    arrival_time = Column(Time, nullable=False)
    departure_time = Column(Time, nullable=False)
    is_break_location = Column(Boolean, default=False) # Прапорець, якщо тут обід
    is_control_point = Column(Boolean, default=False)  # Прапорець контрольної точки (для сітки розкладу)

    trip = relationship("StaticTrip", back_populates="stop_times")

StaticSchedule = Schedule
