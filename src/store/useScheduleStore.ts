import { create } from 'zustand';
import { 
  VehicleBlock, 
  DriverDuty, 
  ScheduleConflict, 
  Trip, 
  HubNode,
  EmergencyDetour,
  DailyDeploymentPlan
} from '../types';
import { 
  MOCK_VEHICLE_BLOCKS, 
  MOCK_DRIVER_DUTIES, 
  MOCK_SCHEDULE_CONFLICTS,
  MOCK_EMERGENCY_DETOURS
} from '../data/mockData';
import { useControlPointStore } from './useControlPointStore';
import { GTFS_VEHICLE_BLOCKS, GTFS_DRIVER_DUTIES } from '../data/gtfsParsedData';
import { GTFS_VEHICLE_BLOCKS as REAL_GTFS_BLOCKS } from '../data/gtfsBlocksData';
import { checkNodeCapacityAndHeadway } from '../utils/scheduleEngine';

export type UserRole = 'admin' | 'dispatcher' | 'viewer';
export type ThemeMode = 'omet-clean' | 'brutalist' | 'gov-blue' | 'night-dispatch' | 'contrast-light';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  depot: string;
  badge: string;
}

interface ScheduleState {
  // Navigation & Auth & Theme
  currentPath: string;
  userRole: UserRole;
  user: UserProfile;
  theme: ThemeMode;
  setPath: (path: string) => void;
  setUserRole: (role: UserRole) => void;
  setTheme: (theme: ThemeMode) => void;

  // Schedules (Live vs Draft)
  liveBlocks: VehicleBlock[];
  draftBlocks: VehicleBlock[];
  liveDuties: DriverDuty[];
  draftDuties: DriverDuty[];
  deploymentPlans: DailyDeploymentPlan[];
  historyStack: Array<{
    blocks: VehicleBlock[];
    duties: DriverDuty[];
    label?: string;
    timestamp?: string;
  }>;
  redoStack: Array<{
    blocks: VehicleBlock[];
    duties: DriverDuty[];
    label?: string;
    timestamp?: string;
  }>;
  isDraftModified: boolean;
  isGtfsActive: boolean;

  // Conflicts & Active Emergency Detours
  conflicts: ScheduleConflict[];
  activeDetours: EmergencyDetour[];

  // Actions
  initDraft: () => void;
  loadGtfsData: () => void;
  loadDefaultMockData: () => void;
  applySlackToNode: (tripId: string, stationId: string, slackMinutes: number) => void;
  executeHotReserveSwap: (
    brokenDutyId: string,
    reserveDutyId: string,
    incidentTime: string
  ) => { success: boolean; message: string; regeneratedBooklets?: string[] };
  undoLastAction: () => void;
  redoAction: () => void;
  revertToHistoryIndex: (targetIndex: number) => void;
  commitDraft: () => void;
  discardDraft: () => void;
  updateDeploymentPlan: (plan: DailyDeploymentPlan) => void;

  // Direct editing helpers
  updateTripDeparture: (blockId: string, tripId: string, newTime: string) => void;
  assignDriverToDuty: (dutyId: string, driverName: string, driverBadge: string) => void;
  updateVehicleBlockInfo: (blockId: string, updates: Partial<VehicleBlock>) => void;
  addVehicleBlock: (newBlock: VehicleBlock) => void;
  assignDriverToBlockShift: (blockId: string, dutyId: string, driverName: string, driverBadge: string) => void;
  toggleDetour: (detourId: string) => void;
  recalculateConflicts: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr_1',
  name: 'Коваленко О.В.',
  role: 'dispatcher',
  depot: 'Депо №1 (Водопровідна)',
  badge: 'DISP-042',
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentPath: '/',
  userRole: 'dispatcher',
  user: DEFAULT_USER,
  theme: 'omet-clean',

  setPath: (path) => set({ currentPath: path }),
  setUserRole: (role) =>
    set((state) => ({
      userRole: role,
      user: { ...state.user, role },
    })),
  setTheme: (theme) => set({ theme }),

  liveBlocks: REAL_GTFS_BLOCKS.length > 0 ? REAL_GTFS_BLOCKS as VehicleBlock[] : MOCK_VEHICLE_BLOCKS,
  draftBlocks: REAL_GTFS_BLOCKS.length > 0 ? REAL_GTFS_BLOCKS as VehicleBlock[] : MOCK_VEHICLE_BLOCKS,
  liveDuties: GTFS_DRIVER_DUTIES.length > 0 ? GTFS_DRIVER_DUTIES : MOCK_DRIVER_DUTIES,
  draftDuties: GTFS_DRIVER_DUTIES.length > 0 ? GTFS_DRIVER_DUTIES : MOCK_DRIVER_DUTIES,
  deploymentPlans: [],
  historyStack: [],
  redoStack: [],
  isDraftModified: false,
  isGtfsActive: true,

  conflicts: MOCK_SCHEDULE_CONFLICTS,
  activeDetours: MOCK_EMERGENCY_DETOURS,

  initDraft: () => {
    const { liveBlocks, liveDuties } = get();
    set({
      draftBlocks: JSON.parse(JSON.stringify(liveBlocks)),
      draftDuties: JSON.parse(JSON.stringify(liveDuties)),
      historyStack: [],
      redoStack: [],
      isDraftModified: false,
    });
  },

  loadGtfsData: () => {
    set({
      liveBlocks: REAL_GTFS_BLOCKS.length > 0 ? REAL_GTFS_BLOCKS as VehicleBlock[] : MOCK_VEHICLE_BLOCKS,
      liveDuties: GTFS_DRIVER_DUTIES.length > 0 ? GTFS_DRIVER_DUTIES : MOCK_DRIVER_DUTIES,
      draftBlocks: REAL_GTFS_BLOCKS.length > 0 ? REAL_GTFS_BLOCKS as VehicleBlock[] : MOCK_VEHICLE_BLOCKS,
      draftDuties: GTFS_DRIVER_DUTIES.length > 0 ? GTFS_DRIVER_DUTIES : MOCK_DRIVER_DUTIES,
      historyStack: [],
      redoStack: [],
      isDraftModified: false,
      isGtfsActive: true,
    });
  },

  loadDefaultMockData: () => {
    set({
      liveBlocks: MOCK_VEHICLE_BLOCKS,
      draftBlocks: JSON.parse(JSON.stringify(MOCK_VEHICLE_BLOCKS)),
      liveDuties: MOCK_DRIVER_DUTIES,
      draftDuties: JSON.parse(JSON.stringify(MOCK_DRIVER_DUTIES)),
      historyStack: [],
      redoStack: [],
      isDraftModified: false,
      isGtfsActive: false,
    });
  },

  applySlackToNode: (tripId, stationId, slackMinutes) => {
    const { draftBlocks, draftDuties, historyStack } = get();

    const snapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
      label: `Відтяжка ${slackMinutes > 0 ? '+' : ''}${slackMinutes} хв (Рейс ${tripId})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const newBlocks = draftBlocks.map((block) => ({
      ...block,
      trips: block.trips.map((trip) => {
        if (trip.id === tripId) {
          const [h, m] = trip.departureTime.split(':').map(Number);
          const totalM = h * 60 + m + slackMinutes;
          const newH = Math.floor(totalM / 60) % 24;
          const newM = totalM % 60;
          const formattedDep = `${String(newH).padStart(2, '0')}:${String(
            newM
          ).padStart(2, '0')}`;

          const [arrH, arrM] = trip.arrivalTime.split(':').map(Number);
          const arrTotalM = arrH * 60 + arrM + slackMinutes;
          const formattedArr = `${String(Math.floor(arrTotalM / 60) % 24).padStart(
            2,
            '0'
          )}:${String(arrTotalM % 60).padStart(2, '0')}`;

          return {
            ...trip,
            departureTime: formattedDep,
            arrivalTime: formattedArr,
            slackMin: (trip.slackMin || 0) + slackMinutes,
            status: slackMinutes > 0 ? 'delayed' : trip.status,
          };
        }
        return trip;
      }),
    }));

    set({
      draftBlocks: newBlocks,
      historyStack: [...historyStack, snapshot],
      redoStack: [],
      isDraftModified: true,
    });

    get().recalculateConflicts();
  },

  executeHotReserveSwap: (brokenDutyId, reserveDutyId, incidentTime) => {
    const { draftDuties, draftBlocks, historyStack } = get();

    const snapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
      label: `Гарячий резерв: Заміна наряду ${brokenDutyId} на ${reserveDutyId}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const brokenDuty = draftDuties.find((d) => d.id === brokenDutyId);
    const reserveDuty = draftDuties.find((d) => d.id === reserveDutyId);

    if (!brokenDuty || !reserveDuty) {
      return {
        success: false,
        message: 'Помилка: Наряд або резервний вагон не знайдені в системі!',
      };
    }

    // Convert incidentTime "HH:mm" to minutes
    const [incH, incM] = incidentTime.split(':').map(Number);
    const incidentMinutes = incH * 60 + incM;

    // Update duties
    const updatedDuties = draftDuties.map((duty) => {
      if (duty.id === brokenDutyId) {
        return {
          ...duty,
          isViolating10hLimit: false,
          driverName: `${duty.driverName} (Аварія / Навправлено в депо)`,
        };
      }
      if (duty.id === reserveDutyId) {
        return {
          ...duty,
          assignedBlockIds: [
            ...duty.assignedBlockIds,
            ...brokenDuty.assignedBlockIds,
          ],
        };
      }
      return duty;
    });

    // Update vehicle blocks
    const updatedBlocks = draftBlocks.map((block) => {
      if (brokenDuty.assignedBlockIds.includes(block.id)) {
        const updatedTrips = block.trips.map((trip) => {
          const [depH, depM] = trip.departureTime.split(':').map(Number);
          const depMinutes = depH * 60 + depM;
          if (depMinutes >= incidentMinutes) {
            return {
              ...trip,
              blockId: reserveDuty.assignedBlockIds[0] || block.id,
              dutyId: reserveDuty.id,
              status: 'reserve' as const,
            };
          }
          return trip;
        });
        return { ...block, trips: updatedTrips };
      }
      return block;
    });

    set({
      draftDuties: updatedDuties,
      draftBlocks: updatedBlocks,
      historyStack: [...historyStack, snapshot],
      redoStack: [],
      isDraftModified: true,
    });

    return {
      success: true,
      message: `Транзакція Hot Reserve успішна: Рейси з наряду ${brokenDutyId} передано резерву ${reserveDutyId}.`,
      regeneratedBooklets: [brokenDutyId, reserveDutyId],
    };
  },

  undoLastAction: () => {
    const { historyStack, draftBlocks, draftDuties, redoStack } = get();
    if (historyStack.length === 0) return;

    const lastState = historyStack[historyStack.length - 1];
    const currentSnapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
    };

    set({
      draftBlocks: lastState.blocks,
      draftDuties: lastState.duties,
      historyStack: historyStack.slice(0, -1),
      redoStack: [...redoStack, currentSnapshot],
      isDraftModified: historyStack.length > 1,
    });

    get().recalculateConflicts();
  },

  redoAction: () => {
    const { redoStack, historyStack, draftBlocks, draftDuties } = get();
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const currentSnapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
    };

    set({
      draftBlocks: nextState.blocks,
      draftDuties: nextState.duties,
      historyStack: [...historyStack, currentSnapshot],
      redoStack: redoStack.slice(0, -1),
      isDraftModified: true,
    });

    get().recalculateConflicts();
  },

  revertToHistoryIndex: (targetIndex: number) => {
    const { historyStack, draftBlocks, draftDuties } = get();
    if (targetIndex < 0 || targetIndex >= historyStack.length) return;

    const targetSnapshot = historyStack[targetIndex];
    const newHistory = historyStack.slice(0, targetIndex);
    const futureStates = historyStack.slice(targetIndex + 1);

    const currentSnapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
      label: 'Стан перед відкатом',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      draftBlocks: targetSnapshot.blocks,
      draftDuties: targetSnapshot.duties,
      historyStack: newHistory,
      redoStack: [currentSnapshot, ...futureStates.reverse()],
      isDraftModified: newHistory.length > 0,
    });

    get().recalculateConflicts();
  },

  commitDraft: () => {
    const { draftBlocks, draftDuties } = get();
    set({
      liveBlocks: JSON.parse(JSON.stringify(draftBlocks)),
      liveDuties: JSON.parse(JSON.stringify(draftDuties)),
      historyStack: [],
      redoStack: [],
      isDraftModified: false,
    });
    get().recalculateConflicts();
  },

  discardDraft: () => {
    const { liveBlocks, liveDuties } = get();
    set({
      draftBlocks: JSON.parse(JSON.stringify(liveBlocks)),
      draftDuties: JSON.parse(JSON.stringify(liveDuties)),
      historyStack: [],
      redoStack: [],
      isDraftModified: false,
    });
    get().recalculateConflicts();
  },

  updateDeploymentPlan: (plan) => {
    const { deploymentPlans } = get();
    const existingIndex = deploymentPlans.findIndex(p => p.id === plan.id);
    if (existingIndex >= 0) {
      const newPlans = [...deploymentPlans];
      newPlans[existingIndex] = plan;
      set({ deploymentPlans: newPlans });
    } else {
      set({ deploymentPlans: [...deploymentPlans, plan] });
    }
  },

  updateTripDeparture: (blockId, tripId, newTime) => {
    const { draftBlocks, historyStack, draftDuties } = get();
    const snapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
      label: `Редагування виїзду рейсу ${tripId} → ${newTime}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const newBlocks = draftBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        trips: b.trips.map((t) => (t.id === tripId ? { ...t, departureTime: newTime } : t)),
      };
    });

    set({
      draftBlocks: newBlocks,
      historyStack: [...historyStack, snapshot],
      isDraftModified: true,
    });

    get().recalculateConflicts();
  },

  assignDriverToDuty: (dutyId, driverName, driverBadge) => {
    const { draftDuties } = get();
    set({
      draftDuties: draftDuties.map((d) =>
        d.id === dutyId ? { ...d, driverName, driverBadge } : d
      ),
      isDraftModified: true,
    });
  },

  updateVehicleBlockInfo: (blockId, updates) => {
    const { draftBlocks, draftDuties, historyStack } = get();
    const snapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
      label: `Оновлення характеристик вагона ${blockId}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      draftBlocks: draftBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
      historyStack: [...historyStack, snapshot],
      isDraftModified: true,
    });
  },

  addVehicleBlock: (newBlock) => {
    const { draftBlocks, draftDuties, historyStack } = get();
    const snapshot = {
      blocks: JSON.parse(JSON.stringify(draftBlocks)),
      duties: JSON.parse(JSON.stringify(draftDuties)),
      label: `Створення нового наряду вагона ${newBlock.id}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      draftBlocks: [...draftBlocks, newBlock],
      historyStack: [...historyStack, snapshot],
      isDraftModified: true,
    });
  },

  assignDriverToBlockShift: (blockId, dutyId, driverName, driverBadge) => {
    const { draftDuties, draftBlocks } = get();
    const existingDuty = draftDuties.find((d) => d.id === dutyId);

    if (existingDuty) {
      set({
        draftDuties: draftDuties.map((d) =>
          d.id === dutyId
            ? {
                ...d,
                driverName,
                driverBadge,
                assignedBlockIds: d.assignedBlockIds.includes(blockId)
                  ? d.assignedBlockIds
                  : [...d.assignedBlockIds, blockId],
              }
            : d
        ),
        isDraftModified: true,
      });
    } else {
      // Create new duty attached to block
      const newDuty: DriverDuty = {
        id: dutyId,
        driverName,
        driverBadge,
        shiftType: 'double',
        shiftStartTime: '05:15',
        shiftEndTime: '13:45',
        totalShiftMin: 510,
        lunchStartTime: '09:30',
        lunchDurationMin: 15,
        assignedBlockIds: [blockId],
        isViolating10hLimit: false,
        isLunchCompliant: true,
      };
      set({
        draftDuties: [...draftDuties, newDuty],
        isDraftModified: true,
      });
    }
  },

  toggleDetour: (detourId) => {
    const { activeDetours } = get();
    set({
      activeDetours: activeDetours.map((d) =>
        d.id === detourId ? { ...d, activeStatus: !d.activeStatus } : d
      ),
    });
  },

  recalculateConflicts: () => {
    const { draftBlocks } = get();
    const newConflicts: ScheduleConflict[] = [];

    const controlPoints = useControlPointStore.getState().controlPoints;

    controlPoints.forEach((hub) => {
      const arrivals = draftBlocks
        .flatMap((b) => b.trips)
        .slice(0, 6)
        .map((t, idx) => ({
          vehicleId: t.blockId,
          routeId: t.routeId,
          assignedTrack: hub.channels[idx % hub.channels.length]?.trackId || 'track_1',
          directionVector: 'North-Bound',
          arrivalTimeStr: t.departureTime,
        }));

      for (let i = 0; i < arrivals.length; i++) {
        const conflict = checkNodeCapacityAndHeadway(hub, arrivals[i], arrivals.slice(i + 1));
        if (conflict) {
          newConflicts.push({
            id: `cnf_${hub.id}_${i}`,
            nodeId: hub.id,
            nodeName: hub.name,
            trackId: arrivals[i].assignedTrack,
            vehicle1Id: arrivals[i].vehicleId,
            vehicle1Route: arrivals[i].routeId,
            vehicle2Id: arrivals[i + 1]?.vehicleId || 'BlockID-302',
            vehicle2Route: arrivals[i + 1]?.routeId || 'T3',
            arrivalTime1: arrivals[i].arrivalTimeStr,
            arrivalTime2: arrivals[i + 1]?.arrivalTimeStr || '07:18',
            actualHeadwayMin: 1.5,
            requiredHeadwayMin: hub.minHeadwayMin,
            timeGapMin: hub.minHeadwayMin - 1.5,
          });
        }
      }
    });

    set({ conflicts: newConflicts });
  },
}));
