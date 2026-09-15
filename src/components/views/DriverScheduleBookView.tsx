import React from 'react'
import { useDriverScheduleBookLogic } from '../../hooks/useDriverScheduleBookLogic'
import { DriverScheduleBookToolbar } from '../planning/DriverScheduleBookToolbar'
import { DriverScheduleBookCard } from '../planning/DriverScheduleBookCard'

export const DriverScheduleBookView: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    currentRoute,
    printMode,
    dutyNumbers,
    activeDutyId,
    currentDutyBook,
    dutyBooksDict,
    handlePrintSingle,
    handlePrintBatch,
    handleSelectRoute,
    handleSelectDuty
  } = useDriverScheduleBookLogic()

  return (
    <div className="space-y-6 font-sans" role="region" aria-label="Маршрутна книжка водія">
      <DriverScheduleBookToolbar
        routes={routes}
        selectedRouteId={selectedRouteId}
        dutyNumbers={dutyNumbers}
        activeDutyId={activeDutyId}
        onSelectRoute={handleSelectRoute}
        onSelectDuty={handleSelectDuty}
        onPrintSingle={handlePrintSingle}
        onPrintBatch={handlePrintBatch}
      />

      {printMode === 'batch' ? (
        <div className="space-y-8">
          {dutyNumbers.map((dNum) => {
            const book = dutyBooksDict[dNum]
            return book ? (
              <DriverScheduleBookCard
                key={book.duty_number}
                book={book}
                routeNumber={currentRoute.number}
              />
            ) : null
          })}
        </div>
      ) : currentDutyBook ? (
        <DriverScheduleBookCard
          book={currentDutyBook}
          routeNumber={currentRoute.number}
        />
      ) : (
        <div className="p-12 text-center text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Завантаження даних розкладу...
        </div>
      )}
    </div>
  )
}

export default DriverScheduleBookView

