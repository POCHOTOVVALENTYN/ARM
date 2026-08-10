import fs from 'fs';
import { GTFS_ROUTES, GTFS_VEHICLE_BLOCKS, GTFS_DRIVER_DUTIES } from './src/data/gtfsParsedData';

const data = {
  routes: GTFS_ROUTES,
  vehicle_blocks: GTFS_VEHICLE_BLOCKS,
  driver_duties: GTFS_DRIVER_DUTIES
};

fs.writeFileSync('gtfs_dump.json', JSON.stringify(data, null, 2));
console.log('Dumped to gtfs_dump.json');
