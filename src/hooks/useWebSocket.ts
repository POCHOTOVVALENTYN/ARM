// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useScheduleStore } from '../store/useScheduleStore'
import { useIncidentStore } from '../store/useIncidentStore'
import { useDriverStore } from '../store/useDriverStore'
import { useTelemetryStore, VehicleTelemetry } from '../store/useTelemetryStore'
import { useAuthStore } from '../store/useAuthStore'
import { useAlertStore } from '../store/useAlertStore'
import { toast } from 'sonner'

// Синтез звукового сигналу через Web Audio API (без зовнішніх mp3-файлів)
export const playDispatchAlertSound = (type: 'emergency' | 'notification' | 'action' = 'notification') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'emergency') {
      // Тривожна двотональна сирена (880Hz -> 440Hz)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else if (type === 'action') {
      // Диспетчерське розпорядження (659Hz E5 -> 880Hz A5)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(659.25, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.18)
    } else {
      // М'яке сповіщення (587Hz D5 -> 784Hz G5)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.09, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {
    // Тихо ігноруємо обмеження автоматичного програвання аудіо браузером
  }
}

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
      const activeToken = token || 'mock-jwt-token-active-session'
      const wsUrl = `${getBaseWsUrl()}?token=${encodeURIComponent(activeToken)}`

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

              case 'DRIVER_ALERT':
              case 'DRIVER_SOS':
              case 'driver_sos': {
                if (payload) {
                  playDispatchAlertSound('emergency')
                  toast.error(`🚨 СИГНАЛ SOS ВІД ВОДІЯ (Борт #${payload.vehicle_id}): ${payload.message || 'Екстрена зупинка на лінії'}`, {
                    duration: 10000,
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
                  playDispatchAlertSound('action')
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

              case 'DISPATCH_ORDER_EVENT':
              case 'dispatch_order_event': {
                queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] })
                queryClient.invalidateQueries({ queryKey: ['dispatch-stats'] })
                if (payload) {
                  playDispatchAlertSound('action')
                  const actionUa = payload.action === 'CREATED' 
                    ? 'Створено нове розпорядження' 
                    : payload.action === 'COMPLETED' 
                    ? 'Розпорядження виконано' 
                    : 'Розпорядження скасовано'
                  toast.info(`📋 ${actionUa} ${payload.order_number}: ${payload.order_type || payload.status} (Маршрут ${payload.route_number || payload.route_id || 'ОМЕТ'})`)
                }
                break
              }

              case 'WAYBILL_ASSIGNED':
              case 'CREW_ASSIGNED': {
                playDispatchAlertSound('notification')
                queryClient.invalidateQueries({ queryKey: ['waybills'] })
                queryClient.invalidateQueries({ queryKey: ['daily-deployments'] })
                queryClient.invalidateQueries({ queryKey: ['available-resources'] })
                queryClient.invalidateQueries({ queryKey: ['available-duties'] })
                break
              }

              case 'STATE_UPDATE':
                if (setLiveSchedule) setLiveSchedule(payload)
                break

              case 'AIR_RAID_UPDATE':
                if (payload) {
                  useAlertStore.getState().setAirRaidState(payload)
                  if (payload.active) {
                    playDispatchAlertSound('emergency')
                    toast.error('🚨 ПОВІТРЯНА ТРИВОГА! Згідно з протоколом безпеки КП «ОМЕТ» негайно виконайте знеструмлення або слідування в укриття.', {
                      duration: 12000
                    })
                  }
                }
                break

              case 'INCIDENT_UPDATE':
                useIncidentStore.getState().setIncidents(payload)
                break

              case 'NEW_INCIDENT':
              case 'new_incident':
              case 'INCIDENT_CREATED': {
                if (payload) {
                  playDispatchAlertSound('emergency')
                  addLiveIncident(payload)
                  toast.error(`🚨 Новий інцидент: ТЗ ${payload.vehicle_id || ''} — ${payload.description || payload.title || 'Подія на лінії'}`)
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

              case 'DETOUR_ACTIVATED':
              case 'DETOUR_UPDATED':
              case 'detour_updated': {
                playDispatchAlertSound('action')
                toast.info('⚡ Оновлено статус оперативних перемикань (об\'їздів).')
                queryClient.invalidateQueries({ queryKey: ['active-detours'] })
                queryClient.invalidateQueries({ queryKey: ['detours'] })
                break
              }

              case 'DETOUR_DEACTIVATED': {
                queryClient.invalidateQueries({ queryKey: ['active-detours'] })
                queryClient.invalidateQueries({ queryKey: ['detours'] })
                break
              }

              case 'ETA_UPDATE':
              case 'eta_update': {
                queryClient.invalidateQueries({ queryKey: ['control-points'] })
                queryClient.invalidateQueries({ queryKey: ['active-schedules'] })
                queryClient.invalidateQueries({ queryKey: ['active-schedule'] })
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
            console.warn('WebSocket: Потрібна авторизація (Код 1008). Перепідключення в фоновому режимі...')
          }

          if (isMounted) {
            reconnectTimeoutId = setTimeout(connect, 4000)
          }
        }

        ws.onerror = (err) => {
          console.debug('WebSocket notification:', err)
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

export default useWebSocket
