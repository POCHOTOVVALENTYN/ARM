import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Bus, 
  MapPin, 
  Send,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface ShortTurnModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId?: string;
  routeId?: string;
  onSuccess?: () => void;
}

interface EmergencyTemplate {
  id: string;
  title: string;
  cause: string;
  affectedRouteIds: string[];
  detourDescription: string;
  validLoops: string[];
}

export const ShortTurnModal: React.FC<ShortTurnModalProps> = ({
  isOpen,
  onClose,
  vehicleId = '4001',
  routeId = '7',
  onSuccess
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicleId);
  const [selectedRoute, setSelectedRoute] = useState<string>(routeId);
  const [reason, setReason] = useState<string>('ДТП / Затор на колії');
  const [targetLoop, setTargetLoop] = useState<string>('Лузанівка');
  const [description, setDescription] = useState<string>('Оперативний розворот на кільці «Лузанівка» з поверненням у плановий інтервал');

  // Load available emergency templates from backend
  const { data: templates = [] } = useQuery<EmergencyTemplate[]>({
    queryKey: ['emergency-templates'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/emergencies/templates');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isOpen
  });

  // Activate emergency detour mutation
  const activateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/v1/emergencies/detours/activate', {
        vehicle_id: selectedVehicle,
        route_id: selectedRoute,
        reason: reason,
        target_loop: targetLoop,
        new_path_description: description
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Оперативний розворот для вагона Вг-${selectedVehicle} успішно активовано на кільці «${targetLoop}»!`);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка активації оперативного розвороту');
    }
  });

  if (!isOpen) return null;

  const relevantTemplates = templates.filter(t => t.affectedRouteIds.includes(selectedRoute));
  const availableLoops = Array.from(new Set([
    'Лузанівка',
    'Пересипський міст / Херсонський сквер',
    '11-та ст. Великого Фонтану',
    'Парк ім. Т. Шевченка',
    'Тираспольська площа',
    'Куликове поле',
    'Олексіївська площа',
    'вул. 28-ї Бригади'
  ]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden space-y-0">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">
                Оперативний розворот / Скорочення рейсу
              </h3>
              <p className="text-xs text-white/80 font-medium">
                Видача диспетчерського наказу водію на оперативну зміну траси
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs font-sans">
          {/* Target Vehicle & Route */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-black text-slate-700 dark:text-slate-300">
                Бортовий номер вагона:
              </label>
              <div className="flex items-center space-x-2">
                <Bus className="w-4 h-4 text-indigo-600" />
                <input
                  type="text"
                  value={selectedVehicle}
                  onChange={e => setSelectedVehicle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-black text-slate-700 dark:text-slate-300">
                Маршрут №:
              </label>
              <input
                type="text"
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Detour Templates */}
          {relevantTemplates.length > 0 && (
            <div className="space-y-2">
              <label className="block font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Готові шаблони НС для маршруту №{selectedRoute}:</span>
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {relevantTemplates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setReason(tmpl.cause);
                      if (tmpl.validLoops.length > 0) setTargetLoop(tmpl.validLoops[0]);
                      setDescription(tmpl.detourDescription);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors space-y-1 cursor-pointer"
                  >
                    <div className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                      {tmpl.title}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {tmpl.detourDescription}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Intermediate Loop */}
          <div className="space-y-1">
            <label className="block font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Проміжне розворотне кільце:</span>
            </label>
            <select
              value={targetLoop}
              onChange={e => setTargetLoop(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-black cursor-pointer"
            >
              {availableLoops.map(loop => (
                <option key={loop} value={loop}>
                  🌀 Кільце ДП «{loop}»
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="block font-black text-slate-700 dark:text-slate-300">
              Причина скорочення / розвороту:
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Directive Description */}
          <div className="space-y-1">
            <label className="block font-black text-slate-700 dark:text-slate-300">
              Наказ водію (текст для бортового термінала):
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Скасувати
            </button>

            <button
              type="button"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black flex items-center space-x-2 shadow-md shadow-red-600/20 cursor-pointer transition-all"
            >
              {activateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{activateMutation.isPending ? 'Надсилання...' : 'Видати Наказ Водію'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortTurnModal;
