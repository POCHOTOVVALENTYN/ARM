import json
import re

with open("src/data/gtfsParsed.json", "r") as f:
    json_data = json.load(f)
    json_ids = set([r['id'] for r in json_data])

with open("src/data/gtfsParsedData.ts", "r") as f:
    ts_data = f.read()
    ts_ids = set(re.findall(r'"id": "([^"]+)"', ts_data))
    # map ts_ids to json_ids mapping: T* -> tram_*, Tr* -> trolleybus_*
    mapped_ts_ids = set()
    for tid in ts_ids:
        if tid.startswith("Tr"):
            mapped_ts_ids.add("trolleybus_" + tid[2:])
        elif tid.startswith("T"):
            mapped_ts_ids.add("tram_" + tid[1:])

print("Missing in TS:", json_ids - mapped_ts_ids)
