// src/utils/scheduleEngine.ts
const API_URL = 'http://localhost:8000/api/v1/solver';

export interface IncidentData {
    trip_id: string;
    node_id: string;
    delay_minutes: number;
    incident_type: string;
}

/**
 * Відправляє дані інциденту на бекенд для каскадного перерахунку розкладу.
 * Замінює локальні математичні розрахунки на транзакційні бекенд-запити.
 */
export const recalculateSchedulePreview = async (incident: IncidentData, currentBlocks: any[]) => {
    try {
        const response = await fetch(`${API_URL}/recalculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                incident: incident,
                current_blocks: currentBlocks,
                safety_headway: 2
            }),
        });

        if (!response.ok) {
            throw new Error('Помилка розрахунку на сервері Transit Solver');
        }

        const data = await response.json();
        return data; // Повертає { status: "success", updated_blocks: [...] }
    } catch (error) {
        console.error("Помилка Transit Solver:", error);
        throw error;
    }
};
