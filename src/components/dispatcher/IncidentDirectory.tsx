import React, { useState } from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';

export const IncidentDirectory: React.FC = () => {
    const { incidents, reportIncident } = useIncidentStore();
    const [newDesc, setNewDesc] = useState('');
    const [vehicleId, setVehicleId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDesc || !vehicleId) return;
        await reportIncident(vehicleId, newDesc);
        setNewDesc('');
        setVehicleId('');
    };

    const getSeverityBorder = (severity?: string) => {
        switch (severity) {
            case 'CRITICAL': return 'border-red-600';
            case 'HIGH': return 'border-amber-500';
            case 'MEDIUM': return 'border-yellow-400';
            case 'LOW': return 'border-green-500';
            default: return 'border-slate-300';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-red-100 text-red-800';
            case 'ANALYZING': return 'bg-blue-100 text-blue-800 animate-pulse';
            case 'MANUAL_REVIEW': return 'bg-orange-100 text-orange-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <div className="flex flex-col w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>Нейронний довідник інцидентів</span>
                </h3>
            </div>
            
            <div className="p-5">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-3 mb-6">
                    <input 
                        type="text" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Борт №" 
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        required
                    />
                    <textarea 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Опис ситуації (напр. 'обрив лінії')" 
                        rows={3}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        required
                    />
                    <button 
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-500/30 transition-all active:scale-[0.98]"
                    >
                        Повідомити
                    </button>
                </form>

                <div className="flex flex-col space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {Object.values(incidents).sort((a, b) => b.timestamp - a.timestamp).map(inc => (
                        <div key={inc.id} className={`p-4 bg-white rounded-lg shadow-sm border-l-4 border-y border-r border-slate-100 ${getSeverityBorder(inc.severity)} transition-all hover:shadow-md`}>
                            <div className="flex items-center justify-between mb-2">
                                <strong className="text-slate-800 font-semibold">Борт: {inc.vehicle_id}</strong>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${getStatusBadge(inc.status)}`}>
                                    {inc.status}
                                </span>
                            </div>
                            <p className="text-slate-600 text-sm mb-3 italic">"{inc.description}"</p>
                            
                            {inc.status === 'ACTIVE' && (
                                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Категорія: <strong className="text-slate-800">{inc.category}</strong></span>
                                        <span className="text-slate-500">Затримка: <strong className="text-red-600">~{inc.estimated_delay} хв.</strong></span>
                                    </div>
                                    <div className="text-sm bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                                        <strong className="text-blue-900 block mb-1">Регламентна дія:</strong> 
                                        <span className="text-blue-800">{inc.action}</span>
                                    </div>
                                </div>
                            )}
                            
                            {inc.status === 'ANALYZING' && (
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2 text-sm text-blue-600">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Нейромережа аналізує регламент...</span>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {Object.keys(incidents).length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Інцидентів не знайдено. Усе працює штатно.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
