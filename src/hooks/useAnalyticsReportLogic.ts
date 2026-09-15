import { useState, useMemo } from 'react'
import {
  useDailyPerformance,
  useIncidentsSummary,
  RoutePerformance,
  IncidentStats
} from './useAnalyticsQueries'

export type SortField = 'route' | 'records' | 'avg_dev' | 'max_dev' | 'otp'
export type ChartType = 'otp' | 'delays'

export interface NetworkKPI {
  avgOTP: number
  totalRecords: number
  avgDeviation: number
  maxDeviation: number
  routesCount: number
}

export interface IncidentPieItem {
  name: string
  value: number
  color: string
}

export const formatRouteLabel = (routeId: string): string => {
  const clean = String(routeId || '').trim()
  if (clean.toLowerCase().startsWith('tr') || clean.toLowerCase().startsWith('тр')) {
    return `Тролейбус №${clean.replace(/^(tr|тр)/i, '')}`
  }
  return `Трамвай №${clean}`
}

export const useAnalyticsReportLogic = () => {
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [chartType, setChartType] = useState<ChartType>('otp')
  const [sortField, setSortField] = useState<SortField>('otp')
  const [sortAsc, setSortAsc] = useState<boolean>(true)

  const { data: performanceData, isLoading: isPerfLoading } = useDailyPerformance(targetDate)
  const { data: incidentStats, isLoading: isIncLoading } = useIncidentsSummary(targetDate)

  const isLoading = isPerfLoading || isIncLoading

  // Агреговані системні показники (Network-wide KPI)
  const networkKPI: NetworkKPI = useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      return {
        avgOTP: 0,
        totalRecords: 0,
        avgDeviation: 0,
        maxDeviation: 0,
        routesCount: 0
      }
    }

    const totalRecords = performanceData.reduce((acc, curr) => acc + (curr.total_records || 0), 0)
    const weightedOTP = performanceData.reduce(
      (acc, curr) => acc + ((curr.on_time_percentage || 0) * (curr.total_records || 0)),
      0
    )
    const avgOTP = totalRecords > 0 
      ? weightedOTP / totalRecords 
      : performanceData.reduce((acc, curr) => acc + (curr.on_time_percentage || 0), 0) / performanceData.length

    const weightedDev = performanceData.reduce(
      (acc, curr) => acc + ((curr.avg_deviation_min || 0) * (curr.total_records || 0)),
      0
    )
    const avgDev = totalRecords > 0 ? weightedDev / totalRecords : 0

    const maxDev = Math.max(...performanceData.map((p) => p.max_deviation_min || 0), 0)

    return {
      avgOTP: Number.isFinite(avgOTP) ? Math.round(avgOTP * 10) / 10 : 0,
      totalRecords,
      avgDeviation: Number.isFinite(avgDev) ? Math.round(avgDev * 10) / 10 : 0,
      maxDeviation: Number.isFinite(maxDev) ? maxDev : 0,
      routesCount: performanceData.length
    }
  }, [performanceData])

  // Дані для кругової діаграми інцидентів
  const incidentPieData: IncidentPieItem[] = useMemo(() => {
    if (!incidentStats) return []
    return [
      { name: 'Вирішено', value: incidentStats.resolved_incidents || 0, color: '#10B981' },
      { name: 'В обробці', value: incidentStats.unresolved_incidents || 0, color: '#EF4444' }
    ].filter((item) => item.value > 0)
  }, [incidentStats])

  // Інтерактивно відсортовані дані по маршрутах
  const sortedPerformanceData: RoutePerformance[] = useMemo(() => {
    if (!performanceData) return []
    return [...performanceData].sort((a, b) => {
      let diff = 0
      if (sortField === 'route') {
        diff = String(a.route_id).localeCompare(String(b.route_id), undefined, { numeric: true })
      } else if (sortField === 'records') {
        diff = (a.total_records || 0) - (b.total_records || 0)
      } else if (sortField === 'avg_dev') {
        diff = (a.avg_deviation_min || 0) - (b.avg_deviation_min || 0)
      } else if (sortField === 'max_dev') {
        diff = (a.max_deviation_min || 0) - (b.max_deviation_min || 0)
      } else if (sortField === 'otp') {
        diff = (a.on_time_percentage || 0) - (b.on_time_percentage || 0)
      }
      return sortAsc ? diff : -diff
    })
  }, [performanceData, sortField, sortAsc])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
      return
    }
    setSortField(field)
    setSortAsc(true)
  }

  const handleDateChange = (date: string) => {
    setTargetDate(date)
  }

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!performanceData || performanceData.length === 0) return

    const headers = ['Маршрут', 'Перевірок зупинок', 'Сер. відхилення (хв)', 'Макс. запізнення (хв)', 'Регулярність OTP (%)']
    const rows = sortedPerformanceData.map((p) => [
      `"${formatRouteLabel(p.route_id)}"`,
      p.total_records,
      p.avg_deviation_min,
      p.max_deviation_min,
      p.on_time_percentage
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `OMET_Analytics_Report_${targetDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    targetDate,
    chartType,
    sortField,
    sortAsc,
    networkKPI,
    sortedPerformanceData,
    incidentPieData,
    incidentStats: incidentStats as IncidentStats | undefined,
    isLoading,
    handleSort,
    handleDateChange,
    handleChartTypeChange,
    handlePrint,
    handleExportCSV
  }
}
