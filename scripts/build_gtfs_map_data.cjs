const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = [];
    let inside = false;
    let entry = '';
    for (let char of lines[i]) {
      if (char === '\"') inside = !inside;
      else if (char === ',' && !inside) {
        row.push(entry.trim().replace(/^\"|\"$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^\"|\"$/g, ''));
    if (row.length >= headers.length) {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = row[idx]);
      rows.push(obj);
    }
  }
  return rows;
}

const routesRaw = parseCSV(fs.readFileSync('gtfs_static_data/routes.txt', 'utf8'));
const stopsRaw = parseCSV(fs.readFileSync('gtfs_static_data/stops.txt', 'utf8'));
const tripsRaw = parseCSV(fs.readFileSync('gtfs_static_data/trips.txt', 'utf8'));
const shapesRaw = parseCSV(fs.readFileSync('gtfs_static_data/shapes.txt', 'utf8'));

// 1. Process Shapes
const shapePointsMap = {};
shapesRaw.forEach(s => {
  const sid = s.shape_id;
  if (!shapePointsMap[sid]) shapePointsMap[sid] = [];
  const lat = parseFloat(s.shape_pt_lat);
  const lon = parseFloat(s.shape_pt_lon);
  const seq = parseInt(s.shape_pt_sequence, 10);
  if (!isNaN(lat) && !isNaN(lon)) {
    shapePointsMap[sid].push({ lat, lon, seq });
  }
});

// Sort and downsample close points (< 3m) to reduce size
Object.keys(shapePointsMap).forEach(sid => {
  shapePointsMap[sid].sort((a, b) => a.seq - b.seq);
  const filtered = [];
  shapePointsMap[sid].forEach((pt, idx) => {
    if (idx === 0) {
      filtered.push([Number(pt.lat.toFixed(5)), Number(pt.lon.toFixed(5))]);
    } else {
      const prev = filtered[filtered.length - 1];
      const dLat = Math.abs(pt.lat - prev[0]);
      const dLon = Math.abs(pt.lon - prev[1]);
      if (dLat > 0.00005 || dLon > 0.00005 || idx === shapePointsMap[sid].length - 1) {
        filtered.push([Number(pt.lat.toFixed(5)), Number(pt.lon.toFixed(5))]);
      }
    }
  });
  shapePointsMap[sid] = filtered;
});

// 2. Major Terminals/Checkpoints keywords
const checkpointKeywords = [
  'вокзал', 'старосінна', 'тираспольськ', 'пересипськ', 'паустовського',
  'люстдорфськ', 'аркадія', 'інглезі', 'пастера', 'слобідськ', 'херсонськ',
  'застава', 'суперфосфатн', 'архітекторськ', 'корольова', 'донського', '10 квітня',
  'привоз', 'деревянк', 'грецьк', 'ринок'
];

// Process Stops
const stopsMap = {};
const stopsList = stopsRaw.map(s => {
  const nameClean = s.stop_name
    .replace(/\"\"/g, '«')
    .replace(/\"/g, '')
    .trim();

  const isCheck = checkpointKeywords.some(kw => nameClean.toLowerCase().includes(kw));
  const stopObj = {
    id: s.stop_id,
    name: nameClean,
    lat: Number(parseFloat(s.stop_lat).toFixed(5)),
    lon: Number(parseFloat(s.stop_lon).toFixed(5)),
    isCheckpoint: isCheck
  };
  stopsMap[s.stop_id] = stopObj;
  return stopObj;
});

// 3. Map Route Trips & Shapes
const routeTripsMap = {};
tripsRaw.forEach(t => {
  if (!routeTripsMap[t.route_id]) routeTripsMap[t.route_id] = [];
  routeTripsMap[t.route_id].push(t);
});

// Group by route_short_name
const routeColorPalette = [
  '#EF4444', '#3B82F6', '#10B981', '#06B6D4', '#8B5CF6', 
  '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#84CC16', 
  '#F97316', '#34D399', '#A855F7', '#E11D48', '#0284C7', 
  '#059669', '#D97706', '#4F46E5', '#2563EB', '#D97706'
];

const uniqueRouteNumbers = [...new Set(routesRaw.map(r => r.route_short_name))].sort((a, b) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b);
});

const mapRoutes = [];

uniqueRouteNumbers.forEach((numStr, colorIdx) => {
  // Find all routesRaw entries for this short name
  const matchingRoutes = routesRaw.filter(r => r.route_short_name === numStr);
  if (matchingRoutes.length === 0) return;

  const mainRoute = matchingRoutes[0];
  const type = mainRoute.route_type === '11' || mainRoute.route_id.includes('Tr') ? 'trolleybus' : 'tram';
  const prefix = type === 'tram' ? 'Трамвай №' : 'Тролейбус №';
  const routeId = type === 'tram' ? `T${numStr}` : `Tr${numStr}`;

  // Gather all shapes associated with this route_short_name
  let shapeDir1 = [];
  let shapeDir2 = [];

  matchingRoutes.forEach(r => {
    const trips = routeTripsMap[r.route_id] || [];
    trips.forEach(t => {
      if (t.shape_id && shapePointsMap[t.shape_id]) {
        if (t.direction_id === '0' || !shapeDir1.length) {
          shapeDir1 = shapePointsMap[t.shape_id];
        } else if (t.direction_id === '1' && !shapeDir2.length) {
          shapeDir2 = shapePointsMap[t.shape_id];
        }
      }
    });
  });

  if (!shapeDir1.length && shapeDir2.length) shapeDir1 = shapeDir2;
  if (!shapeDir2.length && shapeDir1.length) shapeDir2 = [...shapeDir1].reverse();

  // If no shapes found, skip
  if (!shapeDir1.length) return;

  const color = routeColorPalette[colorIdx % routeColorPalette.length];

  mapRoutes.push({
    id: routeId,
    gtfsRouteIds: matchingRoutes.map(r => r.route_id),
    number: numStr,
    code: `${prefix}${numStr}`,
    name: mainRoute.route_long_name,
    type,
    color,
    shape: shapeDir1,
    shapeReverse: shapeDir2
  });
});

console.log('Processed Map Routes:', mapRoutes.length);
console.log('Processed Map Stops:', stopsList.length);

// Generate TypeScript Output
const tsContent = `// Auto-generated GTFS Map Data for Odesa Simulation
export interface GtfsStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  isCheckpoint?: boolean;
}

export interface GtfsMapRoute {
  id: string;
  gtfsRouteIds: string[];
  number: string;
  code: string;
  name: string;
  type: 'tram' | 'trolleybus';
  color: string;
  shape: [number, number][];
  shapeReverse: [number, number][];
}

export interface OdesaDistrict {
  id: string;
  name: string;
  ukrName: string;
  center: [number, number];
  color: string;
  description: string;
  bounds?: [number, number][];
  keyHubs: string[];
}

export const GTFS_MAP_STOPS: GtfsStop[] = ${JSON.stringify(stopsList, null, 2)};

export const GTFS_MAP_ROUTES: GtfsMapRoute[] = ${JSON.stringify(mapRoutes, null, 2)};

export const ODESA_DISTRICTS: OdesaDistrict[] = [
  {
    id: 'dist_prymorskyi',
    name: 'Prymorskyi District',
    ukrName: 'Приморський район',
    center: [46.4720, 30.7420],
    color: '#3B82F6',
    description: 'Історичний центр, Аркадія, Французький бульвар, Морвокзал, Вокзал',
    bounds: [
      [46.495, 30.725],
      [46.490, 30.755],
      [46.425, 30.768],
      [46.455, 30.725]
    ],
    keyHubs: ['Залізничний вокзал', 'Старосінна площа', 'Аркадія', 'Парк ім. Т. Шевченка']
  },
  {
    id: 'dist_peresypskyi',
    name: 'Peresypskyi (Suvorovskyi) District',
    ukrName: 'Пересипський район',
    center: [46.5450, 30.7650],
    color: '#10B981',
    description: 'селище Котовського, Пересипський міст, Лузанівка, Ярмаркова пл.',
    bounds: [
      [46.495, 30.730],
      [46.595, 30.805],
      [46.580, 30.820],
      [46.490, 30.750]
    ],
    keyHubs: ['Пересипський міст', 'вул. Паустовського', 'Ярмаркова площа', 'Продмаш']
  },
  {
    id: 'dist_khadzhybeyskyi',
    name: 'Khadzhybeyskyi (Malynovskyi) District',
    ukrName: 'Хаджибейський район',
    center: [46.4600, 30.7000],
    color: '#F59E0B',
    description: 'Молдаванка, Черемушки, Застава I, Застава II, Ближні Млини',
    bounds: [
      [46.485, 30.650],
      [46.485, 30.725],
      [46.435, 30.720],
      [46.435, 30.650]
    ],
    keyHubs: ['Тираспольська площа', 'вул. Іцхака Рабіна', 'вул. Інглезі', 'Застава I']
  },
  {
    id: 'dist_kyivskyi',
    name: 'Kyivskyi District',
    ukrName: 'Київський район',
    center: [46.3980, 30.7200],
    color: '#8B5CF6',
    description: 'ж/м Таїрова, Люстдорфська дорога, Великий Фонтан, Чорноморка',
    bounds: [
      [46.435, 30.680],
      [46.435, 30.765],
      [46.360, 30.710],
      [46.360, 30.680]
    ],
    keyHubs: ['11-а ст. Люстдорфської дороги', 'вул. Архітекторська', 'пл. Незалежності']
  },
  {
    id: 'dist_slobidka',
    name: 'Slobidka Microdistrict',
    ukrName: 'Слобідка та Воробйова',
    center: [46.5020, 30.7120],
    color: '#EC4899',
    description: 'Слобідський ринок, Дитяча обласна лікарня, Трамвайне депо №2',
    keyHubs: ['Слобідський ринок', 'вул. Академіка Воробйова']
  },
  {
    id: 'dist_khadzhybey_liman',
    name: 'Khadzhybey Liman Area',
    ukrName: 'Хаджибейський лиман',
    center: [46.5250, 30.6820],
    color: '#06B6D4',
    description: 'Окремий трамвайний радіус №20, Херсонський сквер — Лиман',
    keyHubs: ['Херсонський сквер', 'Хаджибейський лиман']
  }
];
`;

fs.writeFileSync('src/data/gtfsMapData.ts', tsContent, 'utf8');
console.log('Successfully written src/data/gtfsMapData.ts!');
