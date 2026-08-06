import re

with open("src/components/tabs/NetworkSettingsTab.tsx", "r") as f:
    text = f.read()

# Replace the single direction lookup
def repl1(m):
    return """const terminalId = dir === 'dir0' ? route.primaryTerminalId : route.secondaryTerminalId;
                                    const terminalName = stations.find(s => s.id === terminalId)?.name || `Зупинка ${terminalId}`;"""

text = re.sub(r"const dirInfo = route\.directions\[dir === 'dir0' \? '0' : '1'\];", repl1, text)
text = text.replace("{dirInfo.firstStopName}", "{terminalName}")

# Replace the double direction lookup
def repl2(m):
    return """const dir0Name = stations.find(s => s.id === route.primaryTerminalId)?.name || 'Кінцева 1';
                            const dir1Name = stations.find(s => s.id === route.secondaryTerminalId)?.name || 'Кінцева 2';"""

text = re.sub(r"const dir0 = route\.directions\['0'\];\s*const dir1 = route\.directions\['1'\];", repl2, text)
text = text.replace("{dir0.firstStopName}", "{dir0Name}")
text = text.replace("{dir1.firstStopName}", "{dir1Name}")

# Wait, if `dirInfo` is no longer used, we should remove `if (!dirInfo) return null;`
text = text.replace("if (!dirInfo) return null;", "if (!terminalName) return null;")


with open("src/components/tabs/NetworkSettingsTab.tsx", "w") as f:
    f.write(text)
