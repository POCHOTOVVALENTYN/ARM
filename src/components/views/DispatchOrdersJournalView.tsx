import React from 'react'
import { useDispatchOrdersJournalLogic, type DispatchOrder, type DispatchStats } from '../../hooks/useDispatchOrdersJournalLogic'
import { DispatchOrdersToolbar } from '../dispatcher/DispatchOrdersToolbar'
import { DispatchOrdersTable } from '../dispatcher/DispatchOrdersTable'
import { CreateDispatchOrderModal } from '../modals/CreateDispatchOrderModal'

export type { DispatchOrder, DispatchStats }

export const DispatchOrdersJournalView: React.FC = () => {
  const {
    routes,
    orders,
    stats,
    isCreateModalOpen,
    selectedDate,
    selectedRoute,
    selectedType,
    selectedStatus,
    searchQuery,
    fetchOrders,
    handleCompleteOrder,
    handleCancelOrder,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleDateChange,
    handleRouteChange,
    handleTypeChange,
    handleStatusChange,
    handleSearchChange,
    handlePrint,
    handleExportCSV
  } = useDispatchOrdersJournalLogic()

  const handleOrderCreated = () => {
    void fetchOrders()
  }

  return (
    <div className="space-y-4 font-sans">
      <DispatchOrdersToolbar
        routes={routes}
        stats={stats}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedRoute={selectedRoute}
        onRouteChange={handleRouteChange}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        onOpenCreateModal={handleOpenCreateModal}
      />

      <DispatchOrdersTable
        orders={orders}
        onCompleteOrder={handleCompleteOrder}
        onCancelOrder={handleCancelOrder}
      />

      <CreateDispatchOrderModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleOrderCreated}
      />
    </div>
  )
}

export default DispatchOrdersJournalView
