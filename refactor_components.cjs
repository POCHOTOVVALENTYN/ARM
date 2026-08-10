const fs = require('fs');

// 1. Refactor GanttChart.tsx
let gantt = fs.readFileSync('src/components/dispatcher/GanttChart.tsx', 'utf-8');
gantt = "import { useScheduleStore } from '../../store/useScheduleStore';\n" + gantt;
gantt = gantt.replace(
  "interface GanttChartProps {\n  duties: DriverDuty[];\n}\n\nexport const GanttChart: React.FC<GanttChartProps> = ({ duties }) => {",
  "export const GanttChart: React.FC = () => {\n  const duties = useScheduleStore(state => state.draftDuties);"
);
fs.writeFileSync('src/components/dispatcher/GanttChart.tsx', gantt);

// 2. Refactor DispatcherTab.tsx (remove duties from GanttChart)
let dispTab = fs.readFileSync('src/components/tabs/DispatcherTab.tsx', 'utf-8');
dispTab = dispTab.replace("<GanttChart duties={duties} />", "<GanttChart />");
fs.writeFileSync('src/components/tabs/DispatcherTab.tsx', dispTab);

console.log("Refactored GanttChart");
