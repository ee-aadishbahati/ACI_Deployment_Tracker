import { useState } from 'react';
import { useDatabaseApp } from '../contexts/DatabaseAppContext';
import { Plus, Download, Trash2, FileText, X } from 'lucide-react';

export function SubChecklistManager() {
  const { state, saveSubChecklist, deleteSubChecklist } = useDatabaseApp();
  const [isOpen, setIsOpen] = useState(false);
  const [subChecklistName, setSubChecklistName] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);
  const currentFabricTasks = state.sections.flatMap(section =>
    section.subsections.flatMap(subsection =>
      subsection.tasks.filter(task => {
        if (!currentFabric) return false;
        return task.fabricSpecific || 
               (task.ndoCentralized && currentFabric.site === 'Tertiary') ||
               (!task.fabricSpecific && !task.ndoCentralized);
      })
    )
  );

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleCreateSubChecklist = () => {
    if (!subChecklistName.trim() || selectedTasks.length === 0) {
      alert('Please enter a name and select at least one task');
      return;
    }

    const subChecklistItems = selectedTasks.map(taskId => {
      const task = currentFabricTasks.find(t => t.id === taskId);
      if (!task) return null;
      
      return {
        id: taskId,
        text: task.text,
        checked: state.fabricStates[state.currentFabric]?.[taskId] || false,
        notes: state.fabricNotes[state.currentFabric]?.[taskId] || '',
        fabricId: state.currentFabric,
        testCase: task.testCase
      };
    }).filter(Boolean);

    saveSubChecklist(subChecklistName, subChecklistItems);
    
    setSubChecklistName('');
    setSelectedTasks([]);
    setIsOpen(false);
    
    alert(`Sub-checklist "${subChecklistName}" created successfully!`);
  };

  const handleExportSubChecklist = (name: string) => {
    const checklist = state.subChecklists[name];
    if (!checklist) return;

    const dataStr = JSON.stringify(checklist, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = (name: string) => {
    const checklist = state.subChecklists[name];
    if (!checklist) return;

    const fabric = state.fabrics.find(f => f.id === checklist.fabricId);
    const htmlContent = generateSubChecklistHTML(checklist, fabric);
    
    const dataBlob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const generateSubChecklistHTML = (checklist: any, fabric: any) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${checklist.name} - ACI Sub-Checklist</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #0D6EFD; text-align: center; border-bottom: 2px solid #0D6EFD; padding-bottom: 10px; }
        .fabric-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .task-item { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .task-header { display: flex; align-items: flex-start; }
        .task-header input[type="checkbox"] { margin-right: 10px; margin-top: 3px; }
        .task-text { flex: 1; font-weight: bold; }
        .test-case { background: #f8f9fa; padding: 10px; margin-top: 10px; border-radius: 4px; font-size: 0.9em; }
        .notes { margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 4px; }
        @media print { body { max-width: none; margin: 0; padding: 15px; } }
    </style>
</head>
<body>
    <h1>${checklist.name}</h1>
    <div class="fabric-info">
        <strong>Fabric:</strong> ${fabric?.name || 'Unknown'}<br>
        <strong>Created:</strong> ${new Date(checklist.createdDate).toLocaleDateString()}<br>
        <strong>Total Tasks:</strong> ${checklist.items.length}
    </div>
    
    ${checklist.items.map((item: any) => `
        <div class="task-item">
            <div class="task-header">
                <input type="checkbox" ${item.checked ? 'checked' : ''} />
                <div class="task-text">${item.text}</div>
            </div>
            ${item.testCase ? `
                <div class="test-case">
                    <strong>Test Case:</strong> ${item.testCase.tcId} | 
                    <strong>Lead:</strong> ${item.testCase.lead} | 
                    <strong>Priority:</strong> ${item.testCase.priority} | 
                    <strong>Effort:</strong> ${item.testCase.effort}h
                    ${item.testCase.preConditions ? `<br><strong>Pre-conditions:</strong> ${item.testCase.preConditions}` : ''}
                </div>
            ` : ''}
            ${item.notes ? `<div class="notes"><strong>Notes:</strong> ${item.notes}</div>` : ''}
        </div>
    `).join('')}
    
    <script>
        document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
            checkbox.addEventListener('change', () => {
                localStorage.setItem('task-' + index, checkbox.checked);
            });
            
            const saved = localStorage.getItem('task-' + index);
            if (saved !== null) {
                checkbox.checked = saved === 'true';
            }
        });
    </script>
</body>
</html>`;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Sub-Checklist Manager</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Create Sub-Checklist</span>
        </button>
      </div>

      {/* Existing Sub-Checklists */}
      <div className="space-y-3">
        {Object.entries(state.subChecklists).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sub-checklists created yet</p>
        ) : (
          Object.entries(state.subChecklists).map(([name, checklist]) => {
            const fabric = state.fabrics.find(f => f.id === checklist.fabricId);
            const completedTasks = checklist.items.filter(item => item.checked).length;
            
            return (
              <div key={name} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{name}</h3>
                  <p className="text-sm text-gray-600">
                    {fabric?.name} • {completedTasks}/{checklist.items.length} tasks completed
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(checklist.createdDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExportHTML(name)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                    title="Export as HTML"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={() => handleExportSubChecklist(name)}
                    className="text-green-600 hover:text-green-800 p-2"
                    title="Export as JSON"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete sub-checklist "${name}"?`)) {
                        deleteSubChecklist(name);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Sub-Checklist Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Sub-Checklist</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub-Checklist Name
              </label>
              <input
                type="text"
                value={subChecklistName}
                onChange={(e) => setSubChecklistName(e.target.value)}
                placeholder="Enter sub-checklist name..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current Fabric: <span className="font-medium">{currentFabric?.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Select tasks to include in the sub-checklist:
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {state.sections.map(section => (
                <div key={section.id}>
                  <h4 className="font-medium text-gray-800 mb-2">{section.title}</h4>
                  {section.subsections.map((subsection, subsectionIndex) => {
                    const relevantTasks = subsection.tasks.filter(task => {
                      if (!currentFabric) return false;
                      return task.fabricSpecific || 
                             (task.ndoCentralized && currentFabric.site === 'Tertiary') ||
                             (!task.fabricSpecific && !task.ndoCentralized);
                    });

                    if (relevantTasks.length === 0) return null;

                    return (
                      <div key={subsectionIndex} className="ml-4 mb-3">
                        <h5 className="font-medium text-gray-700 text-sm mb-2">{subsection.title}</h5>
                        <div className="space-y-1">
                          {relevantTasks.map(task => (
                            <label key={task.id} className="flex items-start space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedTasks.includes(task.id)}
                                onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                                className="mt-1"
                              />
                              <span className="flex-1">{task.text}</span>
                              {task.testCase && (
                                <span className="text-xs text-blue-600">TC: {task.testCase.tcId}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {selectedTasks.length} tasks selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubChecklist}
                  disabled={!subChecklistName.trim() || selectedTasks.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Sub-Checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
