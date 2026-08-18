const fs = require('fs');
const file = 'src/components/views/DutyBuilderView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(/X,\n  Check,/, 'X,\n  Check,\n  Trash,\n  Trash2,');

// 2. State & Store
content = content.replace(
  /  const { \n    draftBlocks, \n    updateVehicleBlockInfo, \n    addVehicleBlock \n  } = useScheduleStore\(\);/,
  `  const { 
    draftBlocks, 
    updateVehicleBlockInfo, 
    addVehicleBlock,
    selectedDate,
    setSelectedDate,
    deleteVehicleBlock,
    clearVehicleBlocks
  } = useScheduleStore();

  const today = new Date().toISOString().split('T')[0];
  const isArchiveMode = selectedDate < today;`
);

// 3. Filtered blocks logic
content = content.replace(
  /  const selectedBlock = draftBlocks.find\(\(b\) => b\.id === selectedBlockId\) \|\| draftBlocks\[0\];\n\n  \n  \/\/ Filtered blocks list\n  const filteredBlocks = draftBlocks\.filter\(\(block\) => \{\n    const matchesSearch = \n      block\.id\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\n      block\.vehicleNumber\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\n      block\.routeId\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\);\n    const matchesRoute = routeFilter === 'all' \|\| block\.routeId === routeFilter;\n    return matchesSearch && matchesRoute;\n  \}\);/,
  `  const blocksForDate = draftBlocks.filter(b => b.date === selectedDate || (!b.date && selectedDate === today));
  const selectedBlock = blocksForDate.find((b) => b.id === selectedBlockId) || blocksForDate[0];

  // Filtered blocks list
  const filteredBlocks = blocksForDate.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === 'all' || block.routeId === routeFilter;
    return matchesSearch && matchesRoute;
  });`
);

// 4. Top Banner Calendar & Grid Layout
content = content.replace(
  /        <\/button>\n      <\/div>\n\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">\n        \{\/\* Left Panel: Wagon Outfit Registry \(Vehicle Blocks\) \*\/\}\n        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">/,
  `        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
          {isArchiveMode ? (
            <div className="bg-amber-100 text-amber-800 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-amber-200 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Режим Архіву</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAddBlockOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-blue-700 shadow-xs flex items-center space-x-2 cursor-pointer shrink-0 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Створити Наряд Вагона</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Wagon Outfit Registry (Vehicle Blocks) */}
        <div className="bg-[#f8f9fa] p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">`
);

// 5. Left Panel header buttons
content = content.replace(
  /            <\/div>\n            <span className="text-xs font-mono font-extrabold bg-blue-50 text-blue-700 px-2\.5 py-0\.5 rounded-lg border border-blue-200">\n              \{filteredBlocks\.length\} ТЗ\n            <\/span>\n          <\/div>/,
  `            </div>
            <div className="flex items-center space-x-2">
              {!isArchiveMode && (
                <button
                  onClick={() => {
                    if (window.confirm('Ви впевнені, що хочете видалити ВСІ наряди?')) {
                      clearVehicleBlocks(filteredBlocks.map(b => b.id));
                      if (filteredBlocks.find(b => b.id === selectedBlockId)) setSelectedBlockId('');
                    }
                  }}
                  className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                  title="Видалити всі"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-xs font-mono font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {filteredBlocks.length} ТЗ
              </span>
            </div>
          </div>`
);

// 6. Left Panel Route Dropdown
content = content.replace(
  /            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-\[11px\] font-bold">[\s\S]*?<\/div>\n          <\/div>\n\n          \{\/\* Wagon Block Cards List \*\/\}\n          <div className="space-y-2\.5 max-h-\[520px\] overflow-y-auto pr-1">/,
  `            <div className="pt-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <select
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all appearance-none"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Wagon Block Cards List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">`
);

// 7. List Items
content = content.replace(
  /                  <div className="flex items-center justify-between">\n                    <div className="flex items-center space-x-2">\n                      <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0\.5 rounded text-xs">\n                        \{block\.id\}\n                      <\/span>\n                      <span className="font-extrabold text-slate-900">\n                        \{block\.routeId\}\n                      <\/span>\n                    <\/div>\n                    <span className="text-\[10px\] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0\.5 rounded border border-slate-200">\n                      \{block\.type === 'tram' \? 'Трамвай' : 'Тролейбус'\}\n                    <\/span>\n                  <\/div>\n\n                  <div className="text-slate-900 font-sans font-extrabold text-xs mt-2">\n                    \{block\.vehicleNumber\}\n                  <\/div>\n\n                  <div className="flex items-center justify-between text-\[11px\] text-slate-600 mt-2 pt-2 border-t border-slate-100">\n                    <span className="flex items-center space-x-1">\n                      <Clock className="w-3 h-3 text-slate-400" \/>\n                      <span>\{block\.depotExitTime\} - \{block\.depotReturnTime\}<\/span>\n                    <\/span>\n\n                    \n                  <\/div>/g,
  `                  <div className="flex items-center justify-between">
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
                          <Edit3 className="w-3.5 h-3.5" />
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

                  <div className="text-slate-900 font-sans font-extrabold text-base mb-1">
                    {block.vehicleNumber}
                  </div>

                  <div className="flex items-center text-[11px] font-mono text-slate-500 space-x-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{block.depotExitTime} - {block.depotReturnTime}</span>
                  </div>`
);

// 8. Right Panel col-span
content = content.replace(
  /        \{\/\* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping \*\/\}\n        <div className="lg:col-span-2 space-y-6">/,
  `        {/* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping */}
        <div className="lg:col-span-3 space-y-6">`
);

fs.writeFileSync(file, content);
console.log('Final patch applied');
