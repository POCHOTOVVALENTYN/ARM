import React from 'react'
import { Check } from 'lucide-react'
import { useAdminViewLogic, AdminTabKey } from '../../hooks/useAdminViewLogic'
import { AdminViewHeader } from '../admin/AdminViewHeader'
import { AdminUsersPanel } from '../admin/AdminUsersPanel'
import { AdminBackupPanel } from '../admin/AdminBackupPanel'
import { NetworkSettingsTab } from '../tabs/NetworkSettingsTab'
import { AdminDepotsManager } from '../admin/AdminDepotsManager'
import { AdminDriversManager } from '../admin/AdminDriversManager'
import { AdminStopsManager } from '../admin/AdminStopsManager'
import { AdminHubsManager } from '../admin/AdminHubsManager'
import { AdminBreakLocationsManager } from '../admin/AdminBreakLocationsManager'
import { AdminDutyTypesManager } from '../admin/AdminDutyTypesManager'
import { ConfirmActionModal } from '../ConfirmActionModal'

interface AdminViewProps {
  initialTab?: AdminTabKey
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'users' }) => {
  const {
    activeTab,
    setActiveTab,
    statusMessage,
    modalConfig,
    setModalConfig,
    isAddUserOpen,
    setIsAddUserOpen,
    newUsername,
    setNewUsername,
    newPassword,
    setNewPassword,
    newFullName,
    setNewFullName,
    newRole,
    setNewRole,
    users,
    isLoadingUsers,
    isRegisterPending,
    handleCreateUser,
    triggerExportBackupModal,
    triggerResetSystemModal
  } = useAdminViewLogic({ initialTab })

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      {/* 1. Верхня панель адміністрування та табів */}
      <AdminViewHeader 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
      />

      {statusMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Контент вибраної вкладки */}
      {activeTab === 'users' && (
        <AdminUsersPanel 
          users={users}
          isLoadingUsers={isLoadingUsers}
          isAddUserOpen={isAddUserOpen}
          isRegisterPending={isRegisterPending}
          newUsername={newUsername}
          newPassword={newPassword}
          newFullName={newFullName}
          newRole={newRole}
          onOpenAddUser={setIsAddUserOpen}
          onUsernameChange={setNewUsername}
          onPasswordChange={setNewPassword}
          onFullNameChange={setNewFullName}
          onRoleChange={setNewRole}
          onSubmitUser={handleCreateUser}
        />
      )}

      {activeTab === 'routes' && <NetworkSettingsTab initialSubTab="routes" />}

      {activeTab === 'vehicles' && <AdminDepotsManager />}

      {activeTab === 'drivers' && <AdminDriversManager />}

      {activeTab === 'stops' && <AdminStopsManager />}

      {activeTab === 'infra' && (
        <div className="space-y-4">
          <AdminHubsManager />
          <AdminBreakLocationsManager />
        </div>
      )}

      {activeTab === 'duty_types' && <AdminDutyTypesManager />}

      {activeTab === 'backup' && (
        <AdminBackupPanel 
          onTriggerExportBackup={triggerExportBackupModal}
          onTriggerResetSystem={triggerResetSystemModal}
        />
      )}

      {/* Модальне вікно підтвердження небезпечних/експортних дій */}
      {modalConfig && (
        <ConfirmActionModal {...modalConfig} />
      )}
    </div>
  )
}

export default AdminView
