import React, { useEffect, useState, useRef } from 'react'
import { useScheduleStore, UserRole, ThemeMode } from '../store/useScheduleStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTelemetryStore } from '../store/useTelemetryStore'
import { toast } from 'sonner'
import { downloadGtfsZip } from '../services/gtfsApi'
import { 
  Activity, 
  BookOpen, 
  Clock, 
  FileText, 
  Radio, 
  Settings, 
  ShieldAlert, 
  Users, 
  Wifi, 
  Layers, 
  MapPin, 
  Bus, 
  Zap, 
  Download, 
  UserCheck, 
  Table as TableIcon,
  ChevronDown,
  LayoutDashboard,
  Lock,
  LogOut,
  Palette,
  Sun,
  Moon,
  Eye,
  Sparkles,
  CheckCircle2,
  Archive,
  RefreshCw,
  FileSpreadsheet,
  Settings2,
  Scissors,
  Database,
  Smartphone,
  Share2
} from 'lucide-react'

interface HeaderProps {
  onOpenReport?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenReport }) => {
  const { user: authUser, isAuthenticated, logout } = useAuthStore()
  const {
    currentPath,
    setPath,
    userRole,
    user,
    theme,
    setTheme,
    conflicts,
  } = useScheduleStore()

  const isTelemetryConnected = useTelemetryStore((state) => state.isConnected)

  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(null)

  const headerRef = useRef<HTMLDivElement>(null)

  const isNight = theme === 'night-dispatch' || theme === 'dark'


  useEffect(() => {
    const effectiveTheme = theme || 'omet-clean'
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    document.body.setAttribute('data-theme', effectiveTheme)
    if (effectiveTheme === 'night-dispatch' || effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [theme])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false)
        setOpenGroupIdx(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isExportingGtfs, setIsExportingGtfs] = useState(false)

  const handleExportGtfs = async () => {
    if (isExportingGtfs) return
    setIsExportingGtfs(true)
    const toastId = toast.loading('Формування стандартизованого GTFS архіву Одеси...')
    try {
      await downloadGtfsZip()
      toast.success('Офіційний GTFS архів успішно згенеровано та завантажено!', { id: toastId })
    } catch (err: any) {
      toast.error(`Помилка генерації GTFS: ${err?.message || 'Спробуйте пізніше'}`, { id: toastId })
    } finally {
      setIsExportingGtfs(false)
    }
  }

  const NAV_GROUPS: { label: string; icon: any; superuserOnly?: boolean; items?: { label: string; path: string; icon: any }[]; path?: string }[] = [
    {
      label: 'Аналітика',
      icon: LayoutDashboard,
      items: [
        { label: 'Головний Дашборд KPI', path: '/', icon: LayoutDashboard },
        { label: 'Звітність та Регулярність (OTP)', path: '/analytics', icon: FileSpreadsheet },
      ],
    },
    {
      label: 'Диспетчерська',
      icon: Activity,
      items: [
        { label: 'Карта Руху (Wialon Live GIS)', path: '/dispatch/map', icon: MapPin },
        { label: 'CAD/AVL Матриця та Відхилення', path: '/dispatch/matrix', icon: TableIcon },
        { label: 'Діаграма Ґантта Змін', path: '/dispatch/gantt', icon: Clock },
        { label: 'Журнал Розпоряджень', path: '/dispatch/orders', icon: FileText },
      ],
    },
    {
      label: 'Планування',
      icon: Layers,
      items: [
        { label: 'Конструктор нарядів', path: '/planning/parameters', icon: Settings2 },
        { label: 'Активні наряди маршрутів', path: '/planning/active-duties', icon: Zap },
        { label: 'Зведена таблиця рейсів', path: '/planning/matrix', icon: TableIcon },
        { label: 'Конструктор Змін & КПЗ', path: '/planning/shifts', icon: Scissors },
        { label: 'Синхронізація «Звʼязок»', path: '/planning/interline', icon: Radio },
        { label: 'Архів розкладів та нарядів', path: '/planning/archive', icon: Archive },
      ],
    },
    {
      label: 'Довідники Мережі',
      icon: Settings,
      superuserOnly: true,
      items: [
        { label: 'Реєстр Маршрутів (Паспорти та КТ)', path: '/settings/routes', icon: Settings },
        { label: 'Зупинки, Контрольні точки та ДП', path: '/settings/stops', icon: MapPin },
        { label: 'Спільні зупинки маршрутів', path: '/settings/shared-stops', icon: Share2 },
        { label: 'Депо та Матриця нульових рейсів', path: '/settings/depots', icon: Bus },
        { label: 'Колійні Вузли та Звʼязки', path: '/settings/intersections', icon: Layers },
        { label: 'Пункти та Їдальні Обіду', path: '/settings/breaks', icon: Clock },
      ],
    },
    {
      label: 'Персонал та Водії',
      icon: Users,
      items: [
        { label: 'Добова рознарядка (Призначення)', path: '/crew/assignment', icon: UserCheck },
        { label: 'Бортовий термінал водія (PWA)', path: '/crew/terminal', icon: Smartphone },
        { label: 'Маршрутна книжка водія (КТ)', path: '/crew/schedule-book', icon: BookOpen },
        { label: 'Табелювання та Реєстр змін', path: '/crew/roster', icon: Users },
      ],
    },
    {
      label: 'Адміністрування',
      icon: Lock,
      superuserOnly: true,
      items: [
        { label: 'Користувачі та Права (RBAC)', path: '/admin/users', icon: Users },
        { label: 'Рухомий склад (Вагони)', path: '/admin/vehicles', icon: Bus },
        { label: 'Реєстр водіїв', path: '/admin/drivers', icon: UserCheck },
        { label: 'Типи нарядів (КЗпП)', path: '/admin/duty-types', icon: Layers },
        { label: 'Резервне копіювання БД', path: '/admin/backup', icon: Database },
      ],
    },
  ];

  const visibleNavGroups = NAV_GROUPS.filter((g) => !g.superuserOnly || authUser?.is_superuser);

  return (
    <header ref={headerRef} className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-50 shadow-xs font-sans">
      {/* Top Application Header Banner */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        {/* Brand & System Identifier */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setPath('/')}>
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                КП «ОМЕТ»
              </h1>
              <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 shadow-2xs uppercase tracking-wider">
                СЛУЖБА РУХУ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans mt-0.5 flex items-center space-x-1.5">
              <span>АРМ «Розклади»</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 shadow-2xs">v2.5</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Quick Theme Switcher Button */}
          <button
            onClick={() => {
              const nextTheme = isNight ? 'omet-clean' : 'night-dispatch'
              localStorage.setItem('omet_theme', nextTheme)
              setTheme(nextTheme)
              useSettingsStore.getState().setTheme(nextTheme === 'night-dispatch' ? 'dark' : 'light')

              const root = document.documentElement
              root.classList.remove('light', 'dark')
              document.body.classList.remove('light', 'dark')

              if (nextTheme === 'night-dispatch') {
                root.classList.add('dark')
                document.body.classList.add('dark')
                root.setAttribute('data-theme', 'night-dispatch')
                document.body.setAttribute('data-theme', 'night-dispatch')
              } else {
                root.classList.remove('dark')
                document.body.classList.remove('dark')
                root.setAttribute('data-theme', 'omet-clean')
                document.body.setAttribute('data-theme', 'omet-clean')
              }
            }}
            aria-label={isNight ? 'Перемкнути на світлу тему' : 'Перемкнути на нічну тему'}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-slate-700 text-slate-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-700 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all shadow-2xs"
            title="Швидке перемикання теми (Світла / Нічна)"
          >
            {isNight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>Світла тема</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span>Нічна тема</span>
              </>
            )}
          </button>

          {/* User Account / Role Pill Button */}
          <button
            onClick={() => setPath('/login')}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-700 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all shadow-2xs"
            title="Обліковий запис користувача"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{authUser?.full_name || authUser?.username || user.name}</span>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 uppercase">
              {authUser?.is_superuser ? 'Admin' : (authUser ? 'Dispatcher' : userRole)}
            </span>
          </button>

          {/* Logout Button */}
          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                setPath('/login');
              }}
              className="flex items-center space-x-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shadow-2xs"
              title="Вийти з системи"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Вихід</span>
            </button>
          )}

          {/* Quick Actions Bar */}
          <div className="flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
            {/* Analytics OTP Report Direct Navigation */}
            <button
              type="button"
              onClick={() => setPath('/analytics')}
              title="Звітність регулярності руху та OTP"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs cursor-pointer transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Звіт OTP</span>
            </button>

            {/* GTFS Open Data Export Button */}
            <button
              type="button"
              onClick={handleExportGtfs}
              disabled={isExportingGtfs}
              title="Завантажити офіційний GTFS архів КП «ОМЕТ» для Google Transit та Open Data"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
              tabIndex={0}
              aria-label="Завантажити GTFS архів"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isExportingGtfs ? 'Експорт...' : 'GTFS Zip'}</span>
            </button>
          </div>

          {/* WebSocket Real-time Status Badge */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-2xs transition-all ${
              isTelemetryConnected
                ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
            }`}
            title={isTelemetryConnected ? 'WebSocket зʼєднання активне: живі телеметрія та накази' : 'WebSocket очікує підключення або повторна спроба'}
            tabIndex={0}
            aria-label={isTelemetryConnected ? 'WebSocket зʼєднання активне' : 'WebSocket зʼєднання неактивне'}
          >
            <span className="relative flex h-2 w-2">
              {isTelemetryConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isTelemetryConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <Wifi className="w-3.5 h-3.5" />
            <span>{isTelemetryConnected ? 'WS Live' : 'WS Offline'}</span>
          </div>

          {/* Conflict Indicator Badge */}
          {conflicts.length > 0 ? (
            <div
              onClick={() => setPath('/planning/validate')}
              className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-xl text-rose-700 dark:text-rose-400 font-extrabold cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Конфліктів: {conflicts.length}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 font-extrabold shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Без конфліктів</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-slate-50/95 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shadow-2xs px-4 sm:px-6 lg:px-8 xl:px-10 relative z-30">
        <nav className="w-full flex items-center space-x-2 py-2 text-xs font-bold flex-wrap">
          {visibleNavGroups.map((group, idx) => {
            const GroupIcon = group.icon;

            if (group.path) {
              const isActive = currentPath === group.path;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setPath(group.path!);
                    setOpenGroupIdx(null);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold border-2 border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-600 hover:bg-blue-50/80 dark:hover:bg-slate-700 font-bold'
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span>{group.label}</span>
                </button>
              );
            }

            const isOpen = openGroupIdx === idx;
            const hasActiveChild = group.items?.some((item) => item.path === currentPath);

            return (
              <div key={idx} className="relative">
                <button
                  onClick={() => setOpenGroupIdx(isOpen ? null : idx)}
                  onMouseEnter={() => setOpenGroupIdx(idx)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
                    hasActiveChild
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold border-2 border-blue-600 shadow-md shadow-blue-600/20'
                      : isOpen
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-2 border-blue-400 dark:border-blue-700 font-extrabold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-600 hover:bg-blue-50/80 dark:hover:bg-slate-700 font-bold'
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hasActiveChild ? 'text-white' : 'text-blue-600 dark:text-blue-400'} ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div
                    onMouseLeave={() => setOpenGroupIdx(null)}
                    className="absolute left-0 top-full mt-1.5 z-50 min-w-64 max-h-[calc(100vh-140px)] overflow-y-auto bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-slate-800 rounded-2xl shadow-[0_12px_32px_rgba(37,99,235,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.8)] p-2 space-y-1"
                  >
                    {group.items?.map((sub, sIdx) => {
                      const SubIcon = sub.icon
                      const isSubActive = currentPath === sub.path
                      return (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setPath(sub.path)
                            setOpenGroupIdx(null)
                          }}
                          tabIndex={0}
                          aria-label={sub.label}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold flex items-center space-x-2.5 transition-all cursor-pointer text-xs ${
                            isSubActive
                              ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-slate-700 shadow-2xs font-extrabold'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-blue-50/80 dark:hover:bg-slate-800 hover:text-blue-900 dark:hover:text-white border border-transparent hover:border-blue-200 dark:hover:border-slate-700'
                          }`}
                        >
                          <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-blue-700 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
