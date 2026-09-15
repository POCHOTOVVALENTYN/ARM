import React from 'react'
import * as d3 from 'd3'
import {
  useMareyDiagramLogic,
  type Stop,
  type TripEvent,
  type MareyTrip
} from '../../hooks/useMareyDiagramLogic'
import './MareyDiagram.css'

export type { Stop, TripEvent, MareyTrip }

interface MareyDiagramProps {
  width?: number
  height?: number
  routeId?: string
}

export const MareyDiagram: React.FC<MareyDiagramProps> = ({ 
  width = 1200, 
  height = 700,
  routeId = '7'
}) => {
  const {
    routes,
    selectedRoute,
    handleRouteChange,
    stops,
    trips,
    margin,
    innerWidth,
    innerHeight,
    xAxisRef,
    yAxisRef,
    xScale,
    yScale,
    lineGenerator,
    nowX,
    nowSec,
    isNowVisible,
    isDarkTheme
  } = useMareyDiagramLogic({ width, height, routeId })

  return (
    <div 
      className="marey-diagram-container flex flex-col space-y-3 font-sans"
      role="region"
      aria-label="Інтерактивний графік руху транспорту Марея"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <label htmlFor="marey-route-select" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Маршрут:
          </label>
          <select
            id="marey-route-select"
            value={selectedRoute}
            onChange={(e) => handleRouteChange(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {routes.map((r) => {
              const rNum = r.number || r.id
              const isTram = r.type === 'tram'
              return (
                <option key={r.id} value={String(r.id)}>
                  {isTram ? '🚊 Трамвай' : '🚎 Тролейбус'} №{rNum} {r.name ? `(${r.name})` : ''}
                </option>
              )
            })}
          </select>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
          <div>
            Рейсів на графіку: <span className="text-blue-600 dark:text-blue-400 font-black">{trips.length}</span>
          </div>
          {isNowVisible && (
            <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Поточний час активний</span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        {trips.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Для маршруту №{selectedRoute} розклад на поточну добу ще не згенеровано.
          </div>
        ) : (
          <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`Графік руху рейсів для маршруту №${selectedRoute}`}
          >
            <g transform={`translate(${margin.left},${margin.top})`}>
              {/* Горизонтальні лінії для зупинок */}
              {stops.map((stop) => (
                <line
                  key={`grid-${stop.id}`}
                  x1={0}
                  x2={innerWidth}
                  y1={yScale(stop.distance_from_start)}
                  y2={yScale(stop.distance_from_start)}
                  stroke={isDarkTheme ? '#334155' : '#E2E8F0'}
                  strokeDasharray="3 3"
                />
              ))}

              {/* Лінія поточного часу (Now Needle) */}
              {isNowVisible && (
                <g className="now-needle">
                  <line
                    x1={nowX}
                    x2={nowX}
                    y1={0}
                    y2={innerHeight}
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                  <rect
                    x={nowX - 25}
                    y={-22}
                    width={50}
                    height={18}
                    rx={4}
                    fill="#EF4444"
                  />
                  <text
                    x={nowX}
                    y={-10}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize={10}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {d3.timeFormat('%H:%M')(new Date(nowSec * 1000))}
                  </text>
                </g>
              )}

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
              {trips.map((trip) => {
                const pathData = lineGenerator(trip.events)
                if (!pathData) {
                  return null
                }

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
                )
              })}

              {/* Вузлові точки прибуття */}
              {trips.flatMap((trip) => 
                trip.events.map((event, idx) => {
                  const stop = stops.find((s) => s.id === event.stop_id)
                  if (!stop) {
                    return null
                  }

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
                  )
                })
              )}
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}

export default MareyDiagram
