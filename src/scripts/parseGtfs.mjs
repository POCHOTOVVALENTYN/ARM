import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gtfsDir = path.resolve(__dirname, '../../GTFS_Static_Data');
const outputDir = path.resolve(__dirname, '../data');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle commas inside quoted fields
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

const routes = parseCSV(fs.readFileSync(path.join(gtfsDir, 'routes.txt'), 'utf-8'));
const stops = parseCSV(fs.readFileSync(path.join(gtfsDir, 'stops.txt'), 'utf-8'));
const trips = parseCSV(fs.readFileSync(path.join(gtfsDir, 'trips.txt'), 'utf-8'));
const stopTimes = parseCSV(fs.readFileSync(path.join(gtfsDir, 'stop_times.txt'), 'utf-8'));

const stopMap = {};
stops.forEach(s => stopMap[s.stop_id] = s.stop_name);

// Build trip terminal stops (first and last stops by sequence)
const tripToStops = {};
stopTimes.forEach(st => {
  if (!tripToStops[st.trip_id]) tripToStops[st.trip_id] = [];
  tripToStops[st.trip_id].push({ seq: parseInt(st.stop_sequence), stop_id: st.stop_id });
});

const tripTerminals = {};
Object.keys(tripToStops).forEach(tripId => {
  const sList = tripToStops[tripId].sort((a, b) => a.seq - b.seq);
  if (sList.length > 0) {
    tripTerminals[tripId] = {
      firstStopId: sList[0].stop_id,
      firstStopName: stopMap[sList[0].stop_id],
      lastStopId: sList[sList.length - 1].stop_id,
      lastStopName: stopMap[sList[sList.length - 1].stop_id]
    };
  }
});

// First pass: collect all GTFS route_ids grouped by logical route (type + short_name)
// Each GTFS route_id has its own long_name (one per direction).
const routeIdToGtfsRoute = {};
routes.forEach(r => {
  routeIdToGtfsRoute[r.route_id] = r;
});

// Group GTFS route_ids by logical route key
const logicalRouteGroups = {}; // key -> { routeIds: Set, type }
routes.forEach(r => {
  const typeStr = r.route_type === '0' ? 'tram' : 'trolleybus';
  const logicKey = `${typeStr}_${r.route_short_name}`;
  if (!logicalRouteGroups[logicKey]) {
    logicalRouteGroups[logicKey] = { routeIds: new Set(), type: typeStr, short_name: r.route_short_name };
  }
  logicalRouteGroups[logicKey].routeIds.add(r.route_id);
});

// For each logical route, find direction 0 and 1 terminals from trips
const logicalRoutes = {};

Object.entries(logicalRouteGroups).forEach(([logicKey, group]) => {
  // Collect all long_names for this logical route (typically 2: one per direction)
  const longNames = [];
  group.routeIds.forEach(rid => {
    const r = routeIdToGtfsRoute[rid];
    if (r && r.route_long_name) longNames.push(r.route_long_name);
  });

  // Find unique direction terminals
  const dirTerminals = new Map(); // firstStopId -> terminal data
  
  group.routeIds.forEach(rid => {
    const routeTrips = trips.filter(t => t.route_id === rid);
    routeTrips.forEach(t => {
      const term = tripTerminals[t.trip_id];
      if (term && !dirTerminals.has(term.firstStopId)) {
        dirTerminals.set(term.firstStopId, term);
      }
    });
  });

  // Convert to array, take first 2 unique directions
  const dirs = Array.from(dirTerminals.values()).slice(0, 2);

  // Build long_name from terminal stop names of direction 0
  // Format: "Terminal A — Terminal B"
  let longName;
  if (dirs.length >= 2) {
    longName = `${dirs[0].firstStopName} — ${dirs[0].lastStopName}`;
  } else if (dirs.length === 1) {
    longName = `${dirs[0].firstStopName} — ${dirs[0].lastStopName}`;
  } else {
    longName = longNames[0] || group.short_name;
  }

  logicalRoutes[logicKey] = {
    id: logicKey,
    short_name: group.short_name,
    long_name: longName,
    type: group.type,
    directions: {}
  };

  if (dirs[0]) logicalRoutes[logicKey].directions['0'] = dirs[0];
  if (dirs[1]) logicalRoutes[logicKey].directions['1'] = dirs[1];
});

fs.writeFileSync(path.join(outputDir, 'gtfsParsed.json'), JSON.stringify(Object.values(logicalRoutes), null, 2));
console.log(`✅ Parsed ${Object.keys(logicalRoutes).length} logical routes`);
Object.values(logicalRoutes).forEach(r => {
  const d0 = r.directions['0'];
  const d1 = r.directions['1'];
  const label = r.type === 'tram' ? 'Тр' : 'Тб';
  console.log(`  ${label} ${r.short_name}: ${r.long_name}`);
  if (d0) console.log(`    Напр. 1: ${d0.firstStopName} → ${d0.lastStopName}`);
  if (d1) console.log(`    Напр. 2: ${d1.firstStopName} → ${d1.lastStopName}`);
});
