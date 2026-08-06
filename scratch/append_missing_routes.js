const fs = require('fs');

const gtfsJson = JSON.parse(fs.readFileSync('src/data/gtfsParsed.json', 'utf-8'));
let tsData = fs.readFileSync('src/data/gtfsParsedData.ts', 'utf-8');

const tsIds = new Set([...tsData.matchAll(/"id":\s*"([^"]+)"/g)].map(m => m[1]));

const missing = [];
for (const r of gtfsJson) {
    const tsId = r.type === 'tram' ? 'T' + r.short_name : 'Tr' + r.short_name;
    if (!tsIds.has(tsId)) {
        missing.push(r);
    }
}

console.log(`Found ${missing.length} missing routes`);

let appendStr = '';
for (const r of missing) {
    const tsId = r.type === 'tram' ? 'T' + r.short_name : 'Tr' + r.short_name;
    
    // We need to fetch stations from stations array... Wait, we can just use the directions!
    // But wait, the previous ones have lengthDir1Km, stations, segments, etc.
    // Let's generate a basic object.
    
    const d0 = r.directions['0'];
    const d1 = r.directions['1'];
    
    const d0_first = d0 ? d0.firstStopId : '';
    const d0_last = d0 ? d0.lastStopId : '';
    
    // Let's grab all stations from trips
    const routeIds = [];
    
}
