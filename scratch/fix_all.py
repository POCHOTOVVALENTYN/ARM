import re

with open("src/components/tabs/NetworkSettingsTab.tsx", "r") as f:
    text = f.read()

# For pullOut default values
text = text.replace("dirInfo.firstStopId", "terminalId")

# For pullIn default values
text = text.replace("dirInfo.lastStopId", "terminalId === route.primaryTerminalId ? route.secondaryTerminalId : route.primaryTerminalId")

# For pullIn name
text = text.replace("{dirInfo.lastStopName}", "{stations.find(s => s.id === (terminalId === route.primaryTerminalId ? route.secondaryTerminalId : route.primaryTerminalId))?.name || 'Кінцева'}")

# Fix "dir0.firstStopId"
text = text.replace("dir0.firstStopId", "route.primaryTerminalId")
text = text.replace("dir1.firstStopId", "route.secondaryTerminalId")

# Fix "dir0.lastStopId"
text = text.replace("dir0.lastStopId", "route.secondaryTerminalId")
text = text.replace("dir1.lastStopId", "route.primaryTerminalId")

# Fix "dir0 ?" to "true ?"
text = text.replace("dir0 ?", "true ?")
text = text.replace("dir1 ?", "true ?")

with open("src/components/tabs/NetworkSettingsTab.tsx", "w") as f:
    f.write(text)
