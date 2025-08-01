import { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FabricSelector } from './components/FabricSelector';
import { FabricDashboard } from './components/FabricDashboard';
import { TaskSection } from './components/TaskSection';
import { SearchFilter } from './components/SearchFilter';
import { SubChecklistManager } from './components/SubChecklistManager';
import { PriorityCategories } from './components/PriorityCategories';
import { AutoSaveStatus } from './components/AutoSaveStatus';
import { BulkOperations } from './components/BulkOperations';
import { ThemeToggle } from './components/ThemeToggle';
import { useApp } from './contexts/AppContext';
import { apiService } from './services/api';
import { 
  BarChart3, 
  CheckSquare, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw,
  Network,
  Save,
  Star,
  Users
} from 'lucide-react';

function AppContent() {
  const { state } = useApp();
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'priorities'>('dashboard');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  
  const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);

  const handlePrint = () => {
    window.print();
  };

  const handleExportAllData = async () => {
    try {
      const data = await apiService.getAllData();
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `aci-deployment-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (importedData.fabricStates !== undefined && importedData.fabricNotes !== undefined) {
            const dataToImport = {
              fabricStates: importedData.fabricStates || {},
              fabricNotes: importedData.fabricNotes || {},
              testCaseStates: importedData.testCaseStates || {},
              subChecklists: importedData.subChecklists || {},
              taskCategories: importedData.taskCategories || {},
              currentFabric: importedData.currentFabric || null,
              lastSaved: null
            };
            
            await apiService.updateAllData(dataToImport);
            window.location.reload(); // Reload to apply imported data
          } else {
            alert('Invalid data format. Please select a valid export file.');
          }
        } catch (error) {
          console.error('Error importing data:', error);
          alert('Error reading file. Please select a valid JSON export file.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
      try {
        const resetData = {
          fabricStates: {},
          fabricNotes: {},
          testCaseStates: {},
          subChecklists: {},
          taskCategories: {},
          currentFabric: null,
          lastSaved: null
        };
        
        await apiService.updateAllData(resetData);
        window.location.reload();
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Failed to reset data. Please try again.');
      }
    }
  };

  const handleSaveToLocal = async () => {
    console.log('=== MANUAL SAVE TRIGGERED ===');
    
    try {
      const data = await apiService.getAllData();
      await apiService.updateAllData(data);
      
      console.log('Current API data:', data);
      console.log('Current app state:', {
        fabricStates: state.fabricStates,
        fabricNotes: state.fabricNotes,
        taskCategories: state.taskCategories
      });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
      
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        savedBy: 'ACI Deployment Tracker',
        totalFabrics: Object.keys(data.fabricStates).length,
        totalTasks: Object.values(data.fabricStates).reduce((total, fabric) => 
          total + Object.keys(fabric).length, 0)
      };

      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.saveToLocal(exportData);
          if (result.success) {
            alert(`Progress saved successfully!\nFile: ${result.filename}\nLocation: SavedWork folder`);
          } else {
            alert(`Error saving file: ${result.error}`);
          }
        } catch (error) {
          alert(`Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ACI-Deployment-Progress-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; 
                    padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    z-index: 1000; font-family: system-ui; font-size: 14px; max-width: 300px;">
          <div style="font-weight: 600; margin-bottom: 4px;">✅ Progress Saved!</div>
          <div style="font-size: 12px; opacity: 0.9;">File: ACI-Deployment-Progress-${timestamp}.json</div>
          <div style="font-size: 12px; opacity: 0.9;">Check your Downloads folder</div>
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 4000);
      }
    } catch (error) {
      console.error('Error saving to local:', error);
      alert('Failed to save progress. Please try again.');
    }
  };

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBulkModeToggle = () => {
    setBulkMode(!bulkMode);
    if (bulkMode) {
      setSelectedTasks([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ACI Deployment Tracker
                </h1>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Multi-Site Multi-Fabric
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={16} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveView('tasks')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'tasks'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <CheckSquare size={16} />
                  <span>Tasks</span>
                </button>
                <button
                  onClick={() => setActiveView('priorities')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'priorities'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Star size={16} />
                  <span>Priorities</span>
                </button>
              </div>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkModeToggle}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    bulkMode
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Toggle bulk operations mode"
                >
                  <Users size={16} />
                  <span>Bulk</span>
                </button>
              </div>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center space-x-2">
                <AutoSaveStatus />
              </div>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center space-x-2">
                <ThemeToggle />
              </div>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveToLocal}
                  className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                  title="Save progress to Downloads folder with timestamp"
                >
                  <Save size={16} />
                  <span className="text-sm font-medium">Save Progress</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Print"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={handleExportAllData}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Export All Data"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={handleImportData}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Import Data"
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={handleResetAll}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Reset All Progress"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fabric Selection */}
        <FabricSelector />

        {activeView === 'dashboard' ? (
          <FabricDashboard />
        ) : activeView === 'priorities' ? (
          <PriorityCategories />
        ) : (
          <div className="space-y-6">
            {/* Current Fabric Info */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Current Fabric: {currentFabric?.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentFabric?.description}
                    {currentFabric?.site === 'Tertiary' && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                        • NDO Management Site
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Filter */}
            <SearchFilter />

            {/* Sub-Checklist Manager */}
            <SubChecklistManager />

            {/* Task Sections */}
            <div className="space-y-6">
              {state.sections.map(section => (
                <TaskSection 
                  key={section.id} 
                  section={section}
                  selectedTasks={selectedTasks}
                  onTaskSelect={handleTaskSelect}
                  bulkMode={bulkMode}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bulk Operations */}
      {bulkMode && (
        <BulkOperations
          selectedTasks={selectedTasks}
          onSelectionChange={setSelectedTasks}
          onClose={() => setBulkMode(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span>ACI Deployment Tracker v1.0.0</span>
              <span className="mx-2">•</span>
              <span>Essential Energy</span>
            </div>
            <div>
              <span>Multi-Site ACI Fabric Deployment Management</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
