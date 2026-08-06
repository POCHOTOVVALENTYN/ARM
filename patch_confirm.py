import os

file_path = 'src/components/views/DutyBuilderView.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add Confirm Dialog state to DutyBuilderView
state_init = """
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };
"""
content = content.replace(
  "const [searchQuery, setSearchQuery] = useState('');",
  "const [searchQuery, setSearchQuery] = useState('');\n" + state_init
)

# Fix SortableRow props
content = content.replace(
    "deleteVehicleBlock: (id: string) => void;",
    "requestDeleteVehicleBlock: (id: string) => void;"
)
content = content.replace(
    "deleteVehicleBlock(block.id);",
    "requestDeleteVehicleBlock(block.id);"
)
content = content.replace(
    "deleteVehicleBlock }) => {",
    "requestDeleteVehicleBlock }) => {"
)
content = content.replace(
    "if (window.confirm(`Видалити наряд ${block.id}?`)) {",
    ""
)
content = content.replace(
    "requestDeleteVehicleBlock(block.id);\n                }",
    "requestDeleteVehicleBlock(block.id);"
)

# Fix parent SortableRow usage
content = content.replace(
    "deleteVehicleBlock={deleteVehicleBlock}",
    "requestDeleteVehicleBlock={(id) => confirmAction('Підтвердження дії', `Видалити наряд ${id}?`, () => deleteVehicleBlock(id))}"
)

# Fix Clear Filtered Blocks usage
content = content.replace(
    "if (window.confirm('Ви впевнені, що хочете видалити всі відфільтровані наряди?')) {",
    "confirmAction('Підтвердження дії', 'Ви впевнені, що хочете видалити всі відфільтровані наряди?', () => {"
)
content = content.replace(
    "clearVehicleBlocks(filteredBlocks.map(b => b.id));\n                  }",
    "clearVehicleBlocks(filteredBlocks.map(b => b.id));\n                  });"
)

# Add Confirm Dialog JSX before the closing </div>
confirm_jsx = """
      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#2D334A] rounded-xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="font-extrabold text-white text-xl mb-3">
                {confirmDialog.title}
              </h3>
              <p className="text-slate-300 text-sm mb-8">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 bg-[#3B425C] hover:bg-[#464E6C] text-slate-200 font-bold rounded-lg transition-colors text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-6 py-2.5 bg-[#5B3DF5] hover:bg-[#6D52F6] text-white font-extrabold rounded-lg shadow-xs transition-colors text-sm"
                >
                  ОК
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace(
    "    </div>\n  );\n};",
    confirm_jsx + "    </div>\n  );\n};"
)

with open(file_path, 'w') as f:
    f.write(content)

print("Patched.")
