import React, { useState } from 'react';
import { useActiveIncidents, useResolveIncident, Incident } from '../../hooks/useIncidentQueries';
import { useIncidentStore } from '../../store/useIncidentStore';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TramFront, 
  ShieldAlert, 
  Send, 
  Sparkles, 
  Bot,
  AlertOctagon,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export const IncidentDirectory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'report'>('active');
  
  // Дані інцидентів з бекенду (PostgreSQL + WebSockets)
  const { data: activeDbIncidents, isLoading } = useActiveIncidents();
  const resolveMutation = useResolveIncident();

  // Локальний стор для швидкого AI-аналізу
  const { incidents: aiIncidents, reportIncident } = useIncidentStore();
  const [newDesc, setNewDesc] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);

  // Стан для форми закриття інциденту
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolve = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.warning('Вкажіть причину або вжиті заходи перед закриттям');
      return;
    }

    try {
      await resolveMutation.mutateAsync({ id, notes: resolutionNotes });
      toast.success(`Інцидент #${id} успішно закрито!`);
      setResolvingId(null);
      setResolutionNotes('');
    } catch (error) {
      toast.error('Помилка при закритті інциденту');
    }
  };

  const handleAiReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !vehicleId) return;

    setIsSubmittingAi(true);
    try {
      await reportIncident(vehicleId, newDesc);
      toast.success(`Інцидент для борта ${vehicleId} надіслано на AI-аналіз`);
      setNewDesc('');
      setVehicleId('');
    } catch (error) {
      toast.error('Помилка реєстрації інциденту');
    } finally {
      setIsSubmittingAi(false);
    }
  };

  const totalActive = (activeDbIncidents?.length || 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[580px] overflow-hidden">
      
      {/* Заголовок панелі з лічильником */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Інциденти на лінії
            </h3>
            <span className="text-[11px] text-slate-400">Диспетчерський журнал</span>
          </div>
        </div>

        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
          totalActive > 0 
            ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' 
            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
        }`}>
          {totalActive} активних
        </span>
      </div>

      {/* Вкладки: Активні інциденти vs Повідомити (AI) */}
      <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertOctagon size={14} className="text-rose-600" />
          <span>Активні ({totalActive})</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'report'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bot size={14} className="text-blue-600" />
          <span>Нейро-помічник</span>
        </button>
      </div>

      {/* Вміст вкладок */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50">
        
        {/* ВКЛАДКА 1: АКТИВНІ ІНЦИДЕНТИ */}
        {activeTab === 'active' && (
          <>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500">Завантаження інцидентів...</span>
              </div>
            ) : !activeDbIncidents || activeDbIncidents.length === 0 ? (
              <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2.5">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Ситуація на лінії стабільна</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Критичних запізнень або аварійних зупинок наразі не зафіксовано.
                </p>
              </div>
            ) : (
              activeDbIncidents.map((incident) => (
                <div 
                  key={incident.id} 
                  className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-xs relative overflow-hidden text-xs"
                >
                  {/* Червона смужка зліва */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>

                  <div className="flex justify-between items-start pl-1.5">
                    <div>
                      <div className="flex items-center space-x-1.5 font-black text-slate-900 mb-1">
                        <TramFront size={14} className="text-rose-600" />
                        <span>Борт №{incident.vehicle_id}</span>
                        {incident.route_id && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {incident.route_id}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-rose-900 font-semibold mt-0.5 leading-snug">
                        {incident.description}
                      </p>
                      <div className="flex items-center text-[11px] text-slate-400 mt-2 font-mono">
                        <Clock size={12} className="mr-1 text-slate-400" />
                        <span>
                          {incident.recorded_at 
                            ? new Date(incident.recorded_at).toLocaleTimeString('uk-UA') 
                            : 'Щойно'}
                        </span>
                      </div>
                    </div>

                    {resolvingId !== incident.id && (
                      <button 
                        onClick={() => {
                          setResolvingId(incident.id);
                          setResolutionNotes('');
                        }}
                        className="text-[11px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg transition-all border border-slate-200 hover:border-emerald-300 font-bold shrink-0 cursor-pointer"
                      >
                        Закрити
                      </button>
                    )}
                  </div>

                  {/* Форма закриття інциденту з коментарем */}
                  {resolvingId === incident.id && (
                    <form onSubmit={(e) => handleResolve(e, incident.id)} className="mt-3 pt-3 border-t border-slate-100 pl-1.5 animate-fadeIn">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                        <MessageSquare size={11} className="mr-1 text-slate-400" />
                        Причина закриття / вжиті заходи
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Наприклад: 'Затор усунуто поліцією', 'Введено оперативний нагін'..."
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                        rows={2}
                        required
                        autoFocus
                      />
                      <div className="flex justify-end space-x-1.5 mt-2">
                        <button 
                          type="button" 
                          onClick={() => { setResolvingId(null); setResolutionNotes(''); }}
                          className="text-[11px] px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg font-bold"
                        >
                          Скасувати
                        </button>
                        <button 
                          type="submit" 
                          disabled={resolveMutation.isPending}
                          className="text-[11px] px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle size={13} />
                          <span>{resolveMutation.isPending ? 'Збереження...' : 'Затвердити'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ВКЛАДКА 2: НЕЙРОННИЙ ДОВІДНИК ТА ПОВІДОМЛЕННЯ ПРО НС */}
        {activeTab === 'report' && (
          <div className="space-y-3">
            <form onSubmit={handleAiReport} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 mb-1">
                <Sparkles size={14} className="text-blue-600" />
                <span>Оперативне повідомлення диспетчера</span>
              </div>
              
              <input 
                type="text" 
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Бортовий № (напр. 3012)" 
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
              />
              <textarea 
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Опис події (напр. 'обрив контактної мережі на Старосінній площі')..." 
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
              />
              <button 
                type="submit"
                disabled={isSubmittingAi}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={13} />
                <span>{isSubmittingAi ? 'Аналіз нейромережею...' : 'Надіслати на аналіз'}</span>
              </button>
            </form>

            {/* Список останніх AI регламентів */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {Object.values(aiIncidents).sort((a, b) => b.timestamp - a.timestamp).map((inc) => (
                <div key={inc.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Борт #{inc.vehicle_id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic">"{inc.description}"</p>
                  {inc.action && (
                    <div className="mt-1.5 p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900">
                      <strong>Регламент:</strong> {inc.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDirectory;
