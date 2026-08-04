const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let insideQuote = false;
    let currentVal = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    results.push(row);
  }
  return results;
}

const gtfsDir = './gtfs_static_data';
const agency = parseCSV(fs.readFileSync(path.join(gtfsDir, 'agency.txt'), 'utf8'));
const routes = parseCSV(fs.readFileSync(path.join(gtfsDir, 'routes.txt'), 'utf8'));
const stops = parseCSV(fs.readFileSync(path.join(gtfsDir, 'stops.txt'), 'utf8'));
const calendar = parseCSV(fs.readFileSync(path.join(gtfsDir, 'calendar.txt'), 'utf8'));
const trips = parseCSV(fs.readFileSync(path.join(gtfsDir, 'trips.txt'), 'utf8'));

console.log('--- GTFS ANALYSIS ---');
console.log('Agency:', agency);
console.log('Total Routes:', routes.length);
console.log('Total Stops:', stops.length);
console.log('Total Calendar Services:', calendar);
console.log('Total Trips:', trips.length);

const routeTypes = {};
routes.forEach(r => {
  const type = r.route_type === '0' ? 'Tram' : r.route_type === '11' || r.route_type === '3' ? 'Trolleybus' : `Type_${r.route_type}`;
  routeTypes[type] = (routeTypes[type] || 0) + 1;
});
console.log('Route Types Distribution:', routeTypes);

const routeSummary = {};
routes.forEach(r => {
  const num = r.route_short_name;
  if (!routeSummary[num]) {
    routeSummary[num] = {
      shortName: num,
      longNames: [],
      types: new Set(),
      routeIds: []
    };
  }
  routeSummary[num].longNames.push(r.route_long_name);
  routeSummary[num].types.add(r.route_type === '0' ? 'tram' : 'trolleybus');
  routeSummary[num].routeIds.push(r.route_id);
});

console.log('\n--- ROUTES SUMMARY ---');
Object.keys(routeSummary).sort((a,b) => (parseInt(a)||999) - (parseInt(b)||999)).forEach(num => {
  const r = routeSummary[num];
  console.log(`Route ${num} (${Array.from(r.types).join(',')}): IDs [${r.routeIds.join(', ')}]`);
  r.longNames.forEach(ln => console.log(`   -> ${ln}`));
});

// Trip counts per route_id
const tripCountByRouteId = {};
trips.forEach(t => {
  tripCountByRouteId[t.route_id] = (tripCountByRouteId[t.route_id] || 0) + 1;
});

console.log('\n--- TRIPS PER ROUTE ID ---');
Object.keys(tripCountByRouteId).forEach(rid => {
  const routeObj = routes.find(r => r.route_id === rid);
  console.log(`RouteID ${rid} (${routeObj ? routeObj.route_short_name + ': ' + routeObj.route_long_name : 'Unknown'}): ${tripCountByRouteId[rid]} trips`);
});
