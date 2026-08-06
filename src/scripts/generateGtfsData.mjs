import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gtfsDir = path.resolve(__dirname, '../../gtfs_static_data');
const outputDir = path.resolve(__dirname, '../data');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] || '';
    });
    data.push(obj);
  }
  return data;
}

console.log('Loading GTFS data...');
const routes = parseCSV(fs.readFileSync(path.join(gtfsDir, 'routes.txt'), 'utf-8'));
const stops = parseCSV(fs.readFileSync(path.join(gtfsDir, 'stops.txt'), 'utf-8'));
const trips = parseCSV(fs.readFileSync(path.join(gtfsDir, 'trips.txt'), 'utf-8'));
const stopTimes = parseCSV(fs.readFileSync(path.join(gtfsDir, 'stop_times.txt'), 'utf-8'));

console.log('Building stop maps...');
const stopMap = {};
stops.forEach(s => stopMap[s.stop_id] = s.stop_name);

const tripToStops = {};
stopTimes.forEach(st => {
  if (!tripToStops[st.trip_id]) tripToStops[st.trip_id] = [];
  tripToStops[st.trip_id].push({ seq: parseInt(st.stop_sequence), stop_id: st.stop_id });
});

// Group GTFS routes logically by short_name and route_type
const logicalRouteGroups = {}; // key -> { routeIds: Set, type, short_name, long_names: Set }
routes.forEach(r => {
  // route_type 0 = tram, 11 = trolleybus
  const typeStr = r.route_type === '0' ? 'tram' : 'trolleybus';
  const logicKey = `${typeStr}_${r.route_short_name}`;
  if (!logicalRouteGroups[logicKey]) {
    logicalRouteGroups[logicKey] = { 
        routeIds: new Set(), 
        type: typeStr, 
        short_name: r.route_short_name,
        long_names: new Set()
    };
  }
  logicalRouteGroups[logicKey].routeIds.add(r.route_id);
  if (r.route_long_name) {
    logicalRouteGroups[logicKey].long_names.add(r.route_long_name);
  }
});

const generatedRoutes = [];

console.log('Processing logical routes...');
for (const [logicKey, group] of Object.entries(logicalRouteGroups)) {
  const routeTrips = trips.filter(t => group.routeIds.has(t.route_id));
  
  const terminalPairs = new Map();
  
  for (const t of routeTrips) {
    const stopsList = tripToStops[t.trip_id];
    if (!stopsList || stopsList.length === 0) continue;
    stopsList.sort((a, b) => a.seq - b.seq);
    
    const firstStopId = stopsList[0].stop_id;
    const lastStopId = stopsList[stopsList.length - 1].stop_id;
    const key = `${firstStopId}_${lastStopId}`;
    
    if (!terminalPairs.has(key)) {
        terminalPairs.set(key, []);
    }
    terminalPairs.get(key).push({
        tripId: t.trip_id,
        stopCount: stopsList.length,
        stops: stopsList
    });
  }

  const pairsSorted = Array.from(terminalPairs.entries()).sort((a, b) => b[1].length - a[1].length);
  
  const dirs = pairsSorted.slice(0, 2).map(p => {
    const bestTrip = p[1].sort((a, b) => b.stopCount - a.stopCount)[0];
    return {
        firstStopId: bestTrip.stops[0].stop_id,
        lastStopId: bestTrip.stops[bestTrip.stops.length - 1].stop_id,
        stops: bestTrip.stops.map(s => s.stop_id)
    };
  });
  
  if (dirs.length === 0) continue;
  
  const d0 = dirs[0];
  const d1 = dirs[1];
  
  const stationsSet = new Set(d0.stops);
  if (d1) {
      d1.stops.forEach(s => stationsSet.add(s));
  }
  const stationsArray = Array.from(stationsSet);

  let longName = '';
  if (d0 && d1) {
    longName = `${stopMap[d0.firstStopId]} — ${stopMap[d0.lastStopId]}`;
  } else if (d0) {
    longName = `${stopMap[d0.firstStopId]} — ${stopMap[d0.lastStopId]}`;
  } else {
    longName = Array.from(group.long_names)[0] || group.short_name;
  }
  
  if (logicKey === 'tram_7') {
      longName = '11-а станція Люстдорфської дороги — вул. 28-ї бригади';
  }

  const prefix = group.type === 'tram' ? 'T' : 'Tr';
  const finalId = prefix + group.short_name;

  generatedRoutes.push({
    id: finalId,
    number: group.short_name,
    name: longName,
    type: group.type,
    status: 'active',
    primaryTerminalId: d0.firstStopId,
    secondaryTerminalId: d1 ? d1.firstStopId : d0.lastStopId,
    lengthDir1Km: 15,
    lengthDir2Km: 15,
    stations: stationsArray,
    segments: [],
    controlPoints: stationsArray.map((sid, i) => ({ id: `cp_${finalId}_${i}`, controlPointId: sid, tracksCount: 1, trackType: 'main_loop', pointType: (i === 0 || i === stationsArray.length - 1) ? 'terminal' : 'intermediate' })),
    activeVehiclesCount: {
      workday: 5,
      weekend: 4,
      holiday: 3
    },
    description: `Реальний маршрут GTFS ${group.short_name}`
  });
}

console.log(`Generated ${generatedRoutes.length} routes.`);

let tsContent = `// Auto-generated from GTFS Data
import { Route, VehicleBlock, DriverDuty } from '../types';
import { MOCK_VEHICLE_BLOCKS, MOCK_DRIVER_DUTIES } from './mockData';

export const GTFS_ROUTES: Route[] = ${JSON.stringify(generatedRoutes, null, 2).replace(/"([^"]+)":/g, '$1:')};

export const GTFS_VEHICLE_BLOCKS: VehicleBlock[] = MOCK_VEHICLE_BLOCKS;
export const GTFS_DRIVER_DUTIES: DriverDuty[] = MOCK_DRIVER_DUTIES;

export const GTFS_METADATA = {
  agencyName: 'КП «Одесміськелектротранс»',
  timezone: 'Europe/Kyiv',
  agencyUrl: 'https://oget.odessa.ua',
  totalUniqueRouteNumbers: ${new Set(generatedRoutes.map(r => r.number)).size},
  totalRoutes: ${generatedRoutes.length},
  totalStops: ${Object.keys(stopMap).length},
  totalTrips: ${trips.length},
  totalStopTimes: ${stopTimes.length}
};
`;

fs.writeFileSync(path.join(outputDir, 'gtfsParsedData.ts'), tsContent);
console.log('✅ Successfully wrote src/data/gtfsParsedData.ts');
