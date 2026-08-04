const fs = require('fs');
const path = require('path');

const files = [
  'src/components/routes/RouteFormModal.tsx',
  'src/components/routes/RoutePassport.tsx',
  'src/components/routes/RouteTravelMatrix.tsx',
  'src/components/views/LiveMapView.tsx',
  'src/components/views/TripGridView.tsx',
  'src/components/dispatcher/MareyDiagram.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the bad import from previous run
  content = content.replace(/import\s*\{\s*stations\s*\}\s*from\s*['"]\.\.\/\.\.\/data\/mockData['"];/, "import { useStationStore } from '../../store/useStationStore';");
  
  // Just in case it was still STATIONS
  content = content.replace(/import\s*\{\s*STATIONS\s*\}\s*from\s*['"]\.\.\/\.\.\/data\/mockData['"];/, "import { useStationStore } from '../../store/useStationStore';");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed imports in ' + file);
});
