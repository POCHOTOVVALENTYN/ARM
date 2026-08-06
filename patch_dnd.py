import os

# 1. Update useScheduleStore.ts
store_file = 'src/store/useScheduleStore.ts'
with open(store_file, 'r') as f:
    store_content = f.read()

if 'reorderVehicleBlocks:' not in store_content:
    store_content = store_content.replace(
        '  recalculateConflicts: () => void;\n}',
        '  recalculateConflicts: () => void;\n  reorderVehicleBlocks: (activeId: string, overId: string) => void;\n}'
    )
    
    # Add implementation
    reorder_impl = """
  reorderVehicleBlocks: (activeId, overId) => {
    set(state => {
      const activeIndex = state.draftBlocks.findIndex(b => b.id === activeId);
      const overIndex = state.draftBlocks.findIndex(b => b.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newBlocks = [...state.draftBlocks];
        const [movedBlock] = newBlocks.splice(activeIndex, 1);
        newBlocks.splice(overIndex, 0, movedBlock);
        return { draftBlocks: newBlocks };
      }
      return state;
    });
  },"""
    store_content = store_content.replace(
        '  generateMultipleBlocks: (routeId, type, count, date) => {',
        reorder_impl.lstrip() + '\n\n  generateMultipleBlocks: (routeId, type, count, date) => {'
    )
    with open(store_file, 'w') as f:
        f.write(store_content)
    print("Store updated.")

