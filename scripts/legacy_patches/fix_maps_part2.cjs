const fs = require('fs');

// Fix SimulationMapView.tsx
let simMap = fs.readFileSync('src/components/views/SimulationMapView.tsx', 'utf-8');
simMap = simMap.replace(
  "function findNextStopName(lat: number, lon: number): string {",
  "function findNextStopName(lat: number, lon: number, stops: any[]): string {"
);
simMap = simMap.replace(
  "const nextStopName = findNextStopName(lat, lon);",
  "const nextStopName = findNextStopName(lat, lon, stops);"
);
fs.writeFileSync('src/components/views/SimulationMapView.tsx', simMap);

// Fix AdminView.tsx
let adminView = fs.readFileSync('src/components/views/AdminView.tsx', 'utf-8');
adminView = adminView.replace(
  "import { ShieldAlert, Database, Plus, RefreshCw } from 'lucide-react';",
  "import { ShieldAlert, Database, Plus, RefreshCw, Settings } from 'lucide-react';"
);
fs.writeFileSync('src/components/views/AdminView.tsx', adminView);

console.log("Replaced successfully part 2!");
