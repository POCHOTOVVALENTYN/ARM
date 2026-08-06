with open("src/components/tabs/NetworkSettingsTab.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    # 1. Add import for useScheduleStore
    if "import { useStationStore } from '../../store/useStationStore';" in line:
        new_lines.append("import { useScheduleStore } from '../../store/useScheduleStore';\n")
        new_lines.append(line)
        continue
    
    # 2. Replace activeSubTab state with useScheduleStore
    if "const [activeSubTab, setActiveSubTab] = useState<'routes' | 'hubs' | 'depots' | 'breaks'>('routes');" in line:
        new_lines.append("  const { currentPath } = useScheduleStore();\n")
        new_lines.append("  let activeSubTab = 'routes';\n")
        new_lines.append("  if (currentPath.includes('/intersections')) activeSubTab = 'hubs';\n")
        new_lines.append("  else if (currentPath.includes('/depots')) activeSubTab = 'depots';\n")
        new_lines.append("  else if (currentPath.includes('/breaks')) activeSubTab = 'breaks';\n")
        continue
    
    # 3. Remove the entire panel block
    if "{/* Modern Executive Header & Sub-tab Navigation */}" in line:
        skip = True
        continue
    
    if skip and "</div>" in line:
        # We need to skip exactly the outer div of the header. The header ends at line 229, which is just before {/* 1. Route Management (Route Master) Sub-tab */}
        pass
    
    if skip and "{/* 1. Route Management (Route Master) Sub-tab */}" in line:
        skip = False
        new_lines.append(line)
        continue
        
    if not skip:
        new_lines.append(line)

with open("src/components/tabs/NetworkSettingsTab.tsx", "w") as f:
    f.writelines(new_lines)

