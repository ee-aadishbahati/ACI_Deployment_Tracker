import { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { FabricSelector } from './components/FabricSelector';
import { FabricDashboard } from './components/FabricDashboard';
import { TaskSection } from './components/TaskSection';
import { SearchFilter } from './components/SearchFilter';
import { SubChecklistManager } from './components/SubChecklistManager';
import { useApp } from './contexts/AppContext';
import { 
  BarChart3, 
  CheckSquare, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw,
  Network,
  Save
} from 'lucide-react';

function AppContent() {
  const { state } = useApp();
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks'>('dashboard');
  
  const currentFabric = state.fabrics.find(f => f.id === state.currentFabric);

  const handlePrint = () => {
    window.print();
  };

  const handleExportAllData = () => {
    const exportData = {
      fabricStates: state.fabricStates,
      fabricNotes: state.fabricNotes,
      testCaseStates: state.testCaseStates,
      subChecklists: state.subChecklists,
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
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (importedData.fabricStates && importedData.fabricNotes) {
            localStorage.setItem('aci-deployment-tracker-data', JSON.stringify(importedData));
            window.location.reload(); // Reload to apply imported data
          } else {
            alert('Invalid data format. Please select a valid export file.');
          }
        } catch (error) {
          alert('Error reading file. Please select a valid JSON export file.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
      localStorage.removeItem('aci-deployment-tracker-data');
      window.location.reload();
    }
  };

  const handleSaveToLocal = async () => {
    const exportData = {
      fabricStates: state.fabricStates,
      fabricNotes: state.fabricNotes,
      testCaseStates: state.testCaseStates,
      subChecklists: state.subChecklists,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
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
      handleExportAllData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  ACI Deployment Tracker
                </h1>
              </div>
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
              </div>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveToLocal}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="Save to Local Directory"
                >
                  <Save size={16} />
                  <span className="text-sm font-medium">Save</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                  title="Print"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={handleExportAllData}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                  title="Export All Data"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={handleImportData}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                  title="Import Data"
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={handleResetAll}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
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
        ) : (
          <div className="space-y-6">
            {/* Current Fabric Info */}
            <div className="bg-white shadow-lg rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Current Fabric: {currentFabric?.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentFabric?.description}
                    {currentFabric?.site === 'Tertiary' && (
                      <span className="ml-2 text-blue-600 font-medium">
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
                <TaskSection key={section.id} section={section} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
