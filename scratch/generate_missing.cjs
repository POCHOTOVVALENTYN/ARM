const fs = require('fs');

const gtfsJson = JSON.parse(fs.readFileSync('src/data/gtfsParsed.json', 'utf-8'));
let tsData = fs.readFileSync('src/data/gtfsParsedData.ts', 'utf-8');

const tsIds = new Set([...tsData.matchAll(/"id":\s*"([^"]+)"/g)].map(m => m[1]));

const missing = gtfsJson.filter(r => {
    const tsId = r.type === 'tram' ? 'T' + r.short_name : 'Tr' + r.short_name;
    return !tsIds.has(tsId);
});

let outputStr = '';

for (const r of missing) {
    const tsId = r.type === 'tram' ? 'T' + r.short_name : 'Tr' + r.short_name;
    const d0 = r.directions['0'];
    const d1 = r.directions['1'];
    
    // Default stations and segments for these dynamically generated ones
    // We will just use the terminal ids if they exist, else dummy
    const pid = d0 ? d0.firstStopId : 'dummy';
    const sid = d0 ? d0.lastStopId : 'dummy';
    
    outputStr += `  {
    "id": "${tsId}",
    "number": "${r.short_name}",
    "name": "${r.long_name}",
    "type": "${r.type}",
    "status": "active",
    "primaryTerminalId": "${pid}",
    "secondaryTerminalId": "${sid}",
    "lengthDir1Km": 15,
    "lengthDir2Km": 15,
    "stations": [
      "${pid}",
      "${sid}"
    ],
    "segments": [],
    "controlPoints": [],
    "activeVehiclesCount": {
      "workday": 5,
      "weekend": 4,
      "holiday": 3
    },
    "description": "Згенеровано автоматично"
  },
`;
}

// Read the original file again
let text = fs.readFileSync('src/data/gtfsParsedData.ts', 'utf-8');
text = text.replace(/\n\];\n/, ',\n' + outputStr + '\n];\n');
fs.writeFileSync('src/data/gtfsParsedData.ts', text);
console.log('Appended', missing.length, 'routes.');
