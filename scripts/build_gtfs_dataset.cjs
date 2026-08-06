const fs = require('fs');

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = [];
    let inside = false;
    let entry = '';
    for (let char of lines[i]) {
      if (char === '"') inside = !inside;
      else if (char === ',' && !inside) {
        row.push(entry.trim().replace(/^"|"$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^"|"$/g, ''));
    if (row.length >= headers.length) {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = row[idx]);
      rows.push(obj);
    }
  }
  return rows;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const routesRaw = parseCSV(fs.readFileSync('gtfs_static_data/routes.txt', 'utf8'));
const stopsRaw = parseCSV(fs.readFileSync('gtfs_static_data/stops.txt', 'utf8'));
const tripsRaw = parseCSV(fs.readFileSync('gtfs_static_data/trips.txt', 'utf8'));
const stopTimesRaw = parseCSV(fs.readFileSync('gtfs_static_data/stop_times.txt', 'utf8'));

const stopsMap = {};
stopsRaw.forEach(s => stopsMap[s.stop_id] = s);

const tripMap = {};
tripsRaw.forEach(t => tripMap[t.trip_id] = t);

const tripsByRoute = {};
tripsRaw.forEach(t => {
  if (!tripsByRoute[t.route_id]) tripsByRoute[t.route_id] = [];
  tripsByRoute[t.route_id].push(t);
});

const stopTimesByTrip = {};
stopTimesRaw.forEach(st => {
  if (!stopTimesByTrip[st.trip_id]) stopTimesByTrip[st.trip_id] = [];
  stopTimesByTrip[st.trip_id].push(st);
});

// Sort stop_times
Object.values(stopTimesByTrip).forEach(stList => {
  stList.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));
});

const routeColorPalette = [
  '#EF4444', '#3B82F6', '#10B981', '#06B6D4', '#8B5CF6', 
  '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#84CC16', 
  '#F97316', '#34D399', '#A855F7', '#E11D48', '#0284C7'
];

const uniqueRouteNumbers = [...new Set(routesRaw.map(r => r.route_short_name))].sort((a, b) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b);
});

const generatedRoutes = [];

uniqueRouteNumbers.forEach(numStr => {
  const matchingRoutes = routesRaw.filter(r => r.route_short_name === numStr);
  if (matchingRoutes.length === 0) return;
  const mainRoute = matchingRoutes[0];
  const type = mainRoute.route_type === '11' || mainRoute.route_id.includes('Tr') ? 'trolleybus' : 'tram';
  const routeId = type === 'tram' ? `T${numStr}` : `Tr${numStr}`;

  let representativeTrip = null;
  let repReverseTrip = null;
  
  for (let r of matchingRoutes) {
    const trips = tripsByRoute[r.route_id] || [];
    for (let t of trips) {
      if (!representativeTrip && t.direction_id === '0' && stopTimesByTrip[t.trip_id]) {
        representativeTrip = t;
      }
      if (!repReverseTrip && t.direction_id === '1' && stopTimesByTrip[t.trip_id]) {
        repReverseTrip = t;
      }
    }
  }

  if (!representativeTrip && repReverseTrip) representativeTrip = repReverseTrip;
  if (!representativeTrip) return; // No stop times found

  const stopTimes = stopTimesByTrip[representativeTrip.trip_id];
  const stationIds = stopTimes.map(st => st.stop_id);
  
  let lengthDir1 = 0;
  for (let i = 0; i < stopTimes.length - 1; i++) {
    const s1 = stopsMap[stopTimes[i].stop_id];
    const s2 = stopsMap[stopTimes[i+1].stop_id];
    if (s1 && s2) {
      lengthDir1 += haversine(parseFloat(s1.stop_lat), parseFloat(s1.stop_lon), parseFloat(s2.stop_lat), parseFloat(s2.stop_lon));
    }
  }

  let lengthDir2 = lengthDir1;
  if (repReverseTrip) {
    const reverseStopTimes = stopTimesByTrip[repReverseTrip.trip_id];
    let len = 0;
    for (let i = 0; i < reverseStopTimes.length - 1; i++) {
      const s1 = stopsMap[reverseStopTimes[i].stop_id];
      const s2 = stopsMap[reverseStopTimes[i+1].stop_id];
      if (s1 && s2) {
        len += haversine(parseFloat(s1.stop_lat), parseFloat(s1.stop_lon), parseFloat(s2.stop_lat), parseFloat(s2.stop_lon));
      }
    }
    lengthDir2 = len;
  }

  const primaryTerm = stationIds[0] || '';
  const secondaryTerm = stationIds[stationIds.length - 1] || '';
  
  const reverseStationIds = repReverseTrip ? stopTimesByTrip[repReverseTrip.trip_id].map(st => st.stop_id) : [];
  const allStationIds = [...new Set([...stationIds, ...reverseStationIds])];

  const segments = [];
  for (let i = 0; i < stationIds.length - 1; i++) {
    const s1 = stopsMap[stationIds[i]];
    const s2 = stopsMap[stationIds[i+1]];
    let dist = 1;
    if (s1 && s2) {
      dist = haversine(parseFloat(s1.stop_lat), parseFloat(s1.stop_lon), parseFloat(s2.stop_lat), parseFloat(s2.stop_lon));
    }
    segments.push({
      fromStationId: stationIds[i],
      toStationId: stationIds[i+1],
      distanceKm: Number(dist.toFixed(2)),
      baseTravelTimes: {
        morning_exit: 2,
        morning_peak: 3,
        off_peak: 2,
        evening_peak: 3,
        evening_decline: 2
      },
      trafficLightCount: 1,
      avgTrafficLightDelayMin: 0.5,
      isSharedSegment: false,
      sharedWithRoutes: []
    });
  }

  generatedRoutes.push({
    id: routeId,
    number: numStr,
    name: mainRoute.route_long_name,
    type,
    status: 'active',
    primaryTerminalId: primaryTerm,
    secondaryTerminalId: secondaryTerm,
    lengthDir1Km: Number(lengthDir1.toFixed(2)),
    lengthDir2Km: Number(lengthDir2.toFixed(2)),
    stations: stationIds,
    allStations: allStationIds,
    segments,
    activeVehiclesCount: {
      workday: 10,
      weekend: 8,
      holiday: 6
    },
    description: `Реальний маршрут GTFS ${numStr}`
  });
});

console.log('Generated Routes Count:', generatedRoutes.length);

const tsContent = `// Auto-generated from GTFS Data
import { Route, VehicleBlock, DriverDuty } from '../types';
import { MOCK_VEHICLE_BLOCKS, MOCK_DRIVER_DUTIES } from './mockData';

export const GTFS_ROUTES: Route[] = ${JSON.stringify(generatedRoutes, null, 2)};

export const GTFS_VEHICLE_BLOCKS: VehicleBlock[] = MOCK_VEHICLE_BLOCKS;
export const GTFS_DRIVER_DUTIES: DriverDuty[] = MOCK_DRIVER_DUTIES;

export const GTFS_METADATA = {
  agencyName: 'КП «Одесміськелектротранс»',
  timezone: 'Europe/Kyiv',
  agencyUrl: 'https://oget.odessa.ua',
  totalUniqueRouteNumbers: ${generatedRoutes.length},
  totalRoutes: ${routesRaw.length},
  totalStops: ${stopsRaw.length},
  totalTrips: ${tripsRaw.length},
  totalStopTimes: ${stopTimesRaw.length}
};
`;

fs.writeFileSync('src/data/gtfsParsedData.ts', tsContent, 'utf8');
console.log('Successfully written src/data/gtfsParsedData.ts');
