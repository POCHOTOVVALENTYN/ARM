const fs = require('fs');
const file = 'src/components/views/DutyBuilderView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(/draftDuties,[\s\n]*updateVehicleBlockInfo/, 'updateVehicleBlockInfo');
content = content.replace(/addVehicleBlock,[\s\n]*assignDriverToBlockShift/, 'addVehicleBlock');

// 2. driver state
content = content.replace(/\/\/ Driver Assignment form state[\s\S]*?setAssignmentFeedback\(''\);\n\n/g, '');

// 3. assignedDuties
content = content.replace(/\/\/ Assigned drivers \(duties\) linked to this vehicle block[\s\S]*?includes\(selectedBlock\?\.id \|\| ''\)\n  \);\n/g, '');

// 4. handleAssignDriverToShift
content = content.replace(/  const handleAssignDriverToShift = \(e: React\.FormEvent\) => \{[\s\S]*?setTimeout\(\(\) => setAssignmentFeedback\(''\), 3500\);\n  \};\n\n/g, '');

// 5. Text description
content = content.replace(/хв тролейбус\)\. Прив'язка змінних екіпажів водіїв до кожного наряду вагона\./g, 'хв тролейбус).');

// 6. driversAssigned line
content = content.replace(/const driversAssigned = draftDuties\.filter\(\(d\) => d\.assignedBlockIds\.includes\(block\.id\)\);\n/g, '');

// 7. Badge in list
content = content.replace(/<span className={`px-2 py-0\.5 rounded-md font-sans text-\[10px\] font-extrabold \${[\s\S]*?<\/span>/g, '');

// 8. Driver Shifts Allocation Section
content = content.replace(/\/\* Driver Shifts Allocation Section \*\/[\s\S]*?\/\* Wagon Schedule Trips \*\//g, '/* Wagon Schedule Trips */');

// 9. Table headers & cells
content = content.replace(/<th className="p-2\.5">Наряд водія<\/th>\n/g, '');
content = content.replace(/<td className="p-2\.5 text-slate-600">{trip\.dutyId}<\/td>\n/g, '');

fs.writeFileSync(file, content);
console.log('File cleaned successfully');
