import React, { useState, useEffect } from 'react'
import { Route } from '../../types'
import { useStationStore } from '../../store/useStationStore'
import { 
  FileText, 
  MapPin, 
  Navigation, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Zap, 
  ListOrdered, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw,
  GitFork,
  Radio
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  getRouteVariants, 
  switchRouteVariant, 
  recalculateAllCorridors, 
  RouteVariantsResponse 
} from '../../services/routesApi'

interface RoutePassportProps {
  route: Route
  onUpdateRoute: (updatedRoute: Route) => void
}

export const RoutePassport: React.FC<RoutePassportProps> = ({
  route,
  onUpdateRoute,
}) => {
  const stations = useStationStore((state) => state.stations)
  const [selectedNewStationId, setSelectedNewStationId] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [variantsData, setVariantsData] = useState<RouteVariantsResponse | null>(null)
  const [isSwitchingVariant, setIsSwitchingVariant] = useState<boolean>(false)
  const [isSyncingTopology, setIsSyncingTopology] = useState<boolean>(false)

  const routeIdentifier = route.number || route.id

  useEffect(() => {
    let isMounted = true
    const loadVariants = async () => {
      if (!routeIdentifier) return
      const data = await getRouteVariants(routeIdentifier)
      if (isMounted) {
        setVariantsData(data)
      }
    }
    loadVariants()
    return () => {
      isMounted = false
    }
  }, [routeIdentifier, route.name])

  const primaryTerminal = stations.find((s) => s.id === route.primaryTerminalId)?.name || route.primaryTerminalId
  const secondaryTerminal = stations.find((s) => s.id === route.secondaryTerminalId)?.name || route.secondaryTerminalId

  const handleSwitchPreset = async (variantKey: string) => {
    setIsSwitchingVariant(true)
    const toastId = toast.loading('Перемикання схеми курсування маршруту...')
    try {
      const res = await switchRouteVariant(routeIdentifier, variantKey)
      if (res) {
        const isBase = variantKey === 'BASE'
        const updatedName = route.number === '27'
          ? (isBase ? 'пл. Старосінна — Рибний порт' : '11-а ст. Люстдорфської дороги — Рибний порт')
          : (route.number === '7' && !isBase ? 'вул. Паустовського — Лузанівка' : route.name)

        onUpdateRoute({
          ...route,
          name: updatedName,
          length_km: res.length_km,
          round_trip_min: res.round_trip_min,
          lengthDir1Km: Math.round((res.length_km / 2) * 10) / 10,
          lengthDir2Km: Math.round((res.length_km / 2) * 10) / 10,
        })

        const refreshed = await getRouteVariants(routeIdentifier)
        setVariantsData(refreshed)
        toast.success(`Схему успішно змінено на «${isBase ? 'Повна базова' : 'Оперативна скорочена'}»! Суміщені ділянки перераховано.`, { id: toastId })
      }
    } catch (err: any) {
      toast.error(`Помилка зміни схеми: ${err?.message || 'Спробуйте пізніше'}`, { id: toastId })
    } finally {
      setIsSwitchingVariant(false)
    }
  }

  const handleSyncNetworkTopology = async () => {
    setIsSyncingTopology(true)
    const toastId = toast.loading('Перерахунок спільних зупинок та суміщених ділянок...')
    try {
      const ok = await recalculateAllCorridors()
      if (ok) {
        toast.success('Топологію та суміщені ділянки КП «ОМЕТ» успішно синхронізовано!', { id: toastId })
      } else {
        toast.error('Помилка синхронізації топології', { id: toastId })
      }
    } catch (err: any) {
      toast.error('Не вдалося синхронізувати топологію', { id: toastId })
    } finally {
      setIsSyncingTopology(false)
    }
  }

  // Додавання нової зупинки до маршруту
  const handleAddStation = () => {
    if (!selectedNewStationId) return
    if (route.stations.includes(selectedNewStationId)) {
      toast.warning('Ця зупинка вже додана до даного маршруту!')
      return
    }

    const updatedStations = [...route.stations, selectedNewStationId]
    const lastStationId = route.stations[route.stations.length - 1]
    const updatedSegments = [...route.segments]

    if (lastStationId) {
      updatedSegments.push({
        fromStationId: lastStationId,
        toStationId: selectedNewStationId,
        distanceKm: 1.5,
        baseTravelTimes: {
          morning_exit: 4,
          morning_peak: 6,
          off_peak: 5,
          evening_peak: 7,
          evening_decline: 4,
        },
        trafficLightCount: 1,
        avgTrafficLightDelayMin: 0.5,
        isSharedSegment: false,
        sharedWithRoutes: [],
      })
    }

    onUpdateRoute({
      ...route,
      stations: updatedStations,
      segments: updatedSegments,
    })

    setSelectedNewStationId('')
    toast.success('Зупинку додано до послідовності маршруту')
  }

  // Видалення зупинки
  const handleRemoveStation = (stationId: string) => {
    if (route.stations.length <= 2) {
      toast.error('Маршрут повинен мати щонайменше 2 зупинки (початкову та кінцеву)!')
      return
    }

    const updatedStations = route.stations.filter((id) => id !== stationId)
    const updatedSegments = route.segments.filter(
      (s) => s.fromStationId !== stationId && s.toStationId !== stationId
    )

    onUpdateRoute({
      ...route,
      stations: updatedStations,
      segments: updatedSegments,
    })
    toast.success('Зупинку вилучено з маршруту')
  }

  // Переміщення зупинки вгору
  const handleMoveStationUp = (index: number) => {
    if (index <= 0) return
    const updated = [...route.stations]
    const tmp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = tmp
    onUpdateRoute({ ...route, stations: updated })
  }

  // Переміщення зупинки вниз
  const handleMoveStationDown = (index: number) => {
    if (index >= route.stations.length - 1) return
    const updated = [...route.stations]
    const tmp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = tmp
    onUpdateRoute({ ...route, stations: updated })
  }

  return (
    <div className="space-y-6">
      {/* Шапка паспорта маршруту */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 rounded-xl font-mono font-black text-sm border shadow-xs ${
                route.type === 'tram'
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800'
              }`}
            >
              {route.type === 'tram' ? 'Трамвай №' : 'Тролейбус №'}{route.number}
            </span>
            {isEditMode ? (
              <input
                type="text"
                value={route.name}
                onChange={(e) => onUpdateRoute({ ...route, name: e.target.value })}
                className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-indigo-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg w-80 focus:ring-2 focus:ring-indigo-500"
                placeholder="Назва маршруту"
              />
            ) : (
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{route.name}</h2>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
            {route.description || 'Паспорт технічно-експлуатаційних показників маршруту міського електротранспорту КП «ОМЕТ».'}
          </p>
        </div>

        {/* Кнопки управління */}
        <div className="shrink-0 flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSyncNetworkTopology}
            disabled={isSyncingTopology}
            className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer shadow-xs disabled:opacity-50"
            title="Перерахувати перетин спільних зупинок з іншими маршрутами мережі"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTopology ? 'animate-spin text-purple-600' : ''}`} />
            <span>Синхронізувати ділянки</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border-2 cursor-pointer shadow-xs ${
              isEditMode 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-400 hover:bg-emerald-200' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {isEditMode ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditMode ? 'Завершити редагування' : 'Редагувати маршрут'}</span>
          </button>
        </div>
      </div>

      {/* Блок 1: Оперативні схеми курсування (Варіанти маршруту) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-2 border-amber-300/80 dark:border-amber-800/60 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-amber-950 dark:text-amber-200 text-sm uppercase tracking-wide">
                Схеми курсування та оперативні варіанти
              </h3>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Миттєве перемикання між повною паспортною трасою та скороченою схемою (дефіцит е/е, колійні роботи)
              </p>
            </div>
          </div>
        </div>

        {variantsData && variantsData.presets && variantsData.presets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {variantsData.presets.map((preset) => {
              const isShort = preset.variant_key === 'OPERATIONAL_SHORT'
              const isActive = preset.is_active

              return (
                <div
                  key={preset.variant_key}
                  className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-amber-200 dark:border-amber-900/60 hover:border-amber-400 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          {preset.title}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                            АКТИВНА В МЕРЕЖІ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                        {preset.terminals}
                      </div>
                    </div>
                    <span className={`p-1.5 rounded-lg text-xs font-bold ${isShort ? 'bg-amber-100 dark:bg-amber-900 text-amber-800' : 'bg-blue-100 dark:bg-blue-900 text-blue-800'}`}>
                      {isShort ? <Zap className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Довжина (Lоб)</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{preset.length_km} км</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Оборот (Tоб)</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{preset.round_trip_min} хв</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Зупинок</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{preset.stops_count}</strong>
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSwitchPreset(preset.variant_key)}
                      disabled={isSwitchingVariant}
                      className="w-full py-2 px-3 rounded-lg text-xs font-black bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Активувати цю схему для розкладів</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-amber-900 dark:text-amber-200 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-200">
            Маршрут працює за базовою паспортною схемою руху ({route.stations.length} зупинок).
          </div>
        )}
      </div>

      {/* Паспортні технічні показники */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Картка 1: Технічні параметри */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Паспортні дані</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Тип транспорту:</span>
              <strong className="text-slate-900 dark:text-white uppercase font-mono">
                {route.type === 'tram' ? 'Трамвайний вагон' : 'Тролейбус'}
              </strong>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Оборотний рейс (Lоб):</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-sm">
                {route.length_km || route.lengthDir1Km * 2} км
              </strong>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Час обороту (Tоб):</span>
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                {route.round_trip_min || 60} хв
              </strong>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Кількість зупинок:</span>
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                {route.stations.length}
              </strong>
            </div>
          </div>
        </div>

        {/* Картка 2: Диспетчерські пункти та кінцеві */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm lg:col-span-2">
          <div className="flex items-center space-x-2 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
              Кінцеві диспетчерські станції (ДП)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl space-y-2">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-black uppercase tracking-wider block">
                Головний Диспетчерський Пункт (ДП 1):
              </span>
              {isEditMode ? (
                <select
                  value={route.primaryTerminalId}
                  onChange={(e) => onUpdateRoute({ ...route, primaryTerminalId: e.target.value })}
                  className="w-full text-xs font-bold border border-emerald-300 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{primaryTerminal}</span>
                </div>
              )}
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-3.5 rounded-xl space-y-2">
              <span className="text-[11px] text-sky-800 dark:text-sky-300 font-black uppercase tracking-wider block">
                Протилежна Кінцева Станція (ДП 2):
              </span>
              {isEditMode ? (
                <select
                  value={route.secondaryTerminalId}
                  onChange={(e) => onUpdateRoute({ ...route, secondaryTerminalId: e.target.value })}
                  className="w-full text-xs font-bold border border-sky-300 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-1.5">
                  <Navigation className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{secondaryTerminal}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Послідовність зупинок маршруту та інтерактивний редактор */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <ListOrdered className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Послідовність зупинок маршруту ({route.stations.length})
            </h3>
          </div>

          {/* Форма додавання нової зупинки */}
          {isEditMode && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedNewStationId}
                onChange={(e) => setSelectedNewStationId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Оберіть зупинку для додавання --</option>
                {stations
                  .filter((st) => !route.stations.includes(st.id))
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code}) {st.isTerminal ? '[Кінцева/ДП]' : ''}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddStation}
                disabled={!selectedNewStationId}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold border border-emerald-700 shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Додати зупинку</span>
              </button>
            </div>
          )}
        </div>

        {/* Список зупинок із кнопками переміщення та видалення */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {route.stations.map((stId, index) => {
            const stationObj = stations.find((s) => s.id === stId)
            const stationName = stationObj?.name || stId
            const isFirst = index === 0
            const isLast = index === route.stations.length - 1

            return (
              <div
                key={`${stId}_${index}`}
                className={`border-2 p-3 rounded-xl flex items-center justify-between transition-all ${
                  isFirst || isLast
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isFirst || isLast
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {stationName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {isFirst ? '★ Початкова (ДП 1)' : isLast ? '★ Кінцева (ДП 2)' : stationObj?.code || 'Проміжна'}
                    </div>
                  </div>
                </div>

                {isEditMode && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveStationUp(index)}
                      disabled={isFirst}
                      title="Перемістити вгору"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStationDown(index)}
                      disabled={isLast}
                      title="Перемістити вниз"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {!isFirst && !isLast && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStation(stId)}
                        title="Видалити зупинку"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
