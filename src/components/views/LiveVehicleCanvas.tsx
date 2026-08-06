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
    // Логіка відмальовування, яка передається в конвеєр
    const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
        // Отримуємо актуальну телеметрію безпосередньо зі store без підписки на рендеринг
        const telemetry = useScheduleStore.getState().telemetry || {};
        const vehicles = Object.entries(telemetry).map(([id, data]) => ({ id, ...(data as any) }));

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

            // Визначення кольору за статусом
            let shadowColor = 'rgba(25, 118, 210, 0.3)';
            let coreColor = '#1976d2';
            
            if (vehicle.status === 'DELAYED') {
                shadowColor = 'rgba(220, 53, 69, 0.3)';
                coreColor = '#dc3545';
            } else if (vehicle.status === 'MODIFIED_RESERVE' || vehicle.status === 'HOT_RESERVE') {
                shadowColor = 'rgba(147, 51, 234, 0.3)'; // purple-600
                coreColor = '#9333ea';
            }

            // Відмальовування тіні/світіння
            ctx.beginPath();
            ctx.arc(x, y, finalRadius + 4, 0, 2 * Math.PI);
            ctx.fillStyle = shadowColor;
            ctx.fill();

            // Відмальовування ядра вагона
            ctx.beginPath();
            ctx.arc(x, y, finalRadius, 0, 2 * Math.PI);
            ctx.fillStyle = coreColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fill();

            // Значок резерву (маленька блискавка або R)
            if (vehicle.status === 'MODIFIED_RESERVE' || vehicle.status === 'HOT_RESERVE') {
                ctx.font = 'bold 8px Inter, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText('R', x, y + 3);
            }

            // Ідентифікатор борту (відмальовуємо текст прямо на Canvas)
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.fillText(vehicle.id || '', x, y - 12);
        });
    }, [projectPoint, selectedVehicleId]);

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
