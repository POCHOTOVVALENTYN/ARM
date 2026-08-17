import React, { useState, useRef, useEffect } from 'react';
import { Route, RouteStatus, TransportType } from '../../types';
import { useScheduleStore } from '../../store/useScheduleStore';
import { 
  Navigation, 
  Bus, 
  Edit3, 
  Copy, 
  Trash2, 
  FileText, 
  Table as TableIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  MoreVertical
} from 'lucide-react';

interface RoutesDirectoryTableProps {
  selectedRouteId: string | null;
  onSelectRoute: (id: string, viewMode: 'passport' | 'matrix') => void;
  onEditRoute: (route: Route) => void;
  onDuplicateRoute: (id: string) => void;
  onDeleteRoute: (id: string) => void;
}

export const RoutesDirectoryTable: React.FC<RoutesDirectoryTableProps> = ({
  selectedRouteId,
  onSelectRoute,
  onEditRoute,
  onDuplicateRoute,
  onDeleteRoute,
}) => {
  const routes = useScheduleStore(state => state.routes);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusBadge = (status: RouteStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Активний</span>
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Ремонт / Скорочено</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-md border border-rose-300">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            <span>Призупинено</span>
          </span>
        );
      case 'reserve':
        return (
          <span className="inline-flex items-center space-x-1 bg-sky-50 text-sky-700 text-xs font-bold px-2.5 py-1 rounded-md border border-sky-300">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>В резерві</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (routes.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-900 rounded-xl p-8 text-center text-gray-600 space-y-3">
        <Navigation className="w-10 h-10 mx-auto text-gray-400" />
        <p className="font-bold text-gray-800">За вашим запитом маршрутів не знайдено.</p>
        <p className="text-xs text-gray-500">Спробуйте змінити параметри пошуку або додати новий маршрут.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-900 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto min-w-[1000px]">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-gray-900 text-white font-mono uppercase tracking-wider text-[11px] border-b-2 border-gray-900">
            <tr>
              <th className="p-3.5 font-bold">Номер</th>
              <th className="p-3.5 font-bold">Назва маршруту</th>
              <th className="p-3.5 font-bold text-center">Тип</th>
              <th className="p-3.5 font-bold text-center">Статус</th>
              <th className="p-3.5 font-bold text-center">Зупинок (П/З)</th>
              <th className="p-3.5 font-bold text-center">Довжина (км)</th>
              <th className="p-3.5 font-bold text-center">Час рейсу</th>
              <th className="p-3.5 font-bold text-center">Інтервал пік</th>
              <th className="p-3.5 font-bold text-center">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-900 font-sans">
            {routes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isDropdownOpen = openDropdownId === route.id;

              return (
                <tr 
                  key={route.id}
                  className={`hover:bg-blue-50/60 transition-colors ${
                    isSelected ? 'bg-blue-100/70 font-semibold' : 'bg-white'
                  }`}
                >
                  {/* Номер */}
                  <td className="p-3.5 font-mono font-black text-sm text-gray-950">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      <span>№ {route.number}</span>
                    </div>
                  </td>

                  {/* Назва */}
                  <td className="p-3.5 text-gray-900">
                    <div className="font-bold">{route.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {route.startPoint} ⇄ {route.endPoint}
                    </div>
                  </td>

                  {/* Тип ТЗ */}
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-300 uppercase">
                      {route.type === 'tram' ? 'Трамвай' : 'Тролейбус'}
                    </span>
                  </td>

                  {/* Статус */}
                  <td className="p-3.5 text-center">
                    {getStatusBadge(route.status)}
                  </td>

                  {/* Зупинок */}
                  <td className="p-3.5 text-center font-mono text-gray-700">
                    {route.forwardStops?.length || 0} / {route.backwardStops?.length || 0}
                  </td>

                  {/* Довжина */}
                  <td className="p-3.5 text-center font-mono text-gray-700">
                    {route.lengthKm ? `${route.lengthKm} км` : '—'}
                  </td>

                  {/* Час рейсу */}
                  <td className="p-3.5 text-center font-mono text-gray-700">
                    {route.durationMinutes ? `${route.durationMinutes} хв` : '—'}
                  </td>

                  {/* Інтервал пік */}
                  <td className="p-3.5 text-center font-mono font-bold text-blue-700">
                    {route.peakIntervalMinutes ? `${route.peakIntervalMinutes} хв` : '—'}
                  </td>

                  {/* Дії */}
                  <td className="p-3.5 text-center relative">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => onSelectRoute(route.id, 'passport')}
                        title="Паспорт маршруту"
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md border border-blue-200 transition-colors"
                      >
                        <FileText size={14} />
                      </button>
                      <button
                        onClick={() => onSelectRoute(route.id, 'matrix')}
                        title="Матриця часу ходу"
                        className="p-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-md border border-purple-200 transition-colors"
                      >
                        <TableIcon size={14} />
                      </button>
                      <button
                        onClick={() => onEditRoute(route)}
                        title="Редагувати параметри"
                        className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-md border border-amber-200 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDuplicateRoute(route.id)}
                        title="Дублювати маршрут"
                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md border border-emerald-200 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteRoute(route.id)}
                        title="Видалити маршрут"
                        className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-md border border-rose-200 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
