import React, { useCallback } from 'react';
import { useCanvasAutomation } from '../../hooks/useCanvasAutomation';
import { useScheduleStore } from '../../store/useScheduleStore';

interface LiveVehicleCanvasProps {
    width: number;
    height: number;
    projectPoint: (lat: number, lon: number) => { x: number, y: number };
    selectedVehicleId?: string;
    selectedRouteFilter?: string; // e.g. 'ALL' or 'T3', 'Tr3', etc.
}

export const LiveVehicleCanvas: React.FC<LiveVehicleCanvasProps> = ({
    width,
    height,
    projectPoint,
    selectedVehicleId,
    selectedRouteFilter = 'ALL'
}) => {
    const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
        const telemetry = useScheduleStore.getState().telemetry || {};
        const vehicles = Object.values(telemetry).map((v: any) => ({ ...v, id: v.id || v.vehicle_id }));

        vehicles.forEach(vehicle => {
            const { x, y } = projectPoint(vehicle.lat, vehicle.lon);

            // Перевіряємо чи належить ТЗ обраному фільтру маршруту
            const vehicleRoute = vehicle.route_id || vehicle.routeId || '';
            const isRouteMatched = selectedRouteFilter === 'ALL' || 
                vehicleRoute.toLowerCase() === selectedRouteFilter.toLowerCase() ||
                vehicle.id.toLowerCase().includes(selectedRouteFilter.toLowerCase());

            // Якщо вибрано конкретний маршрут, але вагон з іншого — зменшуємо прозорість
            const opacity = isRouteMatched ? 1.0 : 0.25;
            ctx.globalAlpha = opacity;

            // Анімація "пульсації" для об'єктів у русі
            const pulseRadius = vehicle.speed > 0 
                ? 6 + Math.sin(frameCount * 0.1) * 2 
                : 6;

            const isSelected = selectedVehicleId && vehicle.id.includes(selectedVehicleId);
            const finalRadius = isSelected ? pulseRadius + 4 : pulseRadius;

            if (isSelected) {
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
                shadowColor = 'rgba(147, 51, 234, 0.3)';
                coreColor = '#9333ea';
            } else if (vehicle.type === 'electrobus' || vehicleRoute.includes('E')) {
                shadowColor = 'rgba(16, 185, 129, 0.3)'; // emerald
                coreColor = '#10b981';
            }

            // Тінь / Світіння
            ctx.beginPath();
            ctx.arc(x, y, finalRadius + 4, 0, 2 * Math.PI);
            ctx.fillStyle = shadowColor;
            ctx.fill();

            // Ядро вагона
            ctx.beginPath();
            ctx.arc(x, y, finalRadius, 0, 2 * Math.PI);
            ctx.fillStyle = coreColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fill();

            // Ідентифікатор
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = isRouteMatched ? '#ffffff' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(vehicle.id || '', x, y - 12);

            ctx.globalAlpha = 1.0; // Скидаємо прозорість для наступних елементів
        });
    }, [projectPoint, selectedVehicleId, selectedRouteFilter]);

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
                pointerEvents: 'none'
            }}
        />
    );
};
