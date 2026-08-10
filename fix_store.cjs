const fs = require('fs');

const path = 'src/store/useScheduleStore.ts';
let content = fs.readFileSync(path, 'utf8');

// Add DriverDuty import
if (!content.includes('DriverDuty')) {
  content = content.replace(
    /import \{ VehicleBlock, TransportType \} from '\.\.\/types';/,
    "import { VehicleBlock, TransportType, DriverDuty } from '../types';"
  );
}

// Remove mock properties
const propsToRemove = [
  'liveBlocks\\?\\: any;',
  'commitDraft\\?\\: any;',
  'liveDuties\\?\\: any;',
  'isDraftModified\\?\\: any;',
  'draftDuties\\?\\: any;'
];

propsToRemove.forEach(p => {
  content = content.replace(new RegExp(`\\s+${p}`, 'g'), '');
});

// Add strictly typed properties
const typedProps = `
  liveBlocks: VehicleBlock[];
  liveDuties: DriverDuty[];
  draftDuties: DriverDuty[];
  isDraftModified: boolean;
  commitDraft: () => void;
`;

content = content.replace(
  /selectedDate: string;/,
  `${typedProps.trim()}\n  selectedDate: string;`
);

// Implement commitDraft in the create function
const commitImpl = `
  commitDraft: () => set((state) => ({
    liveBlocks: [...state.draftBlocks],
    liveDuties: [...state.draftDuties],
    isDraftModified: false,
    historyStack: [...state.historyStack, { timestamp: Date.now(), label: 'Затвердження нарядів' }]
  })),
`;

content = content.replace(
  /draftDuties: \[\],/,
  `draftDuties: [],\n${commitImpl.trim()}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Store fixed');
