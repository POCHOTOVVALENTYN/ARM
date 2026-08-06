import os

# Fix useScheduleStore.ts
store_path = 'src/store/useScheduleStore.ts'
with open(store_path, 'r') as f:
    store_content = f.read()

# Add TransportType to imports
if 'TransportType' not in store_content.split('from \'../types\'')[0]:
    store_content = store_content.replace(
        'DailyDeploymentPlan\n} from \'../types\';',
        'DailyDeploymentPlan,\n  TransportType\n} from \'../types\';'
    )

store_content = store_content.replace(
    "generateMultipleBlocks: (routeId: string, type: 'tram'|'trolley', count: number, date: string) => void;",
    "generateMultipleBlocks: (routeId: string, type: TransportType, count: number, date: string) => void;"
)

with open(store_path, 'w') as f:
    f.write(store_content)

# Fix DutyBuilderView.tsx
view_path = 'src/components/views/DutyBuilderView.tsx'
with open(view_path, 'r') as f:
    view_content = f.read()

view_content = view_content.replace(
    "{trip.direction === 'forward' ? 'Прямий' : 'Зворотній'}",
    "{trip.direction === 1 ? 'Прямий' : 'Зворотній'}"
)

view_content = view_content.replace(
    "{trip.origin} → {trip.destination}",
    "{trip.startStationId} → {trip.endStationId}"
)

with open(view_path, 'w') as f:
    f.write(view_content)

print("Fixed types")
