import React, { useState } from 'react'
import { useDepots, useCreateDepot, useRegisterVehicle, useDeleteVehicle } from '../../hooks/useDepotQueries'
import { GlobalLoader } from '../GlobalLoader'
import { Building2, TramFront, Plus, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export const AdminDepotsManager: React.FC = () => {
  const { data: depots, isLoading, isError } = useDepots()
  const createDepotMutation = useCreateDepot()
  const registerVehicleMutation = useRegisterVehicle()
  const deleteVehicleMutation = useDeleteVehicle()

  // Форма нового депо
  const [depotName, setDepotName] = useState('')
  const [depotAddress, setDepotAddress] = useState('')

  // Форма нового транспортного засобу
  const [vehicleId, setVehicleId] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleType, setVehicleType] = useState('TRAM')
  const [targetDepotId, setTargetDepotId] = useState<string>('')

  if (isLoading) return <GlobalLoader text="Завантаження конфігурацій депо..." />
  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Помилка завантаження даних депо та рухомого складу
      </div>
    )
  }

  const handleAddDepot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!depotName.trim()) return
    createDepotMutation.mutate(
      { name: depotName.trim(), address: depotAddress.trim() },
      {
        onSuccess: () => {
          setDepotName('')
          setDepotAddress('')
          toast.success('Депо успішно створено')
        },
        onError: () => {
          toast.error('Помилка створення депо')
        }
      }
    )
  }

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId.trim() || !vehicleModel.trim()) return
    registerVehicleMutation.mutate(
      {
        id: vehicleId.trim(),
        model: vehicleModel.trim(),
        type: vehicleType,
        depot_id: targetDepotId === '' ? undefined : targetDepotId
      },
      {
        onSuccess: () => {
          setVehicleId('')
          setVehicleModel('')
          toast.success(`Борт №${vehicleId} успішно зареєстровано`)
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail || 'Помилка реєстрації рухомого складу'
          toast.error(detail)
        }
      }
    )
  }

  const handleDeleteVehicle = (vId: string) => {
    deleteVehicleMutation.mutate(vId, {
      onSuccess: () => {
        toast.success(`Борт №${vId} успішно видалено`)
      },
      onError: () => {
        toast.error('Помилка видалення рухомого складу')
      }
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Керування депо та лінійним парком
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Реєстрація рухомого складу та розподіл за структурними підрозділами КП «ОМЕТ»
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Колонка 1: Додавання Депо */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
            <Building2 className="mr-2 text-blue-600 dark:text-blue-400" size={20} /> Додати депо
          </h2>
          <form onSubmit={handleAddDepot} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Назва депо
              </label>
              <input 
                type="text" 
                value={depotName} 
                onChange={e => setDepotName(e.target.value)} 
                placeholder="Напр. Трамвайне депо №1" 
                required 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Адреса
              </label>
              <input 
                type="text" 
                value={depotAddress} 
                onChange={e => setDepotAddress(e.target.value)} 
                placeholder="Водопровідна, 1" 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={createDepotMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {createDepotMutation.isPending ? 'Збереження...' : 'Створити депо'}
            </button>
          </form>
        </div>

        {/* Колонка 2: Реєстрація ТЗ */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs md:col-span-2">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
            <TramFront className="mr-2 text-emerald-600 dark:text-emerald-400" size={20} /> Реєстрація рухомого складу
          </h2>
          <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Бортовий номер
              </label>
              <input 
                type="text" 
                value={vehicleId} 
                onChange={e => setVehicleId(e.target.value)} 
                placeholder="Напр. 3012" 
                required 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Модель
              </label>
              <input 
                type="text" 
                value={vehicleModel} 
                onChange={e => setVehicleModel(e.target.value)} 
                placeholder="Tatra T3 / БКМ 321" 
                required 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Тип транспорту
              </label>
              <select 
                value={vehicleType} 
                onChange={e => setVehicleType(e.target.value)} 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TRAM">Трамвай</option>
                <option value="TROLLEYBUS">Тролейбус</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Прив'язка до депо
              </label>
              <select 
                value={targetDepotId} 
                onChange={e => setTargetDepotId(e.target.value)} 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Без депо (Резерв) --</option>
                {depots?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button 
                type="submit" 
                disabled={registerVehicleMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Plus size={18} className="mr-1" />
                {registerVehicleMutation.isPending ? 'Реєстрація...' : 'Зареєструвати одиницю парку'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Список депо та їхній парк */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Структура парку за депо</h2>
        
        <div className="space-y-6">
          {depots?.map(depot => (
            <div key={depot.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center">
                    <Building2 size={18} className="mr-2 text-blue-600 dark:text-blue-400" /> {depot.name}
                  </h3>
                  {depot.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                      <MapPin size={12} className="mr-1" /> {depot.address}
                    </p>
                  )}
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                  Одиниць на балансі: {depot.vehicles?.length || 0}
                </span>
              </div>

              {(!depot.vehicles || depot.vehicles.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-2">У цьому депо поки немає зареєстрованого рухомого складу.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {depot.vehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Борт №{vehicle.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{vehicle.model} ({vehicle.type})</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        disabled={deleteVehicleMutation.isPending}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Видалити"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
