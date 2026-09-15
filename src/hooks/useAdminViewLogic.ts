import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/apiClient'
import { useScheduleStore } from '../store/useScheduleStore'
import { ConfirmModalConfig } from '../components/ConfirmActionModal'
import { toast } from 'sonner'

export type AdminTabKey = 'users' | 'routes' | 'vehicles' | 'drivers' | 'stops' | 'infra' | 'duty_types' | 'backup'

export interface AdminUserRecord {
  id: number
  username: string
  full_name: string
  role: string
  is_superuser: boolean
}

export interface UseAdminViewLogicProps {
  initialTab?: AdminTabKey
}

export interface UseAdminViewLogicReturn {
  activeTab: AdminTabKey
  setActiveTab: (tab: AdminTabKey) => void
  statusMessage: string | null
  modalConfig: ConfirmModalConfig | null
  setModalConfig: (config: ConfirmModalConfig | null) => void
  isAddUserOpen: boolean
  setIsAddUserOpen: (open: boolean) => void
  newUsername: string
  setNewUsername: (val: string) => void
  newPassword: string
  setNewPassword: (val: string) => void
  newFullName: string
  setNewFullName: (val: string) => void
  newRole: string
  setNewRole: (val: string) => void
  users: AdminUserRecord[]
  isLoadingUsers: boolean
  isRegisterPending: boolean
  handleCreateUser: (e: React.FormEvent) => void
  triggerExportBackupModal: () => void
  triggerResetSystemModal: () => void
}

export const useAdminViewLogic = ({ initialTab = 'users' }: UseAdminViewLogicProps = {}): UseAdminViewLogicReturn => {
  const queryClient = useQueryClient()
  const { liveBlocks, draftBlocks, discardDraft } = useScheduleStore()
  const [activeTab, setActiveTab] = useState<AdminTabKey>(initialTab)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [modalConfig, setModalConfig] = useState<ConfirmModalConfig | null>(null)

  // Стан модального вікна створення користувача
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('DISPATCHER')

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Запит списку користувачів з бекенду
  const { data: rawUsers = [], isLoading: isLoadingUsers } = useQuery<AdminUserRecord[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users')
      return Array.isArray(data) ? data : []
    },
    enabled: activeTab === 'users'
  })

  // Мутація створення нового користувача
  const registerMutation = useMutation({
    mutationFn: async (payload: { username: string; password: string; full_name: string; role: string; is_superuser: boolean }) => {
      const { data } = await api.post('/auth/register', payload)
      return data
    },
    onSuccess: (data) => {
      toast.success(`Користувача ${data.username} (${data.full_name}) успішно створено!`)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsAddUserOpen(false)
      setNewUsername('')
      setNewPassword('')
      setNewFullName('')
      setNewRole('DISPATCHER')
    },
    onError: (err: unknown) => {
      interface AxiosErrorType {
        response?: { data?: { detail?: string } }
        message?: string
      }
      const errorObj = err as AxiosErrorType
      toast.error(`Помилка створення користувача: ${errorObj?.response?.data?.detail || errorObj?.message || 'Помилка сервера'}`)
    }
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.warning('Заповніть обов\'язкові поля: логін та пароль')
      return
    }
    registerMutation.mutate({
      username: newUsername.trim(),
      password: newPassword.trim(),
      full_name: newFullName.trim() || newUsername.trim(),
      role: newRole,
      is_superuser: newRole === 'SUPERUSER'
    })
  }

  const executeExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: 'v2.5.0',
      city: 'Одеса',
      liveBlocks,
      draftBlocks
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `omet_backup_odesa_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    setStatusMessage('Резервну копію успішно створено та завантажено (.json)')
    setTimeout(() => setStatusMessage(null), 4000)
  }

  const triggerExportBackupModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Експорт резервної копії БД',
      description: 'Ви збираєтесь сформувати та завантажити повний файл конфігурації (.json) із розкладами, випуском та налаштуваннями КП «Одесміськелектротранс». Завантажити?',
      confirmText: 'Завантажити (.json)',
      cancelText: 'Скасувати',
      variant: 'info',
      icon: 'download',
      onConfirm: () => {
        executeExportBackup()
        setModalConfig(null)
      },
      onCancel: () => setModalConfig(null)
    })
  }

  const triggerResetSystemModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Повне очищення системи',
      description: 'Увага! Всі поточні чернетки змін, тимчасовий кеш та користувацькі коригування будуть анульовані. Систему буде повернено до базового стану м. Одеси. Виконати скидання?',
      confirmText: 'Очистити всі дані',
      cancelText: 'Скасувати',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        discardDraft()
        setStatusMessage('Систему повернено до дефолтного стану м. Одеси')
        setTimeout(() => setStatusMessage(null), 4000)
        setModalConfig(null)
      },
      onCancel: () => setModalConfig(null)
    })
  }

  return {
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
    users: rawUsers,
    isLoadingUsers,
    isRegisterPending: registerMutation.isPending,
    handleCreateUser,
    triggerExportBackupModal,
    triggerResetSystemModal
  }
}
