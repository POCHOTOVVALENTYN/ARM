import React, { useCallback } from 'react';
import { useCanvasAutomation } from '../../hooks/useCanvasAutomation';
import { useScheduleStore } from '../../store/useScheduleStore';

interface LiveVehicleCanvasProps {
    width: number;
    height: number;
    // Функція-трансформер координат: Geo(lat, lon) -> Pixel(x, y)
    projectPoint: (lat: number, lon: number) => { x: number, y: number }; 
    selectedVehicleId?: string;
}

export const LiveVehicleCanvas: React.FC<LiveVehicleCanvasProps> = ({ width, height, projectPoint, selectedVehicleId }) => {
    // Отримуємо актуальну телеметрію безпосередньо зі store (Single Source of Truth)
    const telemetry = useScheduleStore(state => state.telemetry);

    // Логіка відмальовування, яка передається в конвеєр
    const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
        const vehicles = Object.entries(telemetry).map(([id, data]) => ({ id, ...data }));

        vehicles.forEach(vehicle => {
            const { x, y } = projectPoint(vehicle.lat, vehicle.lon);

            // Анімація "пульсації" для об'єктів у русі
            const pulseRadius = vehicle.speed > 0 
                ? 6 + Math.sin(frameCount * 0.1) * 2 
                : 6;

            const isSelected = selectedVehicleId && vehicle.id.includes(selectedVehicleId);
            const finalRadius = isSelected ? pulseRadius + 4 : pulseRadius;

            if (isSelected) {
                // Відмальовування кільця виділення (жовте)
                ctx.beginPath();
                ctx.arc(x, y, finalRadius + 6, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(234, 179, 8, 0.4)'; // amber-500
                ctx.fill();
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Відмальовування тіні/світіння
            ctx.beginPath();
            ctx.arc(x, y, finalRadius + 4, 0, 2 * Math.PI);
            ctx.fillStyle = vehicle.status === 'DELAYED' 
                ? 'rgba(220, 53, 69, 0.3)'   // Червоний для затримок
                : 'rgba(25, 118, 210, 0.3)'; // Синій для норми
            ctx.fill();

            // Відмальовування ядра вагона
            ctx.beginPath();
            ctx.arc(x, y, finalRadius, 0, 2 * Math.PI);
            ctx.fillStyle = vehicle.status === 'DELAYED' ? '#dc3545' : '#1976d2';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            // Ідентифікатор борту (відмальовуємо текст прямо на Canvas)
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.fillText(vehicle.id || '', x, y - 12);
        });
    }, [telemetry, projectPoint, selectedVehicleId]);

    const canvasRef = useCanvasAutomation(draw);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${width}px`,
                height: `${height}px`,
                pointerEvents: 'none' // Пропускаємо кліки до нижнього шару карти
            }}
        />
    );
};
