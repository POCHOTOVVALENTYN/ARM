import json
import os
import aiohttp
from pydantic import BaseModel, Field

# Схема для валідації відповіді від нейромережі
class IncidentAnalysisResult(BaseModel):
    category: str = Field(..., description="Категорія: POWER_OUTAGE, DERAILMENT, ACCIDENT, LINE_BREAK, OTHER")
    severity: str = Field(..., description="Рівень: LOW, MEDIUM, HIGH, CRITICAL")
    estimated_delay_minutes: int = Field(..., description="Прогнозована затримка у хвилинах")
    recommended_action: str = Field(..., description="Коротка інструкція для диспетчера згідно з регламентом")

class IncidentAIService:
    def __init__(self):
        # API ключ береться з середовища. 
        self.api_key = os.getenv("LLM_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions" # Або OpenRouter/інший провайдер

    def _build_prompt(self, description: str) -> str:
        return f"""
        Ти — експерт-аналітик диспетчерської служби міського електротранспорту.
        Твоє завдання: проаналізувати повідомлення від водія або диспетчера та класифікувати інцидент.
        
        Повідомлення: "{description}"
        
        Враховуй специфіку: обрив контактної мережі, схід вагона з рейок, знеструмлення підстанції, ДТП стороннього транспорту на коліях.
        Поверни результат ВИКЛЮЧНО у форматі валідного JSON, що відповідає такій структурі:
        {{
            "category": "string",
            "severity": "string",
            "estimated_delay_minutes": integer,
            "recommended_action": "string"
        }}
        """

    async def analyze_incident(self, description: str) -> dict:
        if not self.api_key:
            # Fallback, якщо AI тимчасово недоступний (економія/відмова)
            return {
                "category": "UNCLASSIFIED",
                "severity": "MEDIUM",
                "estimated_delay_minutes": 15,
                "recommended_action": "Діяти за стандартним протоколом."
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4o-mini", # Або інша швидка/економічна модель
            "messages": [{"role": "user", "content": self._build_prompt(description)}],
            "response_format": {"type": "json_object"},
            "temperature": 0.1 # Мінімальна креативність для стабільних результатів
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(self.api_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    raw_json = data['choices'][0]['message']['content']
                    return json.loads(raw_json)
                else:
                    raise Exception(f"AI API Error: {response.status}")

incident_ai_service = IncidentAIService()
