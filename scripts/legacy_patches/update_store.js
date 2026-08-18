const fs = require('fs');

const path = 'src/store/useScheduleStore.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for VehicleBlock and TransportType at the top (after UserRole)
if (!content.includes('VehicleBlock')) {
  content = content.replace(
    /export enum UserRole .*?\n/,
    "export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }\nimport { VehicleBlock, TransportType } from '../types';\n"
  );
}

// 2. Replace interface fields (remove the any fields and add typed ones)
const fieldsToRemove = [
  'generateMultipleBlocks\\?\\: any;',
  'clearVehicleBlocks\\?\\: any;',
  'discardDraft\\?\\: any;',
  'deleteVehicleBlock\\?\\: any;',
  'updateVehicleBlockInfo\\?\\: any;',
  'reorderVehicleBlocks\\?\\: any;',
  'selectedDate\\?\\: any;',
  'setSelectedDate\\?\\: any;',
  'draftBlocks\\?\\: any;'
];

fieldsToRemove.forEach(f => {
  const regex = new RegExp(`\\s+${f}`, 'g');
  content = content.replace(regex, '');
});

// Add typed fields to the interface
const newFields = `
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  draftBlocks: VehicleBlock[];
  generateMultipleBlocks: (routeId: string, transportType: TransportType, count: number, date?: string) => void;
  updateVehicleBlockInfo: (blockId: string, info: Partial<VehicleBlock>) => void;
  deleteVehicleBlock: (blockId: string) => void;
  clearVehicleBlocks: () => void;
  reorderVehicleBlocks: (oldIndex: number, newIndex: number) => void;
  discardDraft: () => void;
`;

content = content.replace(
  /\/\/ Action Handlers/,
  newFields.trim() + '\n\n  // Action Handlers'
);

// 3. Add implementations in create
const newImpl = `
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date: string) => set({ selectedDate: date }),
  generateMultipleBlocks: (routeId, transportType, count, date) => {
    set((state) => {
      const newBlocks = Array.from({ length: count }).map((_, i) => ({
        id: \`B_\${routeId}_\${Date.now()}_\${i}\`,
        vehicleNumber: '',
        type: transportType,
        depotId: 'depot_1',
        routeId,
        date: date || state.selectedDate,
        depotExitTime: '05:00',
        depotReturnTime: '23:00',
        trips: []
      }));
      return {
        draftBlocks: [...state.draftBlocks, ...newBlocks],
        isDraftModified: true
      };
    });
  },
  updateVehicleBlockInfo: (blockId, info) => set((state) => ({
    draftBlocks: state.draftBlocks.map((b: VehicleBlock) => b.id === blockId ? { ...b, ...info } : b),
    isDraftModified: true
  })),
  deleteVehicleBlock: (blockId) => set((state) => ({
    draftBlocks: state.draftBlocks.filter((b: VehicleBlock) => b.id !== blockId),
    isDraftModified: true
  })),
  clearVehicleBlocks: () => set({ draftBlocks: [], isDraftModified: true }),
  reorderVehicleBlocks: (oldIndex, newIndex) => set((state) => {
    const newBlocks = [...state.draftBlocks];
    const [moved] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, moved);
    return { draftBlocks: newBlocks, isDraftModified: true };
  }),
  discardDraft: () => set({ draftBlocks: [], draftDuties: [], isDraftModified: false }),
`;

content = content.replace(
  /draftBlocks: \[\],/,
  newImpl.trim()
);

fs.writeFileSync(path, content, 'utf8');
console.log('Store updated');
