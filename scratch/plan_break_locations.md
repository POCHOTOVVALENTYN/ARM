# Refactoring Plan: Driver Break Locations (HASTUS / Optibus approach)

## Context & Bug Analysis
The user reported that stops for adding break locations are missing. After our recent update to `gtfsParsedData.ts`, routes now properly contain the `stations` array mapped from GTFS. However, the current UI in `BreakLocationFormModal` and `NetworkSettingsTab` is basic and lacks advanced configuration necessary for professional transit scheduling (like in HASTUS or Optibus).

## Proposed Refactoring Plan

### 1. Advanced Break Location Data Model
In HASTUS and Optibus, meal breaks (relief opportunities) require more context than just "Location ID" and "Capacity". We will enhance `BreakLocationConfig` to include:
- **Direction Awareness**: (Forward / Return / Both) Break points are often direction-specific.
- **Relief Type**: (In-vehicle break, or Relief where the driver leaves the vehicle).
- **Walking Time (t_walk)**: Time required to walk from the stop to the actual break room/canteen.
- **Active Hours**: Time windows when the break location is available (e.g., canteen is open from 08:00 to 20:00).

### 2. UI Refactoring: "Місця обідів водіїв" Section
- Separate Tram and Trolleybus routes clearly in the Break Locations database.
- Show an overview for each route: number of valid break locations, total capacity, and directions covered.
- Add visual indicators for Terminal breaks vs Intermediate stop breaks.

### 3. UI Refactoring: Break Location Form Modal (Меню додавання точок)
- **Enhanced Dropdown**: Group stops by Direction (Прямий напрямок, Зворотний напрямок) and highlight Terminals/Dispatch Points.
- **Configuration Fields**: Add fields for Direction, Walking Time (хв), and Availability Window.
- **Validation**: Ensure that a break location capacity makes sense (e.g., a simple intermediate stop might not support 5 vehicles standing for 45 minutes without blocking the line).

## User Review Required
Please review the proposed HASTUS/Optibus inspired fields. Should we include Direction and Walking Time in this refactoring phase?

## Open Questions
1. Do you want to restrict break locations strictly to Terminal stops (Кінцеві) and Dispatch Points (Диспетчерські), or allow ANY intermediate stop (as currently requested)? *Note: Allowing any intermediate stop might block the track for trailing vehicles.*
2. Should we add a field for "Canteen/Break Room availability time" (e.g., 08:00 - 18:00)?

## Verification Plan
1. Check that all tram/trolleybus routes display correctly in the Break Locations tab.
2. Open the "Add Break Location" modal and verify that ALL intermediate and terminal stops from GTFS are available.
3. Save a break location and verify it displays correctly with the new HASTUS-style parameters.
