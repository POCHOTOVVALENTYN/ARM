const fs = require('fs');

const mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');
const gtfsData = fs.readFileSync('src/data/gtfsParsedData.ts', 'utf-8');

const missingIds = ['T7', 'T10', 'T12', 'T3'];
let routesToAppend = [];

for (const id of missingIds) {
    const regex = new RegExp(`{\\s*id:\\s*'${id}',[\\s\\S]*?}\\s*]?,\\s*\\n`, 'g');
    const match = regex.exec(mockData);
    if (match) {
        let routeStr = match[0];
        routeStr = routeStr.replace(/],\s*\n$/, '').replace(/,\s*\n$/, '');
        // Replace single quotes in keys to double quotes to match json-like structure, actually wait it's TS so it's fine.
        routesToAppend.push(routeStr);
    }
}

if (routesToAppend.length > 0) {
    let updatedGtfsData = gtfsData.replace(/\n];\n/, ',\n  ' + routesToAppend.join(',\n  ') + '\n];\n');
    fs.writeFileSync('src/data/gtfsParsedData.ts', updatedGtfsData);
    console.log(`Appended ${routesToAppend.length} missing routes to gtfsParsedData.ts`);
} else {
    console.log('No matching routes found in mockData.ts');
}

