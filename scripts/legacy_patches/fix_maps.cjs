const fs = require('fs');

// Fix SimulationMapView.tsx
let simMap = fs.readFileSync('src/components/views/SimulationMapView.tsx', 'utf-8');
simMap = simMap.replace(
  "import { GTFS_MAP_ROUTES, GTFS_MAP_STOPS, ODESA_DISTRICTS, GtfsMapRoute, GtfsStop, OdesaDistrict } from '../../data/gtfsMapData';",
  "// No static GTFS_MAP imports needed"
);
simMap = simMap.replace(
  "const { liveBlocks, isGtfsActive, loadGtfsData, fetchInitialData, theme } = useScheduleStore();",
  "const { liveBlocks, isGtfsActive, loadGtfsData, fetchInitialData, theme, routes, stops } = useScheduleStore();"
);
simMap = simMap.replace(/GTFS_MAP_ROUTES/g, "routes");
simMap = simMap.replace(/GTFS_MAP_STOPS/g, "stops");

// Remove districts logic
const districtLogicStart = simMap.indexOf("// C. DRAW ODESA ADMINISTRATIVE DISTRICTS");
const districtLogicEnd = simMap.indexOf("// D. DRAW GTFS STOPS & CHECKPOINTS");
if (districtLogicStart !== -1 && districtLogicEnd !== -1) {
  simMap = simMap.substring(0, districtLogicStart) + simMap.substring(districtLogicEnd);
}
fs.writeFileSync('src/components/views/SimulationMapView.tsx', simMap);

// Fix LiveMapView.tsx
let liveMap = fs.readFileSync('src/components/views/LiveMapView.tsx', 'utf-8');
liveMap = liveMap.replace(
  "import { GTFS_STATIONS } from '../../data/gtfsStopsData';",
  ""
);
liveMap = liveMap.replace(
  "const { liveSchedule, validationWarnings, updateTripDeparture } = useScheduleStore();",
  "const { liveSchedule, validationWarnings, updateTripDeparture, stops } = useScheduleStore();"
);
liveMap = liveMap.replace(/GTFS_STATIONS/g, "stops");
fs.writeFileSync('src/components/views/LiveMapView.tsx', liveMap);

console.log("Replaced successfully!");
