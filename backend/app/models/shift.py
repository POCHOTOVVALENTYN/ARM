from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey, Time, Date
from sqlalchemy.sql import func
from datetime import datetime
from app.models.models import Base

class DriverShiftModel(Base):
  """Модель Зміни Водія (Run Cutting & Driver Shift Assignment)"""

  __tablename__ = "driver_shifts"

  id = Column(String, primary_key=True, index=True)
  schedule_id = Column(String, index=True, nullable=True)
  route_id = Column(String, index=True, nullable=False)
  duty_number = Column(Integer, index=True, nullable=False)
  duty_type = Column(
      String, default="DOUBLE", nullable=False
  )  # DOUBLE, SINGLE, PEAK, SPLIT

  shift_index = Column(
      Integer, default=1, nullable=False
  )  # 1 - перша зміна, 2 - друга зміна
  driver_id = Column(
      String, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True
  )
  driver_tab_num = Column(String, nullable=True)
  driver_name = Column(String, nullable=True)

  vehicle_id = Column(
      String, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
  )
  second_vehicle_id = Column(
      String, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
  )  # Для розривного наряду (SPLIT)

  prep_time_min = Column(
      Integer, default=10, nullable=False
  )  # 10m tram / 19m trolleybus
  depot_arrival_time = Column(String, nullable=True)
  pullout_time = Column(String, nullable=True)
  start_time = Column(String, nullable=False)
  end_time = Column(String, nullable=False)

  lunch_start_time = Column(String, nullable=True)
  lunch_end_time = Column(String, nullable=True)
  lunch_duration_min = Column(Integer, default=15, nullable=False)
  paid_excess_break_min = Column(Integer, default=0, nullable=False)
  lunch_location = Column(String, nullable=True)

  work_hours = Column(Float, default=8.0, nullable=False)
  driving_hours = Column(Float, default=7.5, nullable=False)
  night_hours = Column(Float, default=0.0, nullable=False)

  compliance_status = Column(
      String, default="VALID", nullable=False
  )  # VALID, WARNING_EXCESS_BREAK, VIOLATION_OVERTIME, VIOLATION_REST
  notes = Column(String, nullable=True)
  created_at = Column(
      DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
  )


class KPZCardModel(Base):
  """Картка Обліку Роботи Водія (КПЗ / Картка Зміни)"""

  __tablename__ = "kpz_cards"

  id = Column(String, primary_key=True, index=True)
  shift_id = Column(
      String,
      ForeignKey("driver_shifts.id", ondelete="CASCADE"),
      nullable=False,
  )
  date = Column(Date, default=func.current_date, nullable=False)

  driver_id = Column(String, nullable=True)
  driver_tab_num = Column(String, nullable=True)
  driver_name = Column(String, nullable=True)

  route_number = Column(String, nullable=False)
  route_name = Column(String, nullable=False)
  duty_number = Column(Integer, nullable=False)
  vehicle_num = Column(String, nullable=False)
  second_vehicle_num = Column(String, nullable=True)  # Для Розривного наряду

  depot_name = Column(String, nullable=False)
  depot_arrival_time = Column(String, nullable=False)
  med_check_time = Column(String, nullable=False)
  pullout_time = Column(String, nullable=False)
  pullin_time = Column(String, nullable=False)

  total_work_hours = Column(Float, nullable=False)
  driving_hours = Column(Float, nullable=False)
  break_minutes = Column(Integer, nullable=False)
  paid_excess_break_min = Column(Integer, nullable=False)
  night_hours = Column(Float, nullable=False)

  timeline_events = Column(JSON, nullable=False)  # Хронологічний шар подій
  created_at = Column(
      DateTime(timezone=True), default=datetime.utcnow, server_default=func.now()
  )
