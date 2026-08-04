import { Route, VehicleBlock } from '../types';

export function generateGtfsStaticFiles(routes: Route[], blocks: VehicleBlock[]) {
  // 1. routes.txt
  let routesTxt = 'route_id,agency_id,route_short_name,route_long_name,route_type,route_color,route_text_color\n';
  routes.forEach((r) => {
    const routeType = r.type === 'tram' ? '0' : '3'; // GTFS route_type: 0=Tram, 3=Bus/Trolleybus
    const color = r.type === 'tram' ? 'DC2626' : '0284C7';
    routesTxt += `${r.id},OMET,${r.number},"${r.name}",${routeType},${color},FFFFFF\n`;
  });

  // 2. trips.txt
  let tripsTxt = 'route_id,service_id,trip_id,trip_headsign,direction_id,block_id\n';
  blocks.forEach((b) => {
    b.trips.forEach((t) => {
      tripsTxt += `${t.routeId},WORKDAY,${t.id},"${t.endStationId}",${t.direction - 1},${b.id}\n`;
    });
  });

  // 3. stop_times.txt
  let stopTimesTxt = 'trip_id,arrival_time,departure_time,stop_id,stop_sequence\n';
  blocks.forEach((b) => {
    b.trips.forEach((t) => {
      stopTimesTxt += `${t.id},${t.departureTime}:00,${t.departureTime}:00,${t.startStationId},1\n`;
      stopTimesTxt += `${t.id},${t.arrivalTime}:00,${t.arrivalTime}:00,${t.endStationId},2\n`;
    });
  });

  return {
    'routes.txt': routesTxt,
    'trips.txt': tripsTxt,
    'stop_times.txt': stopTimesTxt,
  };
}

export function generateGtfsRealtimeJson(blocks: VehicleBlock[]) {
  const entities = blocks.flatMap((b) =>
    b.trips.map((t) => ({
      id: `entity_${t.id}`,
      vehicle: {
        trip: {
          tripId: t.id,
          routeId: t.routeId,
          startTime: t.departureTime,
        },
        position: {
          latitude: 46.4678,
          longitude: 30.7311,
          bearing: 180,
          speed: 22.5, // km/h
        },
        currentStatus: t.status === 'delayed' ? 'IN_TRANSIT_DELAYED' : 'IN_SCHEDULE',
        congestionLevel: t.slackMin && t.slackMin > 3 ? 'RUNNING_SLOW' : 'RUNNING_SMOOTH',
        stopId: t.startStationId,
        vehicle: {
          id: b.vehicleNumber,
          label: b.vehicleNumber,
        },
        timestamp: Math.floor(Date.now() / 1000),
      },
    }))
  );

  return {
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 'FULL_DATASET',
      timestamp: Math.floor(Date.now() / 1000),
      agency: 'КП Одесміськелектротранс',
    },
    entity: entities,
  };
}
