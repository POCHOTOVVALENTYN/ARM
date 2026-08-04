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

  // Replace STATIONS with stations
  content = content.replace(/\bSTATIONS\b/g, 'stations');

  // Find component start and inject useStationStore
  const componentMatch = content.match(/const\s+\w+\s*:\s*React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{/);
  if (componentMatch) {
    const insertPos = componentMatch.index + componentMatch[0].length;
    content = content.slice(0, insertPos) + '\n  const stations = useStationStore(state => state.stations);' + content.slice(insertPos);
  } else {
    // Try finding regular function component
    const funcMatch = content.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/);
    if (funcMatch) {
      const insertPos = funcMatch.index + funcMatch[0].length;
      content = content.slice(0, insertPos) + '\n  const stations = useStationStore(state => state.stations);' + content.slice(insertPos);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

// NetworkSettingsTab special case
const networkFile = path.join(__dirname, '..', 'src/components/tabs/NetworkSettingsTab.tsx');
let netContent = fs.readFileSync(networkFile, 'utf8');
netContent = netContent.replace(/,\s*STATIONS/, '');
netContent = netContent.replace(/import \{.*?MOCK_HUBS.*?\} from '..\/..\/data\/mockData';/, (match) => match + "\nimport { useStationStore } from '../../store/useStationStore';");
const netCompMatch = netContent.match(/const\s+NetworkSettingsTab\s*:\s*React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{/);
if (netCompMatch) {
  const insertPos = netCompMatch.index + netCompMatch[0].length;
  netContent = netContent.slice(0, insertPos) + '\n  const stations = useStationStore(state => state.stations);' + netContent.slice(insertPos);
}
netContent = netContent.replace(/\bSTATIONS\b/g, 'stations');
fs.writeFileSync(networkFile, netContent, 'utf8');
console.log('Updated NetworkSettingsTab.tsx');
