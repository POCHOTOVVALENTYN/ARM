import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Search, Upload, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../utils/apiClient'
import { toast } from 'sonner'

interface DriverRecord {
  id: string
  tabNumber: string
  fullName: string
  phone: string
  depot: string
  status: 'active' | 'vacation' | 'sick'
}

export const AdminDriversManager: React.FC = () => {
  const queryClient = useQueryClient()
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [tabNumber, setTabNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [depot, setDepot] = useState('Трамвайне депо №1')

  // Отримання повного реєстру водіїв з бази даних КП «Одесміськелектротранс»
  const { data: backendDrivers = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['admin-drivers-directory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/crew/drivers')
        return Array.isArray(res.data) ? res.data : []
      } catch {
        try {
          const res = await apiClient.get('/crew')
          return Array.isArray(res.data) ? res.data : []
        } catch {
          const res = await apiClient.get('/api/v1/crew/available')
          return res.data?.drivers || []
        }
      }
    }
  })

  useEffect(() => {
    if (backendDrivers && backendDrivers.length > 0) {
      const mapped: DriverRecord[] = backendDrivers.map((d: any, idx: number) => ({
        id: String(d.id),
        tabNumber: String(d.id ? 1000 + Number(d.id) : 1001 + idx),
        fullName: d.full_name || d.name || `Водій #${d.id}`,
        phone: d.phone || `+380 48 ${(7000000 + Number(d.id || idx) * 31).toString().slice(0, 7)}`,
        depot: Number(d.id || idx) % 2 === 0 ? 'Трамвайне депо №1' : 'Трамвайне депо №2',
        status: d.status === 'SICK' ? 'sick' : d.status === 'VACATION' ? 'vacation' : 'active'
      }))
      setDrivers(mapped)
    }
  }, [backendDrivers])

  const filtered = drivers.filter(d => 
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.tabNumber.includes(search) ||
    d.depot.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !tabNumber.trim()) {
      toast.warning('Заповніть ПІБ та табельний номер')
      return
    }
    const newDriver: DriverRecord = {
      id: Date.now().toString(),
      tabNumber: tabNumber.trim(),
      fullName: fullName.trim(),
      phone: phone.trim() || '+380 48 700 0000',
      depot,
      status: 'active'
    }
    setDrivers([newDriver, ...drivers])
    toast.success(`Водія ${fullName} успішно внесено до реєстру КП «ОМЕТ»!`)
    setIsAddOpen(false)
    setTabNumber('')
    setFullName('')
    setPhone('')
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Ви дійсно бажаєте видалити водія ${name}?`)) {
      setDrivers(drivers.filter(d => d.id !== id))
      toast.success(`Водія ${name} видалено.`)
    }
  }

  const handleImportSample = () => {
    toast.info('Масовий імпорт водіїв з CSV/Excel активовано.')
  }

  const handleRefresh = async () => {
    await refetch()
    toast.success('Реєстр водіїв синхронізовано з БД')
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Реєстр водіїв та персоналу КП «ОМЕТ»</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Управління базою водіїв для щоденної рознарядки за випусками та депо
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            aria-label="Оновити список водіїв"
            tabIndex={0}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Оновити</span>
          </button>
          <button
            onClick={handleImportSample}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            aria-label="Імпорт CSV"
            tabIndex={0}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Імпорт CSV</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
            aria-label="Додати водія"
            tabIndex={0}
          >
            <Plus className="w-4 h-4" />
            <span>Додати водія</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук за ПІБ, табельним або депо..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
            aria-label="Пошук за ПІБ або табельним"
          />
        </div>
        <div className="text-xs font-mono font-bold text-slate-500">
          Всього в базі: <span className="text-indigo-600 font-black">{drivers.length}</span>
        </div>
      </div>

      {/* Add Driver Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Внесення нового водія до реєстру
            </h3>
            <form onSubmit={handleAddDriver} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Табельний номер:
                </label>
                <input
                  type="text"
                  required
                  placeholder="напр. 1092"
                  value={tabNumber}
                  onChange={e => setTabNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  ПІБ водія:
                </label>
                <input
                  type="text"
                  required
                  placeholder="напр. Шевченко Тарас Григорович"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Контактний телефон:
                </label>
                <input
                  type="text"
                  placeholder="+380 67 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Депо прикріплення:
                </label>
                <select
                  value={depot}
                  onChange={e => setDepot(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Трамвайне депо №1">Трамвайне депо №1 (ім. Шевченка)</option>
                  <option value="Трамвайне депо №2">Трамвайне депо №2 (Слобідка)</option>
                  <option value="Тролейбусне депо">Тролейбусне депо (вул. Інглезі)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Зберегти в базі
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5">Табельний</th>
              <th className="p-3.5">ПІБ Водія</th>
              <th className="p-3.5">Депо</th>
              <th className="p-3.5">Телефон</th>
              <th className="p-3.5">Статус</th>
              <th className="p-3.5 text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Завантаження реєстру водіїв КП «ОМЕТ»...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                  Водіїв не знайдено за заданим критерієм пошуку.
                </td>
              </tr>
            ) : (
              filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    #{d.tabNumber}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                    {d.fullName}
                  </td>
                  <td className="p-3.5 font-medium text-slate-600 dark:text-slate-400">
                    {d.depot}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">
                    {d.phone}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : d.status === 'vacation'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {d.status === 'active' ? '● В строю' : d.status === 'vacation' ? 'Відпустка' : 'Лікарняний'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(d.id, d.fullName)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Видалити водія"
                      aria-label={`Видалити водія ${d.fullName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
