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

interface RouteTableProps {
  selectedRouteId: string | null;
  onSelectRoute: (id: string, viewMode: 'passport' | 'matrix') => void;
  onEditRoute: (route: Route) => void;
  onDuplicateRoute: (id: string) => void;
  onDeleteRoute: (id: string) => void;
}

export const RouteTable: React.FC<RouteTableProps> = ({
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
              <th className="p-3.5">Номер & Тип</th>
              <th className="p-3.5">Назва маршруту & Кінцеві</th>
              <th className="p-3.5 text-center">Довжина (L1 / L2)</th>
              <th className="p-3.5 text-center">Статус</th>
              <th className="p-3.5 text-right">Операції та Перегляд</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {routes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isTram = route.type === 'tram';

              return (
                <tr
                  key={route.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-indigo-50/80 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Number & Type */}
                  <td className="p-3.5 font-mono">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                          route.type === 'tram'
                            ? 'bg-rose-100 text-rose-600 border-rose-200'
                            : 'bg-indigo-100 text-indigo-600 border-indigo-200'
                        }`}
                      >
                        <Bus className="w-5 h-5" />
                      </div>
                      <div>
                        <button
                          onClick={() => onSelectRoute(route.id, 'passport')}
                          className="font-extrabold text-indigo-600 hover:text-indigo-800 text-sm hover:underline cursor-pointer"
                        >
                          {route.type === 'tram' ? 'Тр' : 'Т'} {route.number}
                        </button>
                        <div className="text-xs text-gray-500 font-medium">
                          {route.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Name & Terminals */}
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900 text-sm">{route.name}</div>
                      {route.description && (
                        <div className="text-[11px] text-gray-500 line-clamp-1">
                          {route.description}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500 font-mono">
                        Зупинок: <strong className="text-gray-800">{route.stations.length}</strong> | 
                        Перегонів: <strong className="text-gray-800">{route.segments.length}</strong>
                      </div>
                    </div>
                  </td>

                  {/* Length */}
                  <td className="p-3.5 text-center font-mono font-semibold text-gray-800">
                    <div>{route.lengthDir1Km} км / {route.lengthDir2Km} км</div>
                    <div className="text-[10px] text-gray-500 font-normal">Прямий / Зворотний</div>
                  </td>

                  {/* Status */}
                  <td className="p-3.5 text-center">
                    {getStatusBadge(route.status || 'active')}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right relative">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* Dropdown Menu for More Actions */}
                      <div className="relative" ref={openDropdownId === route.id ? dropdownRef : null}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === route.id ? null : route.id)}
                          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                            openDropdownId === route.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openDropdownId === route.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 text-xs">
                            <button
                              onClick={() => {
                                onEditRoute(route);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center space-x-2"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Редагувати</span>
                            </button>
                            <button
                              onClick={() => {
                                onDuplicateRoute(route.id);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Дублювати</span>
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => {
                                onDeleteRoute(route.id);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Видалити</span>
                            </button>
                          </div>
                        )}
                      </div>
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
