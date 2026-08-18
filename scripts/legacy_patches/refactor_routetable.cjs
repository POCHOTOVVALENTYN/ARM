const fs = require('fs');

let rt = fs.readFileSync('src/components/routes/RouteTable.tsx', 'utf-8');
rt = rt.replace(
  "import { Route, RouteStatus, TransportType } from '../../types';",
  "import { Route, RouteStatus, TransportType } from '../../types';\nimport { useScheduleStore } from '../../store/useScheduleStore';"
);
rt = rt.replace(
  "  routes: Route[];\n",
  ""
);
rt = rt.replace(
  "export const RouteTable: React.FC<RouteTableProps> = ({\n  routes,\n",
  "export const RouteTable: React.FC<RouteTableProps> = ({\n"
);
rt = rt.replace(
  "  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);",
  "  const routes = useScheduleStore(state => state.routes);\n  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);"
);
fs.writeFileSync('src/components/routes/RouteTable.tsx', rt);

let nst = fs.readFileSync('src/components/tabs/NetworkSettingsTab.tsx', 'utf-8');
nst = nst.replace(
  "              routes={filteredRoutes}\n              selectedRouteId={selectedRouteId}",
  "              selectedRouteId={selectedRouteId}"
);
fs.writeFileSync('src/components/tabs/NetworkSettingsTab.tsx', nst);

console.log("Refactored RouteTable");
