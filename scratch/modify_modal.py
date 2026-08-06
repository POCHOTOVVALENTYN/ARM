import re

with open('src/components/network/BreakLocationFormModal.tsx', 'r') as f:
    content = f.read()

# Separate terminals and intermediates
replacement = """
  const stopsSource = route?.allStations || route?.stations || [];
  
  const terminals: Array<{id: string, name: string, type: 'stop'}> = [];
  const intermediates: Array<{id: string, name: string, type: 'stop'}> = [];
  
  stopsSource.forEach(stationId => {
    const s = stations.find(st => st.id === stationId);
    const isTerminal = route?.primaryTerminalId === stationId || route?.secondaryTerminalId === stationId;
    const item = {
      id: stationId,
      name: s?.name || `Зупинка ${stationId}`,
      type: 'stop' as const
    };
    if (isTerminal) {
      terminals.push(item);
    } else {
      intermediates.push(item);
    }
  });

  const handleSave = () => {
"""

content = re.sub(r'  const stopsSource = route\?\.allStations.*?const handleSave = \(\) => {', replacement, content, flags=re.DOTALL)

# Add the warning
replacement2 = """
              <optgroup label="Кінцеві зупинки">
                {terminals.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </optgroup>
              
              <optgroup label="Проміжні зупинки (ОБЕРЕЖНО)">
                {intermediates.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </optgroup>
            </select>
            
            {locationId && intermediates.find(i => i.id === locationId) && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start text-amber-800 text-xs">
                <span className="font-bold mr-1">Увага!</span>
                Призначення тривалої перерви на проміжній зупинці без об'їзної колії може заблокувати рух наступних вагонів.
              </div>
            )}
          </div>
"""

content = re.sub(r'              <optgroup label={`Зупинки на маршруті \${route\?\.number \|\| \'\'}`.*?</select>\s*</div>', replacement2, content, flags=re.DOTALL)

with open('src/components/network/BreakLocationFormModal.tsx', 'w') as f:
    f.write(content)
