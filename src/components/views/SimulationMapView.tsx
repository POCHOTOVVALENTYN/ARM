import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Sliders, 
  Layers, 
  Compass, 
  Clock, 
  Radio, 
  Maximize2, 
  Minimize2, 
  Eye, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Columns,
  Square,
  Zap,
  Info,
  MapPin,
  Activity,
  CheckCircle2,
  X,
  Plus,
  Minus,
  RefreshCw,
  Filter,
  Map as MapIcon
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
// Removed static GTFS_ROUTES, GTFS_VEHICLE_BLOCKS import
// No static GTFS_MAP imports needed

// Vehicle skin types
export type VehicleSkin = 'halo' | 'dual-tone' | 'muted' | 'balanced';

// Helper: Calculate bearing angle between two coordinates
function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Custom Leaflet Checkpoint Icon (Orange Diamond)
function createCheckpointIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-checkpoint-icon',
    html: `
      <div style="
        width: 18px; 
        height: 18px; 
        background-color: #D97706; 
        border: 2px solid #FFFFFF; 
        transform: rotate(45deg); 
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 4px; height: 4px; background: #FFFFFF; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

// Custom HTML Label Badge Icon for Odesa Administrative Districts
function createDistrictLabelIcon(name: string, description: string, color: string): L.DivIcon {
  return L.divIcon({
    className: 'district-marker-label',
    html: `
      <div style="
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(6px);
        border: 1.5px solid ${color};
        border-radius: 12px;
        padding: 4px 10px;
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        white-space: nowrap;
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.3px; color: ${color};">
          📍 ${name}
        </div>
        <div style="font-size: 9px; color: #CBD5E1; margin-top: 1px; font-weight: 500;">
          ${description}
        </div>
      </div>
    `,
    iconSize: [180, 42],
    iconAnchor: [90, 21]
  });
}

// Custom Vehicle Icon generator based on skin & rotation
function createVehicleSVGIcon(
  color: string, 
  code: string, 
  bearing: number, 
  skin: VehicleSkin,
  zoom: number,
  vehicleNumber?: string
): L.DivIcon {
  const circleSize = zoom >= 16 ? 26 : zoom >= 14 ? 22 : 19;
  const arrowSize = zoom >= 16 ? 16 : zoom >= 14 ? 14 : 12;

  let circleStyle = '';
  let arrowColor = '#4F46E5'; // Site primary blue/indigo

  if (skin === 'halo') {
    circleStyle = 'background: #FFFFFF; border: 2px solid #C7D2FE; box-shadow: 0 0 10px rgba(79, 70, 229, 0.6);';
    arrowColor = '#4F46E5';
  } else if (skin === 'dual-tone') {
    circleStyle = 'background: #EEF2FF; border: 2px solid #818CF8; box-shadow: 0 2px 6px rgba(0,0,0,0.15);';
    arrowColor = '#2563EB';
  } else if (skin === 'muted') {
    circleStyle = 'background: #1E293B; border: 1.5px solid #475569; box-shadow: 0 1px 4px rgba(0,0,0,0.2);';
    arrowColor = '#E2E8F0';
  } else {
    // Balanced default (matches uploaded image)
    circleStyle = 'background: #FFFFFF; border: 2px solid #C7D2FE; box-shadow: 0 2px 6px rgba(0,0,0,0.12);';
    arrowColor = '#4F46E5';
  }

  const numberHtml = vehicleNumber 
    ? `<div style="margin-top: 2px; padding: 1px 4px; background: rgba(15, 23, 42, 0.9); color: #FFFFFF; font-family: monospace; font-size: 8px; font-weight: 800; border-radius: 4px; border: 1px solid rgba(51, 65, 85, 0.8); line-height: 1; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
        ${vehicleNumber}
       </div>`
    : '';

  const svgContent = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      <!-- Круглий білий диск зі стрілочкою в кольорі сайту -->
      <div style="
        width: ${circleSize}px; 
        height: ${circleSize}px; 
        border-radius: 50%; 
        ${circleStyle}
        display: flex; 
        align-items: center; 
        justify-content: center; 
        transform: rotate(${Math.round(bearing)}deg);
        transition: transform 0.15s ease-out;
      ">
        <svg width="${arrowSize}" height="${arrowSize}" viewBox="0 0 24 24" fill="none" stroke="${arrowColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2.5L19.5 20.5L12 16.5L4.5 20.5L12 2.5Z"/>
        </svg>
      </div>
      <!-- Бортовий номер позаду стрілочки -->
      ${numberHtml}
    </div>
  `;

  return L.divIcon({
    className: 'vehicle-marker-icon',
    html: svgContent,
    iconSize: [circleSize + 12, circleSize + 18],
    iconAnchor: [(circleSize + 12) / 2, circleSize / 2]
  });
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  return 0;
}

function findNextStopName(lat: number, lon: number, stops: any[]): string {
  let minDistance = Infinity;
  let nearestStopName = 'ст. Старосінна';

  stops.forEach((stop) => {
    const dLat = stop.lat - lat;
    const dLon = stop.lon - lon;
    const distSq = dLat * dLat + dLon * dLon;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearestStopName = stop.name;
    }
  });

  return nearestStopName;
}

const DRIVERS_LIST = [
  'Коваленко О. В.', 'Мельник В. І.', 'Шевченко П. М.', 
  'Бойко Д. С.', 'Ткаченко А. М.', 'Ковальчук С. П.', 
  'Бондаренко Г. О.', 'Кравченко О. В.', 'Олійник І. В.'
];

export const SimulationMapView: React.FC = () => {
  const { liveBlocks, isGtfsActive, loadGtfsData, fetchInitialData, theme, routes, stops } = useScheduleStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Time simulation state (04:00:00 = 14400s)
  const [simulationTime, setSimulationTime] = useState<number>(14400); 
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [skin, setSkin] = useState<VehicleSkin>('halo');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [stepMode, setStepMode] = useState<'seconds' | 'minutes' | 'hours'>('seconds');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const selectedVehicleRef = useRef<any>(null);
  useEffect(() => {
    selectedVehicleRef.current = selectedVehicle;
  }, [selectedVehicle]);

  // Layer & Filtering Controls
  const [filterType, setFilterType] = useState<'all' | 'tram' | 'trolleybus'>('all');
  const [selectedRouteNumber, setSelectedRouteNumber] = useState<string>('all');
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showStops, setShowStops] = useState<boolean>(true);
  const [showDistricts, setShowDistricts] = useState<boolean>(true);

  // Map Feature Groups
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routesLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const stopsLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const districtsLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const selectionCircleRef = useRef<L.CircleMarker | null>(null);


  // Format seconds to HH:MM:SS
  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600) % 24;
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Step adjustment based on stepMode
  const getStepIncrement = () => {
    if (stepMode === 'minutes') return 60;
    if (stepMode === 'hours') return 3600;
    return 1;
  };

  // Jump time
  const jumpTime = (direction: 'forward' | 'backward') => {
    const inc = getStepIncrement();
    setSimulationTime((prev) => {
      let next = direction === 'forward' ? prev + inc : prev - inc;
      if (next < 0) next = 86400 + next;
      if (next >= 86400) next = next % 86400;
      return next;
    });
  };

  // Preset time jump
  const setPresetTime = (hours: number, minutes: number) => {
    setSimulationTime(hours * 3600 + minutes * 60);
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered at Odesa city center
    const map = L.map(mapContainerRef.current, {
      center: [46.468, 30.741],
      zoom: 12,
      zoomControl: false
    });

    // Add CartoDB basemap tiles according to theme
    const tileUrl = theme === 'night-dispatch'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '🇺🇦 Leaflet | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    mapRef.current = map;

    // Create Feature Groups
    routesLayerGroupRef.current = L.featureGroup().addTo(map);
    districtsLayerGroupRef.current = L.featureGroup().addTo(map);
    stopsLayerGroupRef.current = L.featureGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map tiles dynamically when theme changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileUrl = theme === 'night-dispatch'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // 2. Render Map Layers (Routes, Districts, Stops)
  useEffect(() => {
    if (!mapRef.current) return;

    const routesGroup = routesLayerGroupRef.current;
    const districtsGroup = districtsLayerGroupRef.current;
    const stopsGroup = stopsLayerGroupRef.current;

    if (!routesGroup || !districtsGroup || !stopsGroup) return;

    // A. CLEAR EXISTING LAYERS
    routesGroup.clearLayers();
    districtsGroup.clearLayers();
    stopsGroup.clearLayers();

    // B. DRAW GTFS ROUTES
    if (showRoutes) {
      routes.forEach((route) => {
        // Filter by transport type
        if (filterType !== 'all' && route.type !== filterType) return;
        // Filter by selected route number
        if (selectedRouteNumber !== 'all' && route.number !== selectedRouteNumber) return;

        const isHighlighted = selectedRouteNumber === route.number;
        const polylineWeight = isHighlighted ? 6 : 3.5;
        const opacity = isHighlighted ? 1.0 : selectedRouteNumber !== 'all' ? 0.3 : 0.85;

        // Draw Direction 1 Shape
        if (route.shape && route.shape.length > 0) {
          const line1 = L.polyline(route.shape, {
            color: route.color,
            weight: polylineWeight,
            opacity,
            smoothFactor: 1
          });
          line1.bindTooltip(`<b>${route.code}</b><br/>${route.name}`, { sticky: true });
          routesGroup.addLayer(line1);
        }

        // Draw Direction 2 Shape
        if (route.shapeReverse && route.shapeReverse.length > 0 && route.shapeReverse !== route.shape) {
          const line2 = L.polyline(route.shapeReverse, {
            color: route.color,
            weight: polylineWeight * 0.8,
            opacity: opacity * 0.8,
            dashArray: '6, 4',
            smoothFactor: 1
          });
          line2.bindTooltip(`<b>${route.code} (Зворотний напрямок)</b><br/>${route.name}`, { sticky: true });
          routesGroup.addLayer(line2);
        }
      });
    }

    // D. DRAW GTFS STOPS & CHECKPOINTS
    if (showStops) {
      stops.forEach((stop) => {
        if (stop.isCheckpoint) {
          const checkpointMarker = L.marker([stop.lat, stop.lon], {
            icon: createCheckpointIcon()
          });
          checkpointMarker.bindTooltip(`<b>КП: ${stop.name}</b>`, { direction: 'top', offset: [0, -10] });
          stopsGroup.addLayer(checkpointMarker);
        } else {
          const circleMarker = L.circleMarker([stop.lat, stop.lon], {
            radius: 3.5,
            fillColor: '#1E293B',
            color: '#FFFFFF',
            weight: 1.5,
            fillOpacity: 0.9
          });
          circleMarker.bindTooltip(`<b>${stop.name}</b>`, { direction: 'top' });
          stopsGroup.addLayer(circleMarker);
        }
      });
    }

    // Update stop visibility based on zoom
    const updateStopVisibility = () => {
      if (!mapRef.current) return;
      const zoom = mapRef.current.getZoom();
      stopsGroup.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) {
          if (zoom < 13) {
            mapRef.current?.removeLayer(layer);
          } else if (mapRef.current && !mapRef.current.hasLayer(layer)) {
            mapRef.current.addLayer(layer);
          }
        }
      });
    };

    mapRef.current.on('zoomend', updateStopVisibility);
    updateStopVisibility();

    return () => {
      mapRef.current?.off('zoomend', updateStopVisibility);
    };
  }, [showRoutes, showStops, showDistricts, filterType, selectedRouteNumber]);

  // 3. Simulation Clock Interval
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSimulationTime((prev) => {
          const next = prev + 1 * simulationSpeed;
          return next >= 86400 ? 0 : next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationSpeed]);

  // 4. Vehicle Interpolation & Marker Updates
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const zoom = map.getZoom();

    const activeBlocks = liveBlocks;

    // Filter by transport type & route
    const filteredBlocks = activeBlocks.filter((b) => {
      if (filterType !== 'all' && b.type !== filterType) return false;
      if (selectedRouteNumber !== 'all' && !b.routeId.includes(selectedRouteNumber) && b.routeId !== selectedRouteNumber) return false;
      return true;
    });

    const currentVehicleIds = new Set<string>();

    filteredBlocks.forEach((block, index) => {
      const vehicleId = block.id;
      currentVehicleIds.add(vehicleId);

      let lat = 46.468;
      let lon = 30.741;
      let bearing = 0;
      let currentSpeed = 22;
      let activeTripInfo: any = null;
      let progressPct = 0;

      // Find GTFS Map Route matching block
      const matchedRoute = routes.find((r) => 
        r.id === block.routeId || 
        r.number === block.routeId || 
        r.gtfsRouteIds?.includes(block.routeId)
      ) || routes[index % routes.length];

      // Check if block has active GTFS trips for current simulation time
      const trips = block.trips || [];
      const currentTrip = trips.find((t: any) => {
        const depSec = parseTimeToSeconds(t.departureTime);
        const arrSec = parseTimeToSeconds(t.arrivalTime);
        return simulationTime >= depSec && simulationTime <= arrSec;
      });

      const isReverse = Boolean(currentTrip && currentTrip.direction === 1);
      const shape = isReverse ? matchedRoute.shapeReverse : matchedRoute.shape;

      if (currentTrip && shape && shape.length > 1) {
        const depSec = parseTimeToSeconds(currentTrip.departureTime);
        const arrSec = parseTimeToSeconds(currentTrip.arrivalTime);
        const duration = Math.max(1, arrSec - depSec);
        const elapsed = simulationTime - depSec;
        const progress = Math.min(1, Math.max(0, elapsed / duration));
        progressPct = Math.round(progress * 100);

        const pointCount = shape.length - 1;
        const scaledProgress = progress * pointCount;
        const segmentIndex = Math.min(Math.floor(scaledProgress), pointCount - 1);
        const segmentProgress = scaledProgress - segmentIndex;

        const p1 = shape[segmentIndex];
        const p2 = shape[segmentIndex + 1] || p1;

        lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
        lon = p1[1] + (p2[1] - p1[1]) * segmentProgress;
        bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
        currentSpeed = Math.round(20 + Math.sin(simulationTime / 30) * 6);
        activeTripInfo = currentTrip;
      } else if (shape && shape.length > 1) {
        // Continuous loop interpolation
        const loopDuration = 2700;
        const vehicleOffset = index * 540;
        const localTime = (simulationTime + vehicleOffset) % loopDuration;
        const progress = localTime / loopDuration;
        progressPct = Math.round(progress * 100);

        const pointCount = shape.length - 1;
        const scaledProgress = progress * pointCount;
        const segmentIndex = Math.min(Math.floor(scaledProgress), pointCount - 1);
        const segmentProgress = scaledProgress - segmentIndex;

        const p1 = shape[segmentIndex];
        const p2 = shape[segmentIndex + 1] || p1;

        lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
        lon = p1[1] + (p2[1] - p1[1]) * segmentProgress;
        bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
        currentSpeed = Math.round(18 + Math.sin(localTime) * 8);
      }

      const vehicleNumber = block.vehicleNumber || block.id.replace(/[^0-9]/g, '') || `${1000 + index}`;
      const driverName = `${DRIVERS_LIST[index % DRIVERS_LIST.length]} (КП ОМЕТ)`;
      const nextStopName = findNextStopName(lat, lon, stops);
      const delayVal = (index % 3 === 0 ? 0.7 : index % 2 === 0 ? -0.3 : 0.0) + Math.sin((simulationTime + index * 100) / 200) * 0.3;
      const delayMin = delayVal.toFixed(1);
      const passengers = Math.max(8, Math.min(96, Math.round(34 + Math.cos(simulationTime / 80 + index) * 20)));

      const liveVehicleData = {
        id: vehicleId,
        vehicleNumber,
        driver: driverName,
        routeCode: matchedRoute.code,
        routeName: matchedRoute.name,
        routeNumber: matchedRoute.number,
        color: matchedRoute.color,
        speed: currentSpeed,
        nextStop: nextStopName,
        delayMin,
        passengers,
        activeTrip: activeTripInfo,
        progressPct,
        type: block.type,
        depotExitTime: block.depotExitTime || '05:30',
        depotReturnTime: block.depotReturnTime || '22:45',
        directionName: isReverse ? 'Зворотний напрямок' : 'Прямий напрямок',
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5))
      };

      let marker = vehicleMarkersRef.current.get(vehicleId);

      // Custom formatted Leaflet popup HTML
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 210px; color: #0F172A;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="background-color: ${matchedRoute.color}; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 6px;">
              ${matchedRoute.code}
            </span>
            <span style="font-family: monospace; font-weight: 800; font-size: 11px; background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; border: 1px solid #CBD5E1;">
              #${vehicleNumber}
            </span>
          </div>
          <div style="font-weight: 700; font-size: 11px; color: #1E293B; margin-bottom: 6px; line-height: 1.3;">
            ${matchedRoute.name}
          </div>
          <div style="font-size: 11px; color: #475569; display: grid; gap: 4px; background: #F8FAFC; padding: 6px; border-radius: 8px; border: 1px solid #E2E8F0;">
            <div>⚡ Швидкість: <b style="color: #4F46E5;">${currentSpeed} км/год</b></div>
            <div>📍 Зупинка: <b style="color: #0F172A;">${nextStopName}</b></div>
            <div>👨‍✈️ Водій: <b>${driverName.split(' ')[0]} ${driverName.split(' ')[1]}</b></div>
            <div>👥 Пасажирів: <b style="color: #059669;">${passengers} осіб</b></div>
            <div>⏱ Графік: <b style="color: ${Number(delayMin) > 0 ? '#DC2626' : '#059669'};">${Number(delayMin) > 0 ? `+${delayMin} хв` : `${delayMin} хв`}</b></div>
          </div>
        </div>
      `;

      if (!marker) {
        const icon = createVehicleSVGIcon(matchedRoute.color, matchedRoute.code, bearing, skin, zoom, vehicleNumber);
        marker = L.marker([lat, lon], { icon, zIndexOffset: 1000, interactive: true }).addTo(map);

        (marker as any).vehicleData = liveVehicleData;

        marker.bindPopup(popupHtml, { offset: [0, -10], closeButton: true });

        const handleMarkerSelect = (e: any) => {
          L.DomEvent.stopPropagation(e);
          const latestData = (marker as any).vehicleData || liveVehicleData;
          setSelectedVehicle(latestData);
          map.panTo([latestData.lat, latestData.lon], { animate: true });
        };

        marker.on('click', handleMarkerSelect);
        marker.on('touchstart', handleMarkerSelect);

        vehicleMarkersRef.current.set(vehicleId, marker);
      } else {
        (marker as any).vehicleData = liveVehicleData;
        marker.setLatLng([lat, lon]);
        marker.setIcon(createVehicleSVGIcon(matchedRoute.color, matchedRoute.code, bearing, skin, zoom, vehicleNumber));
        marker.setPopupContent(popupHtml);
      }

      // Sync active selectedVehicle state if currently open
      if (selectedVehicleRef.current && selectedVehicleRef.current.id === vehicleId) {
        setSelectedVehicle(liveVehicleData);
      }
    });

    // Remove inactive markers
    vehicleMarkersRef.current.forEach((marker, vId) => {
      if (!currentVehicleIds.has(vId)) {
        map.removeLayer(marker);
        vehicleMarkersRef.current.delete(vId);
      }
    });
  }, [simulationTime, liveBlocks, skin, filterType, selectedRouteNumber]);

  // Highlight selection ring on map for selected vehicle
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedVehicle) {
      if (!selectionCircleRef.current) {
        selectionCircleRef.current = L.circleMarker([selectedVehicle.lat, selectedVehicle.lon], {
          radius: 18,
          color: '#4F46E5',
          fillColor: '#818CF8',
          fillOpacity: 0.25,
          weight: 3.5,
          dashArray: '4, 4'
        }).addTo(mapRef.current);
      } else {
        selectionCircleRef.current.setLatLng([selectedVehicle.lat, selectedVehicle.lon]);
      }
    } else if (selectionCircleRef.current) {
      mapRef.current.removeLayer(selectionCircleRef.current);
      selectionCircleRef.current = null;
    }
  }, [selectedVehicle]);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] min-h-[640px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col">
      {/* MAP CANVAS CONTAINER */}
      <div className="relative flex-grow h-full w-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* LEFT FLOATING CONTROL PANEL ("СИМУЛЯТОР") */}
        <div className={`absolute top-5 left-5 z-20 transition-all duration-300 ${
          isPanelCollapsed ? 'w-14' : 'w-80 md:w-84'
        }`}>
          {isPanelCollapsed ? (
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-3.5 rounded-2xl shadow-xl text-slate-800 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center"
              title="Розгорнути СИМУЛЯТОР"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse absolute -top-1 -right-1" />
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-900 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase">
                    СИМУЛЯТОР GTFS
                  </h2>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsPanelCollapsed(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
                    title="Згорнути"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD 0: GTFS SYNCHRONIZATION STATUS */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className={`w-4 h-4 ${isGtfsActive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className="text-xs font-black tracking-wide">
                      {isGtfsActive ? 'GTFS ОДЕСА АКТИВНИЙ' : 'ДЕМО-РЕЖИМ'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    isGtfsActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {isGtfsActive ? '48 Маршрутів' : 'Тестовий'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-tight">
                  {isGtfsActive 
                    ? 'Синхронізовано з 3,489 реальними рейсами та 638 зупинками КП «Одесміськелектротранс».' 
                    : 'Використовуються базові інтерполяційні такт-схеми.'}
                </p>

                <div className="pt-1">
                  {isGtfsActive ? (
                    <button
                      onClick={fetchInitialData}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Перейти в Демо-режим</span>
                    </button>
                  ) : (
                    <button
                      onClick={loadGtfsData}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2 px-3 rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Синхронізувати з GTFS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 1: ШАРИ КАРТИТА РАЙОНИ */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>ШАРИ КАРТИ СИМУЛЯЦІЇ</span>
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-2.5 space-y-1.5 text-xs font-bold">
                  <label className="flex items-center justify-between p-1.5 hover:bg-white rounded-xl transition-all cursor-pointer">
                    <span className="flex items-center space-x-2 text-slate-700">
                      <MapIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Райони Одеси</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showDistricts}
                      onChange={(e) => setShowDistricts(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 hover:bg-white rounded-xl transition-all cursor-pointer">
                    <span className="flex items-center space-x-2 text-slate-700">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Треки Маршрутів (GTFS)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoutes}
                      onChange={(e) => setShowRoutes(e.target.checked)}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 hover:bg-white rounded-xl transition-all cursor-pointer">
                    <span className="flex items-center space-x-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Зупинки та КП (638)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showStops}
                      onChange={(e) => setShowStops(e.target.checked)}
                      className="accent-amber-600 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* CARD 2: ФІЛЬТР ТРАНСПОРТУ ТА МАРШРУТУ */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>ФІЛЬТР ТРАНСПОРТУ</span>
                  <Filter className="w-3 h-3 text-slate-400" />
                </div>

                <div className="bg-[#F1F5F9] border border-slate-200/80 rounded-2xl p-1 grid grid-cols-3 gap-1 text-xs font-bold">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`py-1.5 rounded-xl cursor-pointer transition-all ${
                      filterType === 'all' ? 'bg-[#1E3A8A] text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Всі
                  </button>
                  <button
                    onClick={() => setFilterType('tram')}
                    className={`py-1.5 rounded-xl cursor-pointer transition-all ${
                      filterType === 'tram' ? 'bg-[#1E3A8A] text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Трамваї
                  </button>
                  <button
                    onClick={() => setFilterType('trolleybus')}
                    className={`py-1.5 rounded-xl cursor-pointer transition-all ${
                      filterType === 'trolleybus' ? 'bg-[#1E3A8A] text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Тролейбуси
                  </button>
                </div>

                {/* Route Selector Dropdown */}
                <div className="pt-1">
                  <select
                    value={selectedRouteNumber}
                    onChange={(e) => setSelectedRouteNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">Всі 20 Маршрутів Одеси</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.number}>
                        {r.code}: {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CARD 3: ЧАС СИМУЛЯЦІЇ */}
              <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ЧАС СИМУЛЯЦІЇ
                </div>
                <div className="text-3xl font-black font-mono tracking-wider text-[#1E3A8A] drop-shadow-xs">
                  {formatSeconds(simulationTime)}
                </div>
              </div>

              {/* CARD 4: PLAYBACK CONTROLS */}
              <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-2 flex items-center justify-between gap-1">
                <button
                  onClick={() => jumpTime('backward')}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                  title="Швидко назад"
                >
                  <Rewind className="w-4 h-4" />
                </button>
                <button
                  onClick={() => jumpTime('backward')}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                  title="Крок назад"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-[#10B981] hover:bg-emerald-600 text-white shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => jumpTime('forward')}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                  title="Крок вперед"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setSimulationTime(14400); // Reset 04:00:00
                  }}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                  title="Стоп / Скинути"
                >
                  <Square className="w-3.5 h-3.5 fill-slate-600" />
                </button>
              </div>

              {/* CARD 5: ШВИДКІСТЬ ВІДТВОРЕННЯ */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ШВИДКІСТЬ ВІДТВОРЕННЯ
                </div>
                <div className="bg-[#F1F5F9] border border-slate-200/80 rounded-2xl p-1 grid grid-cols-5 gap-1">
                  {[1, 2, 5, 10, 30].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSimulationSpeed(s)}
                      className={`py-1.5 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                        simulationSpeed === s
                          ? 'bg-[#1E3A8A] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 font-bold'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD 6: ШВИДКИЙ ПЕРЕХІД */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ШВИДКИЙ ПЕРЕХІД
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    onClick={() => setPresetTime(7, 30)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 text-slate-800 shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>🌄</span>
                    <span>Ранок (07:30)</span>
                  </button>
                  <button
                    onClick={() => setPresetTime(13, 0)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 text-slate-800 shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>☀️</span>
                    <span>Обід (13:00)</span>
                  </button>
                  <button
                    onClick={() => setPresetTime(17, 30)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 text-slate-800 shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>🌆</span>
                    <span>Вечір (17:30)</span>
                  </button>
                  <button
                    onClick={() => setPresetTime(22, 0)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 text-slate-800 shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>🌙</span>
                    <span>Ніч (22:00)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT LEGEND BOX ("УМОВНІ ПОЗНАЧЕННЯ:") */}
        <div className="absolute top-5 right-5 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-xl space-y-3 max-w-xs text-xs text-slate-800">
          <div className="font-extrabold uppercase text-[11px] text-slate-700 tracking-wider">
            УМОВНІ ПОЗНАЧЕННЯ:
          </div>

          <div className="space-y-2.5 font-bold">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-indigo-600 shadow-xs">
                <NavigationIcon className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-slate-900 font-bold">Рухомий вагон GTFS</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-amber-600 border border-white transform rotate-45 shadow-xs ml-1 mr-1" />
              <span className="text-slate-900 font-bold">Кінцева станція / КП</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white shadow-xs ml-1 mr-1" />
              <span className="text-slate-900 font-bold">Зупинка GTFS (638)</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-2.5 border-b-2 border-indigo-600 border-dashed ml-0.5 mr-1" />
              <span className="text-slate-900 font-bold">Межа району Одеси</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
            * Звичайні зупинки відображаються при наближенні (zoom ≥13)
          </p>
        </div>

        {/* BOTTOM RIGHT ZOOM CONTROLS */}
        <div className="absolute bottom-20 right-5 z-20 flex flex-col bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-3 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100"
            title="Наблизити"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Віддалити"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTED VEHICLE INSPECTOR PANEL */}
        {selectedVehicle && (
          <div className="absolute bottom-24 right-5 sm:right-16 z-40 w-84 sm:w-96 max-h-[75vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-2xl animate-fade-in text-slate-900 space-y-4 border-l-4" style={{ borderLeftColor: selectedVehicle.color }}>
            {/* Header with Badges */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span
                  className="px-2.5 py-1 rounded-lg text-white font-extrabold text-xs shadow-xs"
                  style={{ backgroundColor: selectedVehicle.color }}
                >
                  {selectedVehicle.routeCode}
                </span>
                <span className="font-mono bg-slate-100 text-slate-700 font-extrabold text-xs px-2 py-0.5 rounded-md border border-slate-200">
                  #{selectedVehicle.vehicleNumber}
                </span>
                <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                  <span>В РУСІ</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Закрити панель"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Route Name & Direction */}
            <div>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                {selectedVehicle.routeName}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center space-x-1">
                <Compass className="w-3 h-3 text-slate-400" />
                <span>{selectedVehicle.directionName}</span>
              </div>
            </div>

            {/* Trip Progress Bar */}
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500">Прогрес рейсу:</span>
                <span className="text-indigo-600 font-mono">{selectedVehicle.progressPct}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${selectedVehicle.progressPct}%`, backgroundColor: selectedVehicle.color }}
                />
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Швидкість</div>
                <div className="text-sm font-extrabold text-indigo-600 font-mono mt-0.5">
                  ⚡ {selectedVehicle.speed} <span className="text-xs text-slate-500 font-normal">км/год</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Відхилення</div>
                <div className={`text-sm font-extrabold font-mono mt-0.5 ${Number(selectedVehicle.delayMin) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ⏱ {Number(selectedVehicle.delayMin) > 0 ? `+${selectedVehicle.delayMin} хв` : `${selectedVehicle.delayMin} хв`}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Наступна зупинка GTFS</div>
                <div className="text-xs font-extrabold text-slate-900 mt-0.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{selectedVehicle.nextStop}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Пасажирів</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  👥 {selectedVehicle.passengers} осіб
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Водій ТЗ</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  👨‍✈️ {selectedVehicle.driver.split(' ')[0]} {selectedVehicle.driver.split(' ')[1]}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Депо (виїзд / заїзд):</span>
                <span className="font-mono text-slate-900 font-bold">{selectedVehicle.depotExitTime} / {selectedVehicle.depotReturnTime}</span>
              </div>
            </div>

            {/* GPS Coordinates */}
            <div className="text-[10px] text-slate-400 font-mono text-right">
              GPS: {selectedVehicle.lat}, {selectedVehicle.lon}
            </div>

            {/* Action Buttons */}
            <div className="pt-1">
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.panTo([selectedVehicle.lat, selectedVehicle.lon], { animate: true });
                    mapRef.current.setZoom(15);
                  }
                }}
                className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Центрувати карту на вагоні</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM FLOATING TIME PROGRESS BAR */}
      <div className="absolute bottom-5 left-5 right-20 z-20 bg-slate-50/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-4">
        {/* Start Badge */}
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-mono font-extrabold text-xs shadow-2xs shrink-0">
          {formatSeconds(simulationTime)}
        </div>

        {/* Range slider */}
        <div className="flex-grow flex items-center px-2">
          <input
            type="range"
            min={0}
            max={86400}
            step={getStepIncrement()}
            value={simulationTime}
            onChange={(e) => setSimulationTime(Number(e.target.value))}
            className="w-full accent-[#1E3A8A] cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>

        {/* End Badge */}
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900 font-mono font-extrabold text-xs shadow-2xs shrink-0">
          24:00:00
        </div>

        {/* Step controls */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200/80 shrink-0">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            КРОК:
          </span>
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStepMode('seconds')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                stepMode === 'seconds' ? 'bg-[#1E3A8A] text-white font-extrabold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Секунди
            </button>
            <button
              onClick={() => setStepMode('minutes')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                stepMode === 'minutes' ? 'bg-[#1E3A8A] text-white font-extrabold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Хвилини
            </button>
            <button
              onClick={() => setStepMode('hours')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                stepMode === 'hours' ? 'bg-[#1E3A8A] text-white font-extrabold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Години
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple compass/navigation SVG helper for legend
function NavigationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 19 21 12 17 5 21 12 2" />
    </svg>
  );
}
