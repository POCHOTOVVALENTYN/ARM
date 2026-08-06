import re
import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Imports
    if 'Trash2' not in content:
        content = content.replace('  X,\n  Check,', '  X,\n  Check,\n  Trash,\n  Trash2,')

    # 2. Store variables
    old_store = """  const { 
    draftBlocks, 
    updateVehicleBlockInfo, 
    addVehicleBlock 
  } = useScheduleStore();"""
    new_store = """  const { 
    draftBlocks, 
    updateVehicleBlockInfo, 
    addVehicleBlock,
    selectedDate,
    setSelectedDate,
    deleteVehicleBlock,
    clearVehicleBlocks
  } = useScheduleStore();

  const today = new Date().toISOString().split('T')[0];
  const isArchiveMode = selectedDate < today;"""
    if old_store in content:
        content = content.replace(old_store, new_store)
    else:
        print("Failed to replace store variables")

    # 3. filteredBlocks logic
    old_filter = """  const selectedBlock = draftBlocks.find((b) => b.id === selectedBlockId) || draftBlocks[0];

  
  // Filtered blocks list
  const filteredBlocks = draftBlocks.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === 'all' || block.routeId === routeFilter;
    return matchesSearch && matchesRoute;
  });"""
    new_filter = """  const blocksForDate = draftBlocks.filter(b => b.date === selectedDate || (!b.date && selectedDate === today));
  const selectedBlock = blocksForDate.find((b) => b.id === selectedBlockId) || blocksForDate[0];

  // Filtered blocks list
  const filteredBlocks = blocksForDate.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === 'all' || block.routeId === routeFilter;
    return matchesSearch && matchesRoute;
  });"""
    if old_filter in content:
        content = content.replace(old_filter, new_filter)
    else:
        print("Failed to replace filteredBlocks logic")

    # 4. Top Banner Calendar & Grid Layout
    old_banner = """        </div>

        <button
          onClick={() => setIsAddBlockOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-blue-700 shadow-xs flex items-center space-x-2 cursor-pointer shrink-0 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Створити Наряд Вагона</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Wagon Outfit Registry (Vehicle Blocks) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">"""
    
    new_banner = """        </div>

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
        <div className="bg-[#f8f9fa] p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">"""
    if old_banner in content:
        content = content.replace(old_banner, new_banner)
    else:
        print("Failed to replace top banner")

    # 5. Header buttons (Trash2)
    old_header_btns = """            </div>
            <span className="text-xs font-mono font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {filteredBlocks.length} ТЗ
            </span>
          </div>"""
    new_header_btns = """            </div>
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
          </div>"""
    if old_header_btns in content:
        content = content.replace(old_header_btns, new_header_btns)
    else:
        print("Failed to replace header buttons")

    # 6. Route Filter Dropdown
    old_route_filter = """            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-bold">
              {['all', ...routes.map(r => r.id)].map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRouteFilter(rt)}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                    routeFilter === rt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rt === 'all' ? 'Всі маршрути' : rt}
                </button>
              ))}
            </div>
          </div>

          {/* Wagon Block Cards List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">"""
    new_route_filter = """            <div className="pt-1 flex items-center space-x-2">
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
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">"""
    if old_route_filter in content:
        content = content.replace(old_route_filter, new_route_filter)
    else:
        print("Failed to replace route filter dropdown")

    # 7. Card Design (No regex, strict match)
    old_card_head = """                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        {block.id}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {block.routeId}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {block.type === 'tram' ? 'Трамвай' : 'Тролейбус'}
                    </span>
                  </div>

                  <div className="text-slate-900 font-sans font-extrabold text-xs mt-2">
                    {block.vehicleNumber}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{block.depotExitTime} - {block.depotReturnTime}</span>
                    </span>

                    
                  </div>"""
    new_card_head = """                  <div className="flex items-center justify-between">
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
                            if (window.confirm(`Ви впевнені, що хочете видалити наряд ${block.id}?`)) {
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
                  </div>"""
    if old_card_head in content:
        content = content.replace(old_card_head, new_card_head)
    else:
        print("Failed to replace card design")

    # 8. Right Panel col-span
    old_col_span = """        {/* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping */}
        <div className="lg:col-span-2 space-y-6">"""
    new_col_span = """        {/* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping */}
        <div className="lg:col-span-3 space-y-6">"""
    if old_col_span in content:
        content = content.replace(old_col_span, new_col_span)
    else:
        print("Failed to replace col-span")

    with open(filepath, 'w') as f:
        f.write(content)
    print("Patch applied via Python")

patch_file('src/components/views/DutyBuilderView.tsx')
