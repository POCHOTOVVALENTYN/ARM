// src/utils/scheduleEngine.ts
const API_URL = 'http://localhost:8000/api/v1/solver';

export interface DelayRequestData {
    block_id: string;
    start_time: number;
    delay_minutes: number;
}

/**
 * Відправляє запит на бекенд для каскадного застосування затримки.
 */
export const applyDelayCascade = async (requestData: DelayRequestData) => {
    try {
        const response = await fetch(`${API_URL}/apply-delay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error('Помилка розрахунку на сервері Transit Solver');
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error("Помилка Transit Solver:", error);
        throw error;
    }
};

export const calculateDepotExitTime = (...args: any[]): any => {};
export type SlackPropagationResult = any;
export const calculateHeadway = (...args: any[]): any => {};
export const calculateTurnaroundTime = (...args: any[]): any => {};
export const checkNodeCapacityAndHeadway = (...args: any[]): any => {};
export const timeToMinutes = (...args: any[]): any => {};
export const validateDriverDuty = (...args: any[]): any => {};
export const calculateSlackEffect = (...args: any[]): any => {};
