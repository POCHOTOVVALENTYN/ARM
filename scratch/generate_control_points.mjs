import fs from 'fs';
import path from 'path';

const file = 'src/data/gtfsParsedData.ts';
let text = fs.readFileSync(file, 'utf-8');

text = text.replace(/controlPoints:\s*\[\s*\],/g, function(match, offset, string) {
    // Find the stations array just above it
    const preMatch = string.slice(0, offset);
    const stationsMatch = preMatch.match(/"stations":\s*\[(.*?)\]/s);
    if (!stationsMatch) return match;
    
    const stationsStr = stationsMatch[1];
    const stations = [...stationsStr.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    
    if (stations.length === 0) return match;
    
    let controlPointsArr = stations.map((sid, i) => {
        const pType = (i === 0 || i === stations.length - 1) ? 'terminal' : 'intermediate';
        return `      { id: 'cp_' + Math.random().toString(36).substr(2, 9), controlPointId: "${sid}", tracksCount: 1, trackType: 'main_loop', pointType: '${pType}' }`;
    });
    
    // I can't use Math.random() in a replace that needs to be deterministic, let's use the station id
    controlPointsArr = stations.map((sid, i) => {
        const pType = (i === 0 || i === stations.length - 1) ? 'terminal' : 'intermediate';
        return `      { "id": "cp_\${Math.random().toString(36).substr(2, 9)}", "controlPointId": "${sid}", "tracksCount": 1, "trackType": "main_loop", "pointType": "${pType}" }`;
    });
    // Wait, let's just rewrite the generation script properly!
});
