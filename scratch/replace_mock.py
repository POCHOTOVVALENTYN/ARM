with open("src/data/mockData.ts", "r") as f:
    text = f.read()

# Replace tram_X with TX
import re
text = re.sub(r"'tram_(\d+)'", r"'T\1'", text)

# Replace trolleybus_X with TrX
text = re.sub(r"'trolleybus_(\d+)'", r"'Tr\1'", text)

with open("src/data/mockData.ts", "w") as f:
    f.write(text)
