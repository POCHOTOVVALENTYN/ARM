import React, { useMemo, useRef, useEffect } from 'react';
import { useStationStore } from '../../store/useStationStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import * as d3 from 'd3';
import './MareyDiagram.css';

// Типізація вхідних даних
export interface Stop {
    id: string;
    name: string;
    distance_from_start: number; // Використовуємо для Y-осі
}

export interface TripEvent {
    stop_id: string;
    timestamp: number; // Unix timestamp
    is_actual: boolean; // true - фактичні дані (телеметрія), false - план
}

export interface Trip {
    id: string;
    vehicle_id: string;
    events: TripEvent[];
}

interface MareyDiagramProps {
    width?: number;
    height?: number;
}


export const MareyDiagram: React.FC<MareyDiagramProps> = ({ 
    width = 1200, 
    height = 800 
}) => {
    const stations = useStationStore((state) => state.stations);
    const liveSchedule = useScheduleStore((state) => state.liveSchedule);

    const stops: Stop[] = useMemo(() => {
        return stations.map((s, i) => ({
            id: s.id,
            name: s.name,
            distance_from_start: i * 0.5,
        }));
    }, [stations]);

    const trips: Trip[] = useMemo(() => {
        if (!liveSchedule || !liveSchedule.current_blocks) return [];
        return liveSchedule.current_blocks.map((block) => {
            const events = block.trips.flatMap((trip) => 
                trip.nodes.map((node) => ({
                    stop_id: node.node_id,
                    timestamp: node.arrival_time,
                    is_actual: false,
                }))
            );
            return {
                id: block.block_id,
                vehicle_id: block.vehicle_id || block.block_id,
                events,
            };
        });
    }, [liveSchedule]);

    const xAxisRef = useRef<SVGGElement>(null);
    const yAxisRef = useRef<SVGGElement>(null);

    const margin = { top: 40, right: 30, bottom: 50, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Математичний апарат D3: Мемоїзація масштабів (Scales)
    const { xScale, yScale, lineGenerator } = useMemo(() => {
        // Знаходимо мінімальний та максимальний час для осі X
        const allTimes = trips.flatMap(t => t.events.map(e => e.timestamp));
        const minTime = allTimes.length > 0 ? Math.min(...allTimes) : Date.now() / 1000;
        const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : (Date.now() / 1000) + 3600;

        const xScale = d3.scaleTime()
            .domain([new Date(minTime * 1000), new Date(maxTime * 1000)])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max<Stop, number>(stops, s => s.distance_from_start) || 100])
            .range([0, innerHeight]);

        // Генератор ліній графіка
        const lineGenerator = d3.line<TripEvent>()
            .x(d => xScale(new Date(d.timestamp * 1000)))
            .y(d => {
                const stop = stops.find(s => s.id === d.stop_id);
                return yScale(stop ? stop.distance_from_start : 0);
            })
            .curve(d3.curveMonotoneX); // Плавне згладжування ліній руху

        return { xScale, yScale, lineGenerator };
    }, [stops, trips, innerWidth, innerHeight]);

    useEffect(() => {
        if (xAxisRef.current) {
            const xAxis = d3.axisBottom(xScale)
                .ticks(d3.timeMinute.every(15))
                .tickFormat((d) => d3.timeFormat("%H:%M")(d as Date));
            
            const g = d3.select(xAxisRef.current);
            g.selectAll("*").remove(); // Очищення попереднього рендеру
            g.call(xAxis)
                .selectAll("text")
                .style("font-size", "12px")
                .style("fill", "var(--text-primary)");
        }

        if (yAxisRef.current) {
            const yAxis = d3.axisLeft(yScale)
                .tickValues(stops.map(s => s.distance_from_start))
                .tickFormat((d) => {
                    const stop = stops.find(s => s.distance_from_start === d);
                    return stop ? stop.name : '';
                });

            const g = d3.select(yAxisRef.current);
            g.selectAll("*").remove(); // Очищення попереднього рендеру
            g.call(yAxis)
                .selectAll("text")
                .style("font-size", "12px")
                .style("fill", "var(--text-primary)");
        }
    }, [xScale, yScale, stops]);

    return (
        <div className="marey-diagram-container">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                    
                    {/* Рендеринг осей (D3 + React ref) */}
                    <g 
                        ref={xAxisRef} 
                        transform={`translate(0,${innerHeight})`} 
                        className="axis x-axis"
                    />
                    <g 
                        ref={yAxisRef} 
                        className="axis y-axis"
                    />

                    {/* Горизонтальні лінії для зупинок (React) */}
                    {stops.map(stop => (
                        <line
                            key={`grid-${stop.id}`}
                            x1={0}
                            x2={innerWidth}
                            y1={yScale(stop.distance_from_start)}
                            y2={yScale(stop.distance_from_start)}
                            stroke="var(--grid-line-color, #e0e0e0)"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Рендеринг шляхів рейсів (React + D3 Line Generator) */}
                    {trips.map(trip => {
                        const pathData = lineGenerator(trip.events);
                        if (!pathData) return null;

                        // Визначаємо, чи містить рейс запізнення/фактичні дані
                        const isActual = trip.events.some(e => e.is_actual);

                        return (
                            <path
                                key={trip.id}
                                d={pathData}
                                fill="none"
                                stroke={isActual ? "var(--accent-color, #ff5722)" : "var(--primary-color, #1976d2)"}
                                strokeWidth={isActual ? 3 : 2}
                                opacity={isActual ? 1 : 0.6}
                                className="trip-line"
                            >
                                <title>Борт: {trip.vehicle_id}</title>
                            </path>
                        );
                    })}

                    {/* Рендеринг точок подій (React) */}
                    {trips.flatMap(trip => 
                        trip.events.map((event, idx) => {
                            const stop = stops.find(s => s.id === event.stop_id);
                            if (!stop) return null;

                            return (
                                <circle
                                    key={`${trip.id}-${idx}`}
                                    cx={xScale(new Date(event.timestamp * 1000))}
                                    cy={yScale(stop.distance_from_start)}
                                    r={event.is_actual ? 4 : 3}
                                    fill={event.is_actual ? "var(--accent-color, #ff5722)" : "var(--bg-color, #fff)"}
                                    stroke={event.is_actual ? "var(--bg-color, #fff)" : "var(--primary-color, #1976d2)"}
                                    strokeWidth={2}
                                    className="trip-point"
                                >
                                    <title>Борт {trip.vehicle_id} о {new Date(event.timestamp * 1000).toLocaleTimeString()}</title>
                                </circle>
                            );
                        })
                    )}
                </g>
            </svg>
        </div>
    );
};
