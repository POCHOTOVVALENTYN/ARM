from app.models.schemas import VehicleBlock, IncidentEvent, ShiftValidation
from app.core.config import settings
from typing import List, Dict

class TransitSolver:
    @staticmethod
    def recalculate_cascade(incident: IncidentEvent, blocks: List[VehicleBlock], safety_headway: int) -> Dict:
        updated_blocks = []
        
        for block in blocks:
            updated_trips = []
            cumulative_delay = 0

            for trip in block.trips:
                # Фіксуємо затримку на рейсі, де сталася подія
                if trip.id == incident.trip_id:
                    cumulative_delay += incident.delay_minutes

                # Каскадно зсуваємо цей та всі наступні рейси
                if cumulative_delay > 0:
                    trip.start_time += cumulative_delay
                    trip.end_time += cumulative_delay
                
                updated_trips.append(trip)

            block.trips = updated_trips
            updated_blocks.append(block)

        # TODO: Додати логіку порівняння часу прибуття на спільні вузли для запобігання "паровозності"
        # з урахуванням safety_headway
        
        return {
            "status": "success",
            "updated_blocks": [block.dict() for block in updated_blocks]
        }

    @staticmethod
    def validate_kzpp(shift_start: int, shift_end: int, break_start: int, vehicle_type: str, duty_id: str) -> ShiftValidation:
        validation = ShiftValidation(duty_id=duty_id)
        t_prep = settings.T_PREP_TRAM if vehicle_type == 'TRAM' else settings.T_PREP_TROLLEYBUS
        
        shift_duration = shift_end - shift_start + t_prep
        
        # 1. Перевірка 10-годинного ліміту
        if shift_duration > settings.MAX_SHIFT_MINUTES:
            validation.is_valid = False
            validation.errors.append(f"Перевищено 10-годинний ліміт: {shift_duration / 60:.1f} год.")

        # 2. Перевірка вікна обіду (4-6 годин)
        time_until_break = break_start - shift_start
        if time_until_break < settings.MIN_BREAK_WINDOW_MINUTES:
            validation.is_valid = False
            validation.errors.append("Обід призначено раніше ніж через 4 години.")
        elif time_until_break > settings.MAX_BREAK_WINDOW_MINUTES:
            validation.is_valid = False
            validation.errors.append("КРИТИЧНО: Обід змістився за межу 6 годин!")

        return validation
