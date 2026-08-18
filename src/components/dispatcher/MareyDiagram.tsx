import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/apiClient';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import * as d3 from 'd3';
import './MareyDiagram.css';

export interface Stop {
    id: string;
    name: string;
    distance_from_start: number;
}

export interface TripEvent {
    stop_id: string;
    timestamp: number; // Unix timestamp
    is_actual: boolean;
}

export interface MareyTrip {
    id: string;
    duty_number: string;
    vehicle_id: string;
    events: TripEvent[];
}

interface MareyDiagramProps {
    width?: number;
    height?: number;
    routeId?: string;
}

export const MareyDiagram: React.FC<MareyDiagramProps> = ({ 
    width = 1200, 
    height = 700,
    routeId = '18'
}) => {
    const [selectedRoute, setSelectedRoute] = useState<string>(routeId);
    const vehiclesTelemetry = useTelemetryStore((state) => state.vehicles);

    // Завантажуємо активний розклад з бекенду
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['active-schedules', selectedRoute],
        queryFn: async () => {
            const { data } = await api.get(`/schedules/active?route_id=${selectedRoute}`);
            return data;
        },
        staleTime: 30000,
    });

    const activeSchedule = schedules.length > 0 ? schedules[0] : null;

    // Зупинки маршруту (з точним врахуванням реальних кілець)
    const stops: Stop[] = useMemo(() => {
        if (!activeSchedule || !activeSchedule.duties || activeSchedule.duties.length === 0) {
            // Дефолтні зупинки для Трамвая 18 (11 ст. Фонтану — кільце, 6 ст. — звичайна зупинка)
            return [
                { id: "st_kulykove", name: "Куликове поле (Кінцева)", distance_from_start: 0 },
                { id: "st_4_fontan", name: "4 ст. Фонтану", distance_from_start: 2.8 },
                { id: "st_5_fontan", name: "5 ст. Фонтану", distance_from_start: 4.0 },
                { id: "st_6_fontan", name: "6 ст. Фонтану", distance_from_start: 5.2 },
                { id: "st_8_fontan", name: "8 ст. Фонтану", distance_from_start: 7.0 },
                { id: "st_11_fontan", name: "11 ст. Фонтану (Кільце)", distance_from_start: 8.8 },
                { id: "st_16_fontan", name: "16 ст. Великого Фонтану (Кінцева)", distance_from_start: 11.8 }
            ];
        }

        // Витягуємо унікальні зупинки з першого рейсу
        const extractedStops: Stop[] = [];
        const seenStopIds = new Set<string>();

        activeSchedule.duties.forEach((duty: any) => {
            (duty.shifts || []).forEach((shift: any) => {
                (shift.trips || []).forEach((trip: any) => {
                    (trip.stop_times || []).forEach((st: any, idx: number) => {
                        if (!seenStopIds.has(st.stop_id)) {
                            seenStopIds.add(st.stop_id);
                            extractedStops.push({
                                id: st.stop_id,
                                name: st.stop_id.replace('st_', '').replace(/_/g, ' '),
                                distance_from_start: extractedStops.length * 1.5
                            });
                        }
                    });
                });
            });
        });

        return extractedStops.length > 0 ? extractedStops : [
            { id: "st_start", name: "Початкова станція", distance_from_start: 0 },
            { id: "st_end", name: "Кінцева станція", distance_from_start: 12.0 }
        ];
    }, [activeSchedule]);

    // Парсимо рейси у графік Марея
    const trips: MareyTrip[] = useMemo(() => {
        if (!activeSchedule || !activeSchedule.duties) return [];

        const todayDate = new Date();
        const baseMidnight = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime() / 1000;

        const result: MareyTrip[] = [];

        activeSchedule.duties.forEach((duty: any) => {
            (duty.shifts || []).forEach((shift: any) => {
                (shift.trips || []).forEach((trip: any) => {
                    const events: TripEvent[] = [];

                    (trip.stop_times || []).forEach((st: any) => {
                        if (st.arrival_time) {
                            const parts = String(st.arrival_time).split(':');
                            const h = parseInt(parts[0], 10) || 0;
                            const m = parseInt(parts[1], 10) || 0;
                            const s = parseInt(parts[2], 10) || 0;
                            const timestamp = baseMidnight + (h * 3600 + m * 60 + s);

                            events.push({
                                stop_id: st.stop_id,
                                timestamp,
                                is_actual: false
                            });
                        }
                    });

                    if (events.length > 0) {
                        result.push({
                            id: `trip_${trip.id || trip.trip_sequence}`,
                            duty_number: duty.duty_number,
                            vehicle_id: duty.duty_number,
                            events
                        });
                    }
                });
            });
        });

        return result;
    }, [activeSchedule]);

    const xAxisRef = useRef<SVGGElement>(null);
    const yAxisRef = useRef<SVGGElement>(null);

    const margin = { top: 40, right: 40, bottom: 60, left: 160 };
    const innerWidth = Math.max(600, width - margin.left - margin.right);
    const innerHeight = Math.max(400, height - margin.top - margin.bottom);

    const { xScale, yScale, lineGenerator } = useMemo(() => {
        const allTimes = trips.flatMap(t => t.events.map(e => e.timestamp));
        const nowSec = Date.now() / 1000;
        const minTime = allTimes.length > 0 ? Math.min(...allTimes) : nowSec - 3600;
        const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : nowSec + 3600 * 5;

        const xScale = d3.scaleTime()
            .domain([new Date(minTime * 1000), new Date(maxTime * 1000)])
            .range([0, innerWidth]);

        const maxDist = d3.max<Stop, number>(stops, s => s.distance_from_start) || 12;
        const yScale = d3.scaleLinear()
            .domain([0, maxDist])
            .range([0, innerHeight]);

        const lineGenerator = d3.line<TripEvent>()
            .x(d => xScale(new Date(d.timestamp * 1000)))
            .y(d => {
                const stop = stops.find(s => s.id === d.stop_id);
                return yScale(stop ? stop.distance_from_start : 0);
            })
            .curve(d3.curveLinear);

        return { xScale, yScale, lineGenerator };
    }, [stops, trips, innerWidth, innerHeight]);

    useEffect(() => {
        if (xAxisRef.current) {
            const xAxis = d3.axisBottom(xScale)
                .ticks(d3.timeMinute.every(30))
                .tickFormat((d) => d3.timeFormat("%H:%M")(d as Date));
            
            const g = d3.select(xAxisRef.current);
            g.selectAll("*").remove();
            g.call(xAxis)
                .selectAll("text")
                .style("font-size", "11px")
                .style("font-family", "monospace")
                .style("font-weight", "bold")
                .style("fill", "#475569");
        }

        if (yAxisRef.current) {
            const yAxis = d3.axisLeft(yScale)
                .tickValues(stops.map(s => s.distance_from_start))
                .tickFormat((d) => {
                    const stop = stops.find(s => s.distance_from_start === d);
                    return stop ? stop.name : '';
                });

            const g = d3.select(yAxisRef.current);
            g.selectAll("*").remove();
            g.call(yAxis)
                .selectAll("text")
                .style("font-size", "11px")
                .style("font-weight", "bold")
                .style("fill", "#1E293B");
        }
    }, [xScale, yScale, stops]);

    return (
        <div className="marey-diagram-container flex flex-col space-y-4 font-sans">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold uppercase text-slate-500">Маршрут:</span>
                    <select
                        value={selectedRoute}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                        className="bg-white border border-slate-300 font-bold text-sm px-3 py-1.5 rounded-lg text-slate-800"
                    >
                        <option value="18">Трамвай №18 (Куликове поле — 16 ст. Фонтану)</option>
                        <option value="17">Трамвай №17 (Куликове поле — 11 ст. Фонтану)</option>
                        <option value="7">Трамвай №7 (Паустовського — 11 ст. Люстдорфської)</option>
                        <option value="5">Трамвай №5 (Аркадія — Автовокзал)</option>
                        <option value="28">Трамвай №28 (Парк Шевченка — Пастера)</option>
                        <option value="8">Тролейбус №8 (Ж/Д Вокзал — вул. Інглезі)</option>
                    </select>
                </div>
                <div className="text-xs font-mono font-bold text-slate-600">
                    Рейсів на графіку: <span className="text-blue-600 font-black">{trips.length}</span>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <g transform={`translate(${margin.left},${margin.top})`}>
                        {/* Горизонтальні лінії для зупинок */}
                        {stops.map(stop => (
                            <line
                                key={`grid-${stop.id}`}
                                x1={0}
                                x2={innerWidth}
                                y1={yScale(stop.distance_from_start)}
                                y2={yScale(stop.distance_from_start)}
                                stroke="#E2E8F0"
                                strokeDasharray="3 3"
                            />
                        ))}

                        {/* Осі */}
                        <g 
                            ref={xAxisRef} 
                            transform={`translate(0,${innerHeight})`} 
                            className="axis x-axis"
                        />
                        <g 
                            ref={yAxisRef} 
                            className="axis y-axis"
                        />

                        {/* Лінії рейсів */}
                        {trips.map(trip => {
                            const pathData = lineGenerator(trip.events);
                            if (!pathData) return null;

                            return (
                                <path
                                    key={trip.id}
                                    d={pathData}
                                    fill="none"
                                    stroke="#2563EB"
                                    strokeWidth={2.5}
                                    opacity={0.85}
                                    className="hover:stroke-amber-500 hover:stroke-[4px] transition-all cursor-pointer"
                                >
                                    <title>Наряд {trip.duty_number}</title>
                                </path>
                            );
                        })}

                        {/* Вузлові точки прибуття */}
                        {trips.flatMap(trip => 
                            trip.events.map((event, idx) => {
                                const stop = stops.find(s => s.id === event.stop_id);
                                if (!stop) return null;

                                return (
                                    <circle
                                        key={`${trip.id}-${idx}`}
                                        cx={xScale(new Date(event.timestamp * 1000))}
                                        cy={yScale(stop.distance_from_start)}
                                        r={3.5}
                                        fill="#FFFFFF"
                                        stroke="#1D4ED8"
                                        strokeWidth={2}
                                    >
                                        <title>Наряд {trip.duty_number}: {stop.name} о {new Date(event.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</title>
                                    </circle>
                                );
                            })
                        )}
                    </g>
                </svg>
            </div>
        </div>
    );
};
