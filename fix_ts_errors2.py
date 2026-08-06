import re

# Fix SlackPropagationResult
with open("src/utils/scheduleEngine.ts", "r") as f:
    engine_code = f.read()

engine_code = engine_code.replace(
    "export const SlackPropagationResult = (...args: any[]): any => {};",
    "export type SlackPropagationResult = any;"
)

with open("src/utils/scheduleEngine.ts", "w") as f:
    f.write(engine_code)

# Fix ThemeMode
with open("src/store/useScheduleStore.ts", "r") as f:
    store_code = f.read()

store_code = "export type ThemeMode = 'light' | 'dark' | 'system';\n" + store_code

with open("src/store/useScheduleStore.ts", "w") as f:
    f.write(store_code)

