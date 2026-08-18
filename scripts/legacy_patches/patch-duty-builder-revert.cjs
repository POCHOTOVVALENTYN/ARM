const fs = require('fs');
const file = 'src/components/views/DutyBuilderView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Grid columns: 3 to 4
content = content.replace('className="grid grid-cols-1 lg:grid-cols-3 gap-6"', 'className="grid grid-cols-1 lg:grid-cols-4 gap-6"');

// 2. Right panel: col-span-2 to col-span-3
content = content.replace('lg:col-span-2"', 'lg:col-span-3"');

// 3. Add routeFilter to states
const stateHooksTarget = `  // Accordion state for routes
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);`;

const stateHooksReplacement = `  const [routeFilter, setRouteFilter] = useState<string>('all');`;

content = content.replace(stateHooksTarget, stateHooksReplacement);

// 4. Update filteredBlocks logic
const filteredBlocksTarget = `  const filteredBlocks = blocksForDate.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  // Group by route
  const routesGroups = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.routeId]) acc[block.routeId] = [];
    acc[block.routeId].push(block);
    return acc;
  }, {} as Record<string, typeof draftBlocks>);
  
  const toggleRoute = (routeId: string) => {
    setExpandedRoutes(prev => prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]);
  };`;

const filteredBlocksReplacement = `  const filteredBlocks = blocksForDate.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === 'all' || block.routeId === routeFilter;
    return matchesSearch && matchesRoute;
  });`;

content = content.replace(filteredBlocksTarget, filteredBlocksReplacement);

// 5. Replace Left Panel structure
// We have the accordion starting at `{/* Wagon Block Cards List (Accordion grouped by route) */}`
// and ending before `{/* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping */}`
const leftPanelTargetRegex = /\{\/\* Wagon Block Cards List \(Accordion grouped by route\) \*\/\}[\s\S]*?(?=\{\/\* Right Main Panel)/;

const leftPanelReplacement = `{/* Route Filter Dropdown */}
          <div className="pt-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all appearance-none"
              >
                <option value="all">Всі маршрути</option>
                {routes.map(r => {
                  const blockCount = draftBlocks.filter(b => b.routeId === r.id && (b.date === selectedDate || (!b.date && selectedDate === today))).length;
                  return (
                    <option key={r.id} value={r.id}>
                      Маршрут {r.id} ({r.type === 'tram' ? 'Трамвай' : 'Тролейбус'}) — {blockCount} нарядів
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          </div>

          {/* Wagon Block Cards List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredBlocks.map((block) => {
              const isSelected = selectedBlock?.id === block.id;
              
              return (
                <div
                  key={block.id}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setIsEditingSpecs(false);
                  }}
                  className={\`p-3 rounded-xl border-2 cursor-pointer transition-all \${
                    isSelected
                      ? 'bg-blue-50/30 border-blue-600 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-slate-100'
                  }\`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold font-mono text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        {block.id}
                      </span>
                      <span className="font-extrabold font-sans text-slate-900 text-sm">
                        {block.routeId}
                      </span>
                    </div>

                    {!isArchiveMode && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBlockId(block.id);
                            setIsEditingSpecs(true);
                          }}
                          className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Редагувати наряд"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(\`Ви впевнені, що хочете видалити наряд \${block.id}?\`)) {
                              deleteVehicleBlock(block.id);
                              if (selectedBlockId === block.id) setSelectedBlockId('');
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded transition-colors"
                          title="Видалити наряд"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-slate-900 font-sans font-extrabold text-lg mb-2">
                    {block.vehicleNumber}
                  </div>

                  <div className="flex items-center text-xs font-mono text-slate-500 space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{block.depotExitTime} - {block.depotReturnTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        `;

// First we need to properly extract the part we replace.
// We can just use the Regex.
content = content.replace(leftPanelTargetRegex, leftPanelReplacement);

// 6. Make Left panel padding smaller: p-5 to p-4
content = content.replace('bg-[#f8f9fa] p-5 rounded-2xl', 'bg-[#f8f9fa] p-4 rounded-2xl');

fs.writeFileSync(file, content);
console.log('Successfully patched DutyBuilderView.tsx');
