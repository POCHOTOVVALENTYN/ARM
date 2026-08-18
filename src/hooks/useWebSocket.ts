// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useScheduleStore } from '../store/useScheduleStore'
import { useIncidentStore } from '../store/useIncidentStore'
import { useDriverStore } from '../store/useDriverStore'
import { useTelemetryStore, VehicleTelemetry } from '../store/useTelemetryStore'
import { useAuthStore } from '../store/useAuthStore'
import { toast } from 'sonner'

export const useWebSocket = (customBaseUrl?: string) => {
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

    // Динамічне визначення протоколу (ws/wss) та хоста для продакшену
    const getBaseWsUrl = () => {
      if (customBaseUrl && (customBaseUrl.startsWith('ws://') || customBaseUrl.startsWith('wss://'))) {
        return customBaseUrl
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.port === '5173' || window.location.port === '3000'
        ? `${window.location.hostname}:8000`
        : window.location.host
      return `${protocol}//${host}/ws`
    }

    const connect = () => {
      const wsUrl = `${getBaseWsUrl()}?token=${token}`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('⚡ [WebSocket] З\'єднання з диспетчерським сервером ОМЕТ встановлено')
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

              case 'DRIVER_ALERT': {
                if (payload) {
                  toast.error(`🚨 СИГНАЛ ВІД ВОДІЯ (Борт #${payload.vehicle_id}): ${payload.message}`, {
                    duration: 8000,
                  })
                  queryClient.invalidateQueries({ queryKey: ['driver-alerts'] })
                  queryClient.invalidateQueries({ queryKey: ['active-driver-alerts'] })
                }
                break
              }

              case 'DRIVER_ALERT_RESOLVED': {
                queryClient.invalidateQueries({ queryKey: ['driver-alerts'] })
                queryClient.invalidateQueries({ queryKey: ['active-driver-alerts'] })
                break
              }

              case 'DISPATCHER_DIRECTIVE': {
                if (payload) {
                  toast.warning(`📢 НАКАЗ ДИСПЕТЧЕРА (${payload.dispatcher_name || 'Диспетчер'}): ${payload.message}`, {
                    duration: 10000,
                  })
                  queryClient.invalidateQueries({ queryKey: ['driver-directives'] })
                }
                break
              }

              case 'DIRECTIVE_ACK': {
                queryClient.invalidateQueries({ queryKey: ['driver-directives'] })
                toast.success(`✓ Водій борта #${payload.vehicle_id} підтвердив отримання вказівки.`)
                break
              }

              case 'WAYBILL_ASSIGNED':
              case 'CREW_ASSIGNED': {
                queryClient.invalidateQueries({ queryKey: ['waybills'] })
                queryClient.invalidateQueries({ queryKey: ['daily-deployments'] })
                queryClient.invalidateQueries({ queryKey: ['available-resources'] })
                queryClient.invalidateQueries({ queryKey: ['available-duties'] })
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
                  toast.error(`🚨 Авто-інцидент: ТЗ ${payload.vehicle_id} - ${payload.description}`)
                  queryClient.invalidateQueries({ queryKey: ['active-incidents'] })
                  queryClient.invalidateQueries({ queryKey: ['incidents'] })
                }
                break
              }

              case 'INCIDENT_RESOLVED':
              case 'incident_resolved': {
                queryClient.invalidateQueries({ queryKey: ['active-incidents'] })
                queryClient.invalidateQueries({ queryKey: ['incidents'] })
                break
              }

              case 'DETOUR_UPDATED':
              case 'detour_updated': {
                toast.info('⚡ Оновлено статус оперативних перемикань (об\'їздів).')
                queryClient.invalidateQueries({ queryKey: ['active-detours'] })
                queryClient.invalidateQueries({ queryKey: ['detours'] })
                break
              }

              case 'VALIDATION_WARNING':
                if (setValidationWarnings) {
                  setValidationWarnings(payload)
                  payload.forEach((warning: string) => console.warn('⚠️ [УВАГА]:', warning))
                }
                break

              case 'INVALIDATE_SCHEDULES':
              case 'invalidate_schedules':
              case 'SCHEDULE_DRAFT_UPDATED':
              case 'schedule_draft_updated': {
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

        ws.onclose = (event) => {
          useDriverStore.getState().setConnectionStatus('OFFLINE')
          setTelemetryConnected(false)

          if (event.code === 1008) {
            console.error('WebSocket: Помилка авторизації (Код 1008).')
            useAuthStore.getState().logout()
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return
          }

          if (isMounted) {
            reconnectTimeoutId = setTimeout(connect, 5000)
          }
        }

        ws.onerror = (err) => {
          console.error('WebSocket error:', err)
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
  }, [customBaseUrl, token, updateVehicles, setTelemetryConnected, updateTelemetry, setLiveSchedule, setValidationWarnings, queryClient, addLiveIncident])

  return wsRef.current
}
