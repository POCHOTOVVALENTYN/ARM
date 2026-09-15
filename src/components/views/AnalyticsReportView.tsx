import React from 'react'
import { useAnalyticsReportLogic } from '../../hooks/useAnalyticsReportLogic'
import { AnalyticsReportHeader } from '../analytics/AnalyticsReportHeader'
import { AnalyticsReportKpiGrid } from '../analytics/AnalyticsReportKpiGrid'
import { AnalyticsPerformanceChart } from '../analytics/AnalyticsPerformanceChart'
import { AnalyticsIncidentsPieChart } from '../analytics/AnalyticsIncidentsPieChart'
import { AnalyticsRouteTable } from '../analytics/AnalyticsRouteTable'
import { GlobalLoader } from '../GlobalLoader'

export const AnalyticsReportView: React.FC = () => {
  const {
    targetDate,
    chartType,
    sortField,
    sortAsc,
    networkKPI,
    sortedPerformanceData,
    incidentPieData,
    incidentStats,
    isLoading,
    handleSort,
    handleDateChange,
    handleChartTypeChange,
    handlePrint,
    handleExportCSV
  } = useAnalyticsReportLogic()

  return (
    <div className="space-y-5 font-sans max-w-[1920px] mx-auto pb-6">
      {/* 1. Шапка аналітики (приховується при друку) */}
      <AnalyticsReportHeader
        targetDate={targetDate}
        hasData={sortedPerformanceData.length > 0}
        onDateChange={handleDateChange}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      {/* 2. Основний вміст звіту */}
      <div className="space-y-4">
        {isLoading && <GlobalLoader message="Агрегація аналітичних даних КП «ОМЕТ»..." />}

        {/* 4 Карточки KPI */}
        <AnalyticsReportKpiGrid
          networkKPI={networkKPI}
          incidentStats={incidentStats}
        />

        {/* Графіки та Діаграми */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnalyticsPerformanceChart
            data={sortedPerformanceData}
            chartType={chartType}
            targetDate={targetDate}
            onChartTypeChange={handleChartTypeChange}
          />

          <AnalyticsIncidentsPieChart
            data={incidentPieData}
            incidentStats={incidentStats}
            targetDate={targetDate}
          />
        </div>

        {/* Детальна таблиця аналізу маршрутів з сортуванням */}
        <AnalyticsRouteTable
          data={sortedPerformanceData}
          targetDate={targetDate}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
        />
      </div>
    </div>
  )
}

export default AnalyticsReportView
