import React, { useCallback } from 'react';
import { useCanvasAutomation } from '../../hooks/useCanvasAutomation';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useTelemetryStore } from '../../store/useTelemetryStore';

interface LiveVehicleCanvasProps {
    width: number;
    height: number;
    projectPoint: (lat: number, lon: number) => { x: number, y: number };
    selectedVehicleId?: string;
    selectedRouteFilter?: string; // e.g. 'ALL' or '7', '18', '28', etc.
}

export const LiveVehicleCanvas: React.FC<LiveVehicleCanvasProps> = ({
    width,
    height,
    projectPoint,
    selectedVehicleId,
    selectedRouteFilter = 'ALL'
}) => {
    const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
        // Отримуємо високошвидкісні координати з useTelemetryStore (без React re-renders)
        const telemetryStoreVehicles = Object.values(useTelemetryStore.getState().vehicles);
        const legacyTelemetry = Object.values(useScheduleStore.getState().telemetry || {});
        
        const rawVehicles = telemetryStoreVehicles.length > 0 ? telemetryStoreVehicles : legacyTelemetry;
        const vehicles = rawVehicles.map((v: any) => ({
            ...v,
            id: v.vehicle_id || v.id || '',
            lat: v.lat,
            lon: v.lng !== undefined ? v.lng : v.lon,
            deviation_min: v.deviation_min || 0.0,
            status: v.status || 'active'
        }));

        vehicles.forEach(vehicle => {
            const { x, y } = projectPoint(vehicle.lat, vehicle.lon);

            // Перевіряємо чи належить ТЗ обраному фільтру маршруту
            const vehicleRoute = (vehicle.route_id || vehicle.routeId || '').toString();
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

            // Визначення кольору за відхиленням (Schedule Adherence)
            // > 2 хв - Червоний (запізнення), < -2 хв - Синій (нагін), інакше Зелений (норма)
            let coreColor = '#10b981'; // Emerald 500
            let shadowColor = 'rgba(16, 185, 129, 0.3)';

            if (vehicle.deviation_min > 2.0) {
                coreColor = '#ef4444'; // Red 500
                shadowColor = 'rgba(239, 68, 68, 0.35)';
            } else if (vehicle.deviation_min < -2.0) {
                coreColor = '#3b82f6'; // Blue 500
                shadowColor = 'rgba(59, 130, 246, 0.35)';
            } else if (vehicle.status === 'MODIFIED_RESERVE' || vehicle.status === 'HOT_RESERVE') {
                coreColor = '#9333ea';
                shadowColor = 'rgba(147, 51, 234, 0.35)';
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

            // Ідентифікатор бортового номера
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = isRouteMatched ? '#1e293b' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(`№${vehicle.id}`, x, y - 12);

            // Індикатор відхилення від розкладу (якщо відхилення присутнє)
            if (vehicle.deviation_min !== 0 && isRouteMatched) {
                const devText = vehicle.deviation_min > 0 
                    ? `+${vehicle.deviation_min}хв` 
                    : `${vehicle.deviation_min}хв`;

                ctx.font = 'bold 9px monospace';
                ctx.fillStyle = coreColor;
                ctx.fillText(devText, x, y + 16);
            }

            ctx.globalAlpha = 1.0; // Скидаємо прозорість
        });
    }, [projectPoint, selectedVehicleId, selectedRouteFilter]);

    const canvasRef = useCanvasAutomation(draw);

    return (
        <div className="absolute inset-0 pointer-events-none">
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

            {/* Плашка легенди стану телеметрії */}
            <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-800 pointer-events-auto z-20 text-xs font-sans">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wider text-[10px]">
                    Телеметрія GPS (Wialon)
                </h4>
                <div className="space-y-1.5 text-[11px] font-bold">
                    <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                        <span>У графіку (±2 хв)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
                        <span>Запізнення (&gt; 2 хв)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
                        <span>Нагін (&lt; -2 хв)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveVehicleCanvas;
