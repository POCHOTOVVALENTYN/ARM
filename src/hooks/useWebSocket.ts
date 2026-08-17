// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useScheduleStore } from '../store/useScheduleStore'
import { useIncidentStore } from '../store/useIncidentStore'
import { useDriverStore } from '../store/useDriverStore'
import { useTelemetryStore, VehicleTelemetry } from '../store/useTelemetryStore'
import { useAuthStore } from '../store/useAuthStore'

export const useWebSocket = (baseUrl: string) => {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const { updateVehicles, setConnectionStatus: setTelemetryConnected } = useTelemetryStore()
  const addLiveIncident = useIncidentStore((state) => state.addLiveIncident)

  const updateTelemetry = useScheduleStore(state => (state as any).updateTelemetry)
  const setLiveSchedule = useScheduleStore(state => (state as any).setLiveSchedule)
  const setValidationWarnings = useScheduleStore(state => (state as any).setValidationWarnings)

  useEffect(() => {
    if (!token) return

    let isMounted = true
    let reconnectTimeoutId: any = null

    const connect = () => {
      const wsUrl = `${baseUrl}?token=${token}`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('⚡ [WebSocket] З\'єднання встановлено')
          useDriverStore.getState().setConnectionStatus('CONNECTED')
          setTelemetryConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const payload = data.payload || data.data

            switch (data.type) {
              case 'TELEMETRY_UPDATE':
              case 'telemetry_update': {
                if (Array.isArray(payload)) {
                  updateVehicles(payload as VehicleTelemetry[])
                } else if (payload && payload.vehicle_id) {
                  updateVehicles([payload as VehicleTelemetry])
                }
                if (updateTelemetry) {
                  updateTelemetry(payload)
                }
                break
              }

              case 'STATE_UPDATE':
                if (setLiveSchedule) setLiveSchedule(payload)
                break

              case 'INCIDENT_UPDATE':
                useIncidentStore.getState().setIncidents(payload)
                break

              case 'NEW_INCIDENT':
              case 'new_incident': {
                if (payload) {
                  addLiveIncident(payload)
                  console.log(`🚨 [WebSocket] Новий інцидент: ТЗ ${payload.vehicle_id} - ${payload.description}`)
                  queryClient.invalidateQueries({ queryKey: ['active-incidents'] })
                  queryClient.invalidateQueries({ queryKey: ['incidents'] })
                }
                break
              }

              case 'INCIDENT_RESOLVED':
              case 'incident_resolved': {
                console.log('⚡ [WebSocket] Отримано сигнал incident_resolved')
                queryClient.invalidateQueries({ queryKey: ['active-incidents'] })
                queryClient.invalidateQueries({ queryKey: ['incidents'] })
                break
              }

              case 'DETOUR_UPDATED':
              case 'detour_updated': {
                console.log('⚡ [WebSocket] Отримано сигнал detour_updated. Оновлення перемикань...')
                queryClient.invalidateQueries({ queryKey: ['active-detours'] })
                break
              }

              case 'VALIDATION_WARNING':
                if (setValidationWarnings) {
                  setValidationWarnings(payload)
                  payload.forEach((warning: string) => console.warn('⚠️ [УВАГА]:', warning))
                }
                break

              case 'GEOFENCE_EVENT': {
                const { vehicle_id, event: geoEvent } = payload || {}
                if (geoEvent === 'DISPATCHED') {
                  console.log(`🚀 [ГЕОЗОНА] Вагон ${vehicle_id} ВИЇХАВ з депо на лінію!`)
                } else if (geoEvent === 'RETURNED') {
                  console.log(`🏠 [ГЕОЗОНА] Вагон ${vehicle_id} ПОВЕРНУВСЯ у депо!`)
                }
                break
              }

              case 'WAYBILL_UPDATE': {
                const updatedVehicleId = payload?.vehicle_id
                const currentBlock = useDriverStore.getState().currentBlock
                if (updatedVehicleId && currentBlock && currentBlock.block_id.includes(updatedVehicleId)) {
                  useDriverStore.getState().fetchBlock(updatedVehicleId)
                }
                break
              }

              case 'INVALIDATE_SCHEDULES':
              case 'invalidate_schedules':
              case 'SCHEDULE_DRAFT_UPDATED':
              case 'schedule_draft_updated': {
                console.log('⚡ [WebSocket] Отримано сигнал invalidate_schedules / schedule_draft_updated. Оновлення серверного кешу...')
                queryClient.invalidateQueries({ queryKey: ['active-schedules'] })
                queryClient.invalidateQueries({ queryKey: ['active-schedule'] })
                queryClient.invalidateQueries({ queryKey: ['schedule'] })
                queryClient.invalidateQueries({ queryKey: ['schedules'] })
                break
              }

              default:
                break
            }
          } catch (error) {
            console.error('Помилка парсингу WebSocket повідомлення:', error)
          }
        }

        // --- ЛОГІКА ЗАХИСТУ ВІД НЕСКІНЧЕННОГО ЦИКЛУ (BUG-B3) ---
        ws.onclose = (event) => {
          useDriverStore.getState().setConnectionStatus('OFFLINE')
          setTelemetryConnected(false)

          // Код 1008 означає Policy Violation (недійсний або прострочений токен)
          if (event.code === 1008) {
            console.error('WebSocket: Помилка авторизації. Токен недійсний або прострочено (Код 1008).')
            
            // Викликаємо logout напряму зі стору (поза контекстом React)
            useAuthStore.getState().logout()

            // Примусовий редирект на екран логіну
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }

            return // ЗУПИНЯЄМО виконання — жодних повторних підключень з невалідним токеном!
          }

          // Якщо звичайний обрив зв'язку і компонент досі змонтований — робимо реконект
          if (isMounted) {
            console.log('WebSocket disconnected. Reconnecting in 5s...')
            reconnectTimeoutId = setTimeout(connect, 5000)
          }
        }

        ws.onerror = (err) => {
          console.error('WebSocket connection error:', err)
        }
      } catch (err) {
        console.error('Не вдалося створити WebSocket:', err)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId)
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
      }
    }
  }, [baseUrl, token, updateVehicles, setTelemetryConnected, updateTelemetry, setLiveSchedule, setValidationWarnings, queryClient, addLiveIncident])

  return wsRef.current
}
