import React, { useEffect, useState } from 'react';
import { Clock, Navigation, AlertTriangle, CheckCircle, MapPin, Bus, Radio } from 'lucide-react';
import { useDriverStore } from '../../store/useDriverStore';

interface SmartWaybillViewProps {
  vehicleId: string;
}

export const SmartWaybillView: React.FC<SmartWaybillViewProps> = ({ vehicleId }) => {
  const { currentBlock, fetchBlock, activeTripId, setActiveTripId, connectionStatus } = useDriverStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchBlock(vehicleId);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [vehicleId, fetchBlock]);

  if (!currentBlock) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white flex-col gap-4">
        <Radio className="w-12 h-12 text-indigo-500 animate-pulse" />
        <h1 className="text-2xl font-bold">Очікування розкладу...</h1>
        <p className="text-gray-400">Борт {vehicleId}</p>
      </div>
    );
  }

  const activeTrip = currentBlock.trips.find(t => t.id === activeTripId) || currentBlock.trips[0];
  const upcomingTrips = currentBlock.trips.filter(t => t.id !== activeTrip?.id && t.start_time >= (activeTrip?.start_time || 0));

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const deviation = activeTrip ? (currentMinutes - activeTrip.start_time) : 0; // Simplified for MVP

  const handleSOS = async () => {
    try {
      await fetch('http://localhost:8000/api/v1/incidents/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          description: "ЕКСТРЕНИЙ ВИКЛИК SOS З КАБІНИ ВОДІЯ",
          lat: 46.47,
          lon: 30.73
        })
      });
      alert('SOS сигнал надіслано диспетчеру!');
    } catch (e) {
      alert('Помилка відправки SOS');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Bus className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Борт {vehicleId}</h1>
            <p className="text-sm text-gray-400">Маршрут {activeTrip?.route_id || '--'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-white">
            {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-2 justify-end mt-1">
            <span className={`w-3 h-3 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">{connectionStatus}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-3xl mx-auto w-full">
        {/* ACTIVE TRIP CARD */}
        {activeTrip && (
          <section className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-400" />
                Поточний Рейс
              </h2>
              
              {/* Таймер відхилення */}
              <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-lg ${deviation > 2 ? 'bg-red-900/50 text-red-400 border border-red-500/30' : deviation < -2 ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' : 'bg-green-900/50 text-green-400 border border-green-500/30'}`}>
                {deviation > 0 ? '+' : ''}{deviation} хв
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-4 border-indigo-500 bg-gray-900 z-10"></div>
                  <div className="w-0.5 h-12 bg-gray-700"></div>
                  <MapPin className="w-5 h-5 text-indigo-500 z-10" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-center h-8">
                    <span className="text-xl font-medium text-white">{activeTrip.start_station_id.replace('st_', '').replace(/_/g, ' ')}</span>
                    <span className="text-xl font-mono text-gray-300">{formatMinutes(activeTrip.start_time)}</span>
                  </div>
                  <div className="h-6"></div>
                  <div className="flex justify-between items-center h-8">
                    <span className="text-xl font-medium text-white">{activeTrip.end_station_id.replace('st_', '').replace(/_/g, ' ')}</span>
                    <span className="text-xl font-mono text-gray-300">{formatMinutes(activeTrip.end_time)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar Mock */}
            <div className="mt-6 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/3"></div>
            </div>
          </section>
        )}

        {/* UPCOMING TRIPS */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2">Наступні рейси</h3>
          
          <div className="space-y-3">
            {upcomingTrips.map(trip => (
              <button 
                key={trip.id}
                onClick={() => setActiveTripId(trip.id)}
                className="w-full text-left bg-gray-800/50 hover:bg-gray-700/50 transition-colors p-4 rounded-xl border border-gray-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center font-mono text-gray-400 font-bold border border-gray-700">
                    {trip.route_id}
                  </div>
                  <div>
                    <div className="font-medium text-white capitalize">{trip.end_station_id.replace('st_', '').replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatMinutes(trip.start_time)} - {formatMinutes(trip.end_time)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* ACTION PANEL */}
      <footer className="bg-gray-800 border-t border-gray-700 p-4 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button 
            onClick={handleSOS}
            className="flex-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white py-4 rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
          >
            <AlertTriangle className="w-6 h-6" />
            SOS / Аварія
          </button>
          
          <button className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white py-4 rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all">
            <CheckCircle className="w-6 h-6" />
            Прибув
          </button>
        </div>
      </footer>
    </div>
  );
};
