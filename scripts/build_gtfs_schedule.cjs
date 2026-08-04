const fs = require('fs');
const path = require('path');

const GTFS_DIR = path.join(__dirname, '..', 'GTFS_static_data');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'gtfsBlocksData.ts');

const DEPOTS = [
  { id: 'depot_tram_1', type: 'tram', lat: 46.4678, lng: 30.7311 },
  { id: 'depot_tram_2', type: 'tram', lat: 46.4952, lng: 30.7183 },
  { id: 'depot_trolleybus_1', type: 'trolleybus', lat: 46.4312, lng: 30.7161 },
];

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

function timeToMinutes(timeStr) {
  const [h, m, s] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function readCSV(filename) {
  const content = fs.readFileSync(path.join(GTFS_DIR, filename), 'utf8');
  const lines = content.split('\n').filter((l) => l.trim() !== '');
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    const row = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      row[h] = val.trim();
    });
    rows.push(row);
  }
  return rows;
}

function buildGtfsSchedule() {
  console.log('Reading routes.txt...');
  const routes = readCSV('routes.txt');
  const electricRouteIds = new Set();
  const routeTypes = {};
  const routeAppIds = {}; // map raw route_id to T3, Tr10 etc.

  routes.forEach(r => {
    if (r.route_type === '0' || r.route_type === '11' || r.route_type === '800') {
      electricRouteIds.add(r.route_id);
      const type = r.route_type === '0' ? 'tram' : 'trolleybus';
      routeTypes[r.route_id] = type;
      
      const numStr = r.route_short_name || r.route_id;
      routeAppIds[r.route_id] = type === 'tram' ? `T${numStr}` : `Tr${numStr}`;
    }
  });

  console.log('Reading trips.txt...');
  const trips = readCSV('trips.txt').filter(t => electricRouteIds.has(t.route_id));
  const tripMap = new Map(); // trip_id -> trip details
  trips.forEach(t => {
    tripMap.set(t.trip_id, {
      ...t,
      stops: [],
    });
  });

  console.log('Reading stop_times.txt... (this might take a few seconds)');
  const stopTimesContent = fs.readFileSync(path.join(GTFS_DIR, 'stop_times.txt'), 'utf8');
  const stLines = stopTimesContent.split('\n');
  const stHeaders = stLines[0].split(',').map(h => h.trim());
  const tripIdIdx = stHeaders.indexOf('trip_id');
  const arrivalIdx = stHeaders.indexOf('arrival_time');
  const departureIdx = stHeaders.indexOf('departure_time');
  const stopIdIdx = stHeaders.indexOf('stop_id');
  const stopSeqIdx = stHeaders.indexOf('stop_sequence');

  for (let i = 1; i < stLines.length; i++) {
    const line = stLines[i];
    if (!line) continue;
    // stop_times usually don't have quoted commas in Odessgorelektrotrans data, simple split is faster
    const parts = line.split(',');
    const tripId = parts[tripIdIdx];
    if (tripMap.has(tripId)) {
      tripMap.get(tripId).stops.push({
        arrival: parts[arrivalIdx],
        departure: parts[departureIdx],
        stopId: parts[stopIdIdx],
        seq: parseInt(parts[stopSeqIdx], 10),
      });
    }
  }

  console.log('Reading stops.txt...');
  const stops = readCSV('stops.txt');
  const stopCoords = {};
  stops.forEach(s => {
    stopCoords[s.stop_id] = { lat: parseFloat(s.stop_lat), lng: parseFloat(s.stop_lon) };
  });

  console.log('Sorting stops and building trip summaries...');
  const parsedTrips = [];
  for (const [tripId, trip] of tripMap.entries()) {
    if (trip.stops.length < 2) continue;
    trip.stops.sort((a, b) => a.seq - b.seq);
    const firstStop = trip.stops[0];
    const lastStop = trip.stops[trip.stops.length - 1];
    
    parsedTrips.push({
      id: tripId,
      rawRouteId: trip.route_id,
      routeId: routeAppIds[trip.route_id],
      serviceId: trip.service_id,
      direction: parseInt(trip.direction_id, 10) + 1 || 1, // GTFS uses 0/1, we use 1/2
      departureTimeStr: firstStop.departure,
      departureMin: timeToMinutes(firstStop.departure),
      arrivalTimeStr: lastStop.arrival,
      arrivalMin: timeToMinutes(lastStop.arrival),
      startStationId: firstStop.stopId,
      endStationId: lastStop.stopId,
    });
  }

  console.log('Grouping trips into blocks (heuristic)...');
  // Group by route and service
  const blocks = [];
  const tripsByRouteService = {};
  parsedTrips.forEach(t => {
    const key = `${t.routeId}_${t.serviceId}`;
    if (!tripsByRouteService[key]) tripsByRouteService[key] = [];
    tripsByRouteService[key].push(t);
  });

  let blockCounter = 1;

  Object.values(tripsByRouteService).forEach(routeTrips => {
    // Sort by departure time
    routeTrips.sort((a, b) => a.departureMin - b.departureMin);
    
    const unassigned = [...routeTrips];

    while (unassigned.length > 0) {
      const currentTrip = unassigned.shift();
      const blockTrips = [currentTrip];
      let lastTrip = currentTrip;

      // Find subsequent "return" trips
      let foundNext = true;
      while (foundNext) {
        foundNext = false;
        for (let i = 0; i < unassigned.length; i++) {
          const candidate = unassigned[i];
          
          const endCoord = stopCoords[lastTrip.endStationId];
          const startCoord = stopCoords[candidate.startStationId];
          
          let distKm = 0;
          if (endCoord && startCoord) {
            distKm = haversine(endCoord.lat, endCoord.lng, startCoord.lat, startCoord.lng);
          } else {
            // Fallback to exact match if coords are missing
            distKm = candidate.startStationId === lastTrip.endStationId ? 0 : 999;
          }

          // We look for a trip that starts nearby the terminal where the last trip ended,
          // and starts shortly after (0 to 60 mins).
          if (distKm <= 0.5) {
             // console.log(`Nearby! dist=${distKm.toFixed(2)}, candidate.dep=${candidate.departureMin}, last.arr=${lastTrip.arrivalMin}`);
          }

          if (
            distKm <= 0.5 &&
            candidate.departureMin >= lastTrip.arrivalMin &&
            candidate.departureMin <= lastTrip.arrivalMin + 180 // Increased to 3 hours just in case
          ) {
            blockTrips.push(candidate);
            lastTrip = candidate;
            unassigned.splice(i, 1);
            foundNext = true;
            break;
          }
        }
      }

      const routeType = routeTypes[currentTrip.rawRouteId];
      // Pick a depot
      const suitableDepots = DEPOTS.filter(d => d.type === routeType);
      const depot = suitableDepots[0] || DEPOTS[0];
      const startCoord = stopCoords[currentTrip.startStationId];
      
      let depotExitTimeStr = '00:00';
      if (startCoord && depot) {
        const distKm = haversine(depot.lat, depot.lng, startCoord.lat, startCoord.lng);
        // Assuming ~15 km/h average city speed for deadhead, + 10 mins prep
        const travelTimeMins = Math.round((distKm / 15) * 60);
        const exitMin = currentTrip.departureMin - travelTimeMins - 10;
        depotExitTimeStr = minutesToTime(Math.max(0, exitMin));
      } else {
        depotExitTimeStr = minutesToTime(Math.max(0, currentTrip.departureMin - 30));
      }
      
      const lastBlockTrip = blockTrips[blockTrips.length - 1];
      let depotReturnTimeStr = '23:59';
      const endCoord = stopCoords[lastBlockTrip.endStationId];
      if (endCoord && depot) {
        const distKm = haversine(depot.lat, depot.lng, endCoord.lat, endCoord.lng);
        const travelTimeMins = Math.round((distKm / 15) * 60);
        depotReturnTimeStr = minutesToTime(lastBlockTrip.arrivalMin + travelTimeMins);
      } else {
        depotReturnTimeStr = minutesToTime(lastBlockTrip.arrivalMin + 30);
      }

      blocks.push({
        id: `Block-${currentTrip.routeId}-${blockCounter++}`,
        vehicleNumber: `${routeType === 'tram' ? 'T' : 'Tr'}-${Math.floor(Math.random() * 9000) + 1000}`,
        type: routeType,
        depotId: depot.id,
        routeId: currentTrip.routeId,
        depotExitTime: depotExitTimeStr.slice(0, 5),
        depotReturnTime: depotReturnTimeStr.slice(0, 5),
        trips: blockTrips.map(t => ({
          id: t.id,
          blockId: '', // Set below
          dutyId: '',
          routeId: t.routeId,
          direction: t.direction,
          departureTime: t.departureTimeStr.slice(0, 5),
          arrivalTime: t.arrivalTimeStr.slice(0, 5),
          startStationId: t.startStationId,
          endStationId: t.endStationId,
          status: 'normal',
        })),
      });
    }
  });

  // Fix blockId inside trips
  blocks.forEach(b => {
    b.trips.forEach(t => t.blockId = b.id);
  });

  console.log(`Generated ${blocks.length} vehicle blocks.`);

  const fileContent = `// Цей файл згенеровано автоматично скриптом scripts/build_gtfs_schedule.cjs
import { VehicleBlock } from '../types';

export const GTFS_VEHICLE_BLOCKS: VehicleBlock[] = ${JSON.stringify(blocks, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
  console.log('Successfully written gtfsBlocksData.ts');
}

buildGtfsSchedule();
