const fs = require('fs');
const path = require('path');

const GTFS_DIR = path.join(__dirname, '..', 'GTFS_static_data');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'gtfsStopsData.ts');

function readCSV(filename) {
  const content = fs.readFileSync(path.join(GTFS_DIR, filename), 'utf8');
  const lines = content.split('\n').filter((l) => l.trim() !== '');
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  // For proper CSV parsing dealing with quotes
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

function generateCode(name) {
  // Try to grab the first letter of the first 3 words
  const words = name.split(/\s+/).filter(w => w.length > 0);
  let code = '';
  for (let i = 0; i < Math.min(3, words.length); i++) {
    // Only use alphabetical characters for code, fallback if needed
    const letter = words[i].replace(/[^А-Яа-яЄєІіЇїҐґA-Za-z0-9]/g, '')[0];
    if (letter) code += letter.toUpperCase();
  }
  if (code.length === 0) code = 'STN';
  return code;
}

function buildGtfsStops() {
  console.log('Reading GTFS data for stops...');

  const routes = readCSV('routes.txt');
  // Filter for electric transport
  const electricRoutes = new Set();
  routes.forEach(r => {
    // Assuming 0 (tram) and 11 (trolleybus). Often 3 is bus.
    if (r.route_type === '0' || r.route_type === '11' || r.route_type === '800') {
      electricRoutes.add(r.route_id);
    }
  });

  const trips = readCSV('trips.txt');
  const electricTrips = new Set();
  trips.forEach(t => {
    if (electricRoutes.has(t.route_id)) {
      electricTrips.add(t.trip_id);
    }
  });

  const stopTimes = readCSV('stop_times.txt');
  const usedStops = new Set();
  stopTimes.forEach(st => {
    if (electricTrips.has(st.trip_id)) {
      usedStops.add(st.stop_id);
    }
  });

  console.log(`Found ${usedStops.size} unique stops used by electric transport.`);

  const allStops = readCSV('stops.txt');
  const stations = [];

  allStops.forEach(s => {
    if (usedStops.has(s.stop_id)) {
      const lat = parseFloat(s.stop_lat);
      const lon = parseFloat(s.stop_lon);
      stations.push({
        id: s.stop_id,
        name: s.stop_name,
        code: generateCode(s.stop_name),
        isTerminal: false,
        lat: isNaN(lat) ? undefined : lat,
        lng: isNaN(lon) ? undefined : lon,
      });
    }
  });

  const fileContent = `// Цей файл згенеровано автоматично скриптом scripts/build_gtfs_stops.cjs
import { Station } from '../types';

export const GTFS_STATIONS: Station[] = ${JSON.stringify(stations, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
  console.log(`Successfully written ${stations.length} stations to src/data/gtfsStopsData.ts`);
}

buildGtfsStops();
