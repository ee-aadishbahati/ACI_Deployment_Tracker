import { useState } from 'react';
import { useDatabaseApp } from '../contexts/DatabaseAppContext';
import { Plus, Check, X, ChevronDown } from 'lucide-react';

export function TaskCreator() {
  const { state, addTask, addSubsection } = useDatabaseApp();
  const [taskText, setTaskText] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubsectionTitle, setSelectedSubsectionTitle] = useState('');
  const [newSubsectionTitle, setNewSubsectionTitle] = useState('');
  const [fabricSpecific, setFabricSpecific] = useState(true);
  const [ndoCentralized, setNdoCentralized] = useState(false);
  const [isCreatingNewSubsection, setIsCreatingNewSubsection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedSection = state.sections.find(s => s.id === selectedSectionId);
  const availableSubsections = selectedSection?.subsections || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskText.trim() || !selectedSectionId) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (isCreatingNewSubsection && !newSubsectionTitle.trim()) {
      setErrorMessage('Please enter a name for the new subsection');
      return;
    }

    if (!isCreatingNewSubsection && !selectedSubsectionTitle) {
      setErrorMessage('Please select a subsection');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let subsectionTitle = selectedSubsectionTitle;
      
      if (isCreatingNewSubsection) {
        subsectionTitle = newSubsectionTitle.trim();
        await addSubsection(selectedSectionId, subsectionTitle);
      }

      await addTask(selectedSectionId, subsectionTitle, {
        text: taskText.trim(),
        fabricSpecific,
        ndoCentralized
      });

      setSuccessMessage('Task created successfully!');
      setTaskText('');
      setNewSubsectionTitle('');
      setSelectedSubsectionTitle('');
      setIsCreatingNewSubsection(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to create task. Please try again.');
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTaskText('');
    setSelectedSectionId('');
    setSelectedSubsectionTitle('');
    setNewSubsectionTitle('');
    setFabricSpecific(true);
    setNdoCentralized(false);
    setIsCreatingNewSubsection(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Task</h1>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 rounded flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="taskText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Description *
            </label>
            <textarea
              id="taskText"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Enter a detailed description of the task..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section *
              </label>
              <div className="relative">
                <select
                  id="section"
                  value={selectedSectionId}
                  onChange={(e) => {
                    setSelectedSectionId(e.target.value);
                    setSelectedSubsectionTitle('');
                    setIsCreatingNewSubsection(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                  required
                >
                  <option value="">Select a section...</option>
                  {state.sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="subsection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subsection *
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <select
                    id="subsection"
                    value={isCreatingNewSubsection ? 'CREATE_NEW' : selectedSubsectionTitle}
                    onChange={(e) => {
                      if (e.target.value === 'CREATE_NEW') {
                        setIsCreatingNewSubsection(true);
                        setSelectedSubsectionTitle('');
                      } else {
                        setIsCreatingNewSubsection(false);
                        setSelectedSubsectionTitle(e.target.value);
                        setNewSubsectionTitle('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                    disabled={!selectedSectionId}
                    required
                  >
                    <option value="">Select a subsection...</option>
                    {availableSubsections.map(subsection => (
                      <option key={subsection.title} value={subsection.title}>
                        {subsection.title}
                      </option>
                    ))}
                    <option value="CREATE_NEW">+ Create New Subsection</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                {isCreatingNewSubsection && (
                  <input
                    type="text"
                    value={newSubsectionTitle}
                    onChange={(e) => setNewSubsectionTitle(e.target.value)}
                    placeholder="Enter new subsection name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Task Properties
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={fabricSpecific}
                  onChange={(e) => setFabricSpecific(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fabric Specific</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Task applies to individual fabric configurations
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={ndoCentralized}
                  onChange={(e) => setNdoCentralized(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">NDO Centralized</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Task is centralized at the Tertiary site for NDO operations
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
