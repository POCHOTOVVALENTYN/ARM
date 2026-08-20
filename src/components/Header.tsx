import React, { useEffect, useState, useRef } from 'react';
import { useScheduleStore, UserRole, ThemeMode } from '../store/useScheduleStore';
import { useAuthStore } from '../store/useAuthStore';
import { ConfirmActionModal, ConfirmModalConfig } from './ConfirmActionModal';
import { HistoryLogModal } from './HistoryLogModal';
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
  RotateCcw, 
  RotateCw, 
  Check, 
  X, 
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
  History,
  CheckCircle2,
  Archive,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenReport }) => {
  const { user: authUser, isAuthenticated, logout } = useAuthStore();
  const {
    currentPath,
    setPath,
    userRole,
    setUserRole,
    user,
    theme,
    setTheme,
    isDraftModified,
    historyStack,
    redoStack,
    undoLastAction,
    redoAction,
    revertToHistoryIndex,
    commitDraft,
    discardDraft,
    conflicts,
  } = useScheduleStore();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(null);
  const [modalConfig, setModalConfig] = useState<ConfirmModalConfig | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleOpenCommitModal = () => {
    const changesList = historyStack.length > 0 
      ? historyStack.map((h) => h.label) 
      : ['Модифікація нарядів вагонів та екіпажів водіїв'];

    setModalConfig({
      isOpen: true,
      title: 'Публікація графіку в БД КП «ОМЕТ»',
      badgeText: 'ГОТОВО ДО ПУБЛІКАЦІЇ',
      description: 'Ви збираєтесь застосувати чернетку змін (наряди вагонів, закріплення водіїв, розклад) до бойової бази даних КП «Одесміськелектротранс». Усі підключені диспетчери та мобільні термінали водіїв миттєво отримають новий випуск.',
      confirmText: 'Зафіксувати та Опублікувати',
      cancelText: 'Продовжити редагування',
      variant: 'success',
      icon: 'check',
      changesList,
      conflictsCount: conflicts.length,
      onConfirm: () => {
        commitDraft();
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const handleOpenDiscardModal = () => {
    const changesList = historyStack.length > 0 
      ? historyStack.map((h) => h.label) 
      : ['Незбережені зміни в чернетці'];

    setModalConfig({
      isOpen: true,
      title: 'Скидання всіх незбережених змін',
      badgeText: 'УВАГА: СКАСУВАННЯ ЧЕРНЕТКИ',
      description: 'Ви збираєтесь анулювати всі внесені коригування рейсових графіків та екіпажів водіїв і повернутися до вихідного активного розкладу.',
      confirmText: 'Скинути всі зміни',
      cancelText: 'Повернутися до чернетки',
      variant: 'danger',
      icon: 'trash',
      changesList,
      conflictsCount: conflicts.length,
      onConfirm: () => {
        discardDraft();
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const handleRequestRevertConfirm = (targetIndex: number, actionLabel: string) => {
    setIsHistoryModalOpen(false);
    setModalConfig({
      isOpen: true,
      title: 'Підтвердження відкату історії',
      description: `Ви збираєтесь повернути стан розкладу до точки: "${actionLabel}". Усі наступні зміни буде переміщено у стек Redo. Відкотити?`,
      confirmText: 'Відкотити стан',
      cancelText: 'Скасувати',
      variant: 'warning',
      icon: 'warning',
      onConfirm: () => {
        revertToHistoryIndex(targetIndex);
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const handleRequestClearConfirm = () => {
    setIsHistoryModalOpen(false);
    setModalConfig({
      isOpen: true,
      title: 'Очищення історії дій',
      description: 'Ви впевнені, що бажаєте повністю очистити історію редагувань та скасувань? Поточна чернетка залишиться активною.',
      confirmText: 'Очистити історію',
      cancelText: 'Скасувати',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        discardDraft();
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
        setOpenGroupIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        { label: 'Карта Руху (Wialon Live GPS)', path: '/dispatch/map', icon: MapPin },
        { label: 'Діаграма Ґантта Змін', path: '/dispatch/gantt', icon: Clock },
        { label: 'Оперативні розклади (Генератор)', path: '/dispatch/generator', icon: RefreshCw },
      ],
    },
    {
      label: 'Планування',
      icon: Layers,
      items: [
        { label: 'Розклади та Наряди (Робочий стіл)', path: '/planning/workspace', icon: TableIcon },
        { label: 'Архів розкладів та нарядів', path: '/planning/archive', icon: Archive },
      ],
    },
    {
      label: 'Довідники Мережі',
      icon: Settings,
      superuserOnly: true,
      items: [
        { label: 'Реєстр Зупинок та КП', path: '/settings/stops', icon: MapPin },
        { label: 'Реєстр Маршрутів (Паспорти)', path: '/settings/routes', icon: Settings },
        { label: 'Колійні Вузли та Стрілки', path: '/settings/intersections', icon: Layers },
        { label: 'Депо та Нульові рейси', path: '/settings/depots', icon: Bus },
        { label: 'Пункти та Їдальні Обіду', path: '/settings/breaks', icon: Clock },
      ],
    },
    {
      label: 'Персонал та Водії',
      icon: Users,
      items: [
        { label: 'Добова рознарядка (Призначення)', path: '/crew/assignment', icon: UserCheck },
        { label: 'Розклад рейсів (Книжка водія)', path: '/crew/schedule-book', icon: BookOpen },
        { label: 'Бортовий термінал водія', path: '/driver', icon: Radio },
      ],
    },
    {
      label: 'Адміністрування',
      icon: Lock,
      superuserOnly: true,
      items: [
        { label: 'Панель керування & Центр даних', path: '/admin', icon: Lock },
      ],
    },
  ];

  const visibleNavGroups = NAV_GROUPS.filter((g) => !g.superuserOnly || authUser?.is_superuser);

  return (
    <header ref={headerRef} className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-50 shadow-xs font-sans">
      {/* Top Application Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Brand & System Identifier */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setPath('/')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                КП «ОМЕТ»
              </h1>
              <span className="text-[10px] font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs uppercase tracking-wider">
                СЛУЖБА РУХУ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans mt-0.5 flex items-center space-x-1.5">
              <span>АРМ «Розклади»</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200 shadow-2xs">v2.5</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Quick Theme Switcher Button */}
          <button
            onClick={() => {
              const nextTheme = theme === 'night-dispatch' ? 'omet-clean' : 'night-dispatch';
              setTheme(nextTheme);
              document.documentElement.setAttribute('data-theme', nextTheme);
              document.body.setAttribute('data-theme', nextTheme);
            }}
            className="flex items-center space-x-1.5 bg-white hover:bg-blue-50/80 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all shadow-2xs"
            title="Швидке перемикання теми"
          >
            {theme === 'night-dispatch' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                <span>Світла</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-700" />
                <span>Темна</span>
              </>
            )}
          </button>

          {/* User Account / Role Pill Button */}
          <button
            onClick={() => setPath('/login')}
            className="flex items-center space-x-1.5 bg-white hover:bg-blue-50/80 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all shadow-2xs"
            title="Обліковий запис користувача"
          >
            <Lock className="w-3.5 h-3.5 text-blue-700" />
            <span>{authUser?.full_name || authUser?.username || user.name}</span>
            <span className="text-[10px] bg-blue-50 text-blue-800 font-extrabold px-1.5 py-0.2 rounded border border-blue-200 uppercase">
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
              className="flex items-center space-x-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all shadow-2xs"
              title="Вийти з системи"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Вихід</span>
            </button>
          )}

          {/* History & Draft Tools */}
          <div className="flex items-center space-x-1 bg-white border border-blue-200 rounded-xl p-1 shadow-2xs">
            {isDraftModified && (
              <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-lg text-[10px] animate-pulse uppercase tracking-wider shrink-0">
                Чернетка
              </span>
            )}

            {/* Undo */}
            <button
              onClick={undoLastAction}
              disabled={historyStack.length === 0}
              title="Скасувати останню дію"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                historyStack.length > 0
                  ? 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs cursor-pointer active:scale-95'
                  : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
              <span>Скасувати ({historyStack.length})</span>
            </button>

            {/* Redo */}
            <button
              onClick={redoAction}
              disabled={redoStack.length === 0}
              title="Повернути скасовану дію"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                redoStack.length > 0
                  ? 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs cursor-pointer active:scale-95'
                  : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-700" />
              <span>Повернути ({redoStack.length})</span>
            </button>

            {/* History Modal Trigger */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              title="Історія редагувань"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs cursor-pointer transition-all"
            >
              <History className="w-3.5 h-3.5 text-blue-700" />
              <span>Історія</span>
            </button>

            {/* Analytics OTP Report Modal Trigger */}
            <button
              onClick={onOpenReport}
              title="Швидкий аналітичний звіт та OTP"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 shadow-2xs cursor-pointer transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-blue-700" />
              <span>Звіт OTP</span>
            </button>

            {/* Commit & Discard Draft */}
            {isDraftModified && (
              <>
                <button
                  onClick={handleOpenCommitModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer text-[11px] transition-all shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Коміт</span>
                </button>

                <button
                  onClick={handleOpenDiscardModal}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-lg flex items-center space-x-1 cursor-pointer text-[11px] transition-all shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Скинути</span>
                </button>
              </>
            )}
          </div>

          {/* Conflict Indicator Badge */}
          {conflicts.length > 0 ? (
            <div
              onClick={() => setPath('/planning/validate')}
              className="flex items-center space-x-1.5 bg-white border border-rose-300 px-3 py-1.5 rounded-xl text-rose-700 font-extrabold cursor-pointer hover:bg-rose-50 transition-colors shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Конфліктів: {conflicts.length}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-white border border-emerald-300 px-3 py-1.5 rounded-xl text-emerald-700 font-extrabold shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Без конфліктів</span>
            </div>
          )}

          {/* Solid White / Blue Border Action Button */}
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-extrabold px-4 py-1.5 rounded-xl shadow-2xs transition-all text-xs cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Звіт ТЗ</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-blue-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(37,99,235,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] px-4 sm:px-6 lg:px-8 relative z-30">
        <nav className="max-w-7xl mx-auto flex items-center space-x-2 py-2 text-xs font-bold flex-wrap">
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
                      ? 'bg-blue-600 text-white border-2 border-blue-600 font-extrabold shadow-xs'
                      : 'bg-white text-blue-700 hover:text-blue-900 border border-blue-400 hover:border-blue-600 hover:bg-blue-50/80 font-bold'
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
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
                      ? 'bg-blue-600 text-white border-2 border-blue-600 font-extrabold shadow-xs'
                      : isOpen
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-extrabold'
                      : 'bg-white text-blue-700 hover:text-blue-900 border border-blue-400 hover:border-blue-600 hover:bg-blue-50/80 font-bold'
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-white' : 'text-blue-600'}`} />
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hasActiveChild ? 'text-white' : 'text-blue-600'} ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div
                    onMouseLeave={() => setOpenGroupIdx(null)}
                    className="absolute left-0 top-full mt-1.5 z-50 min-w-64 bg-white border-2 border-blue-200 rounded-2xl shadow-[0_12px_32px_rgba(37,99,235,0.18)] p-2 space-y-1"
                  >
                    {group.items?.map((sub, sIdx) => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentPath === sub.path;
                      return (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setPath(sub.path);
                            setOpenGroupIdx(null);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold flex items-center space-x-2.5 transition-all cursor-pointer text-xs ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs font-extrabold'
                              : 'bg-white text-slate-800 hover:bg-blue-50/80 hover:text-blue-900 border border-transparent hover:border-blue-200'
                          }`}
                        >
                          <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-blue-700' : 'text-blue-600'}`} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {modalConfig && <ConfirmActionModal {...modalConfig} />}

      <HistoryLogModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onRequestRevertConfirm={handleRequestRevertConfirm}
        onRequestClearConfirm={handleRequestClearConfirm}
      />
    </header>
  );
};
