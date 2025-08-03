import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export function ProgressCharts() {
  const { state, getFabricProgress } = useApp();
  const [, setLastUpdate] = useState(Date.now());

  useWebSocket({
    onTaskStateUpdate: () => setLastUpdate(Date.now()),
    onTaskNotesUpdate: () => setLastUpdate(Date.now()),
    onTaskCategoryUpdate: () => setLastUpdate(Date.now()),
  });

  const allProgress = state.fabrics.map(fabric => ({
    fabric,
    progress: getFabricProgress(fabric.id)
  }));

  const completionData = allProgress.map(({ fabric, progress }) => ({
    name: fabric.name,
    site: fabric.site,
    type: fabric.type,
    siteType: `${fabric.site} ${fabric.type}`,
    completion: progress.totalTasks > 0 ? Math.round((progress.completedTasks / progress.totalTasks) * 100) : 0,
    testCompletion: progress.totalTestCases > 0 ? Math.round((progress.completedTestCases / progress.totalTestCases) * 100) : 0,
    totalTasks: progress.totalTasks,
    completedTasks: progress.completedTasks,
    highPriorityPending: progress.highPriorityPending
  }));

  const siteData = ['North', 'South', 'Tertiary'].map(site => {
    const siteProgress = allProgress.filter(item => item.fabric.site === site);
    const siteTasks = siteProgress.reduce((sum, item) => sum + item.progress.totalTasks, 0);
    const siteCompleted = siteProgress.reduce((sum, item) => sum + item.progress.completedTasks, 0);
    const siteTestCases = siteProgress.reduce((sum, item) => sum + item.progress.totalTestCases, 0);
    const siteTestCompleted = siteProgress.reduce((sum, item) => sum + item.progress.completedTestCases, 0);
    
    return {
      site,
      completion: siteTasks > 0 ? Math.round((siteCompleted / siteTasks) * 100) : 0,
      testCompletion: siteTestCases > 0 ? Math.round((siteTestCompleted / siteTestCases) * 100) : 0,
      totalTasks: siteTasks,
      completedTasks: siteCompleted,
      pendingTasks: siteTasks - siteCompleted
    };
  });

  const priorityData = [
    { name: 'High Priority Pending', value: allProgress.reduce((sum, item) => sum + item.progress.highPriorityPending, 0), color: '#ef4444' },
    { name: 'Completed Tasks', value: allProgress.reduce((sum, item) => sum + item.progress.completedTasks, 0), color: '#10b981' },
    { name: 'Pending Tasks', value: allProgress.reduce((sum, item) => sum + (item.progress.totalTasks - item.progress.completedTasks - item.progress.highPriorityPending), 0), color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Fabric Completion Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg)', 
                  border: '1px solid var(--tooltip-border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="completion" fill="#3b82f6" name="Task Completion %" />
              <Bar dataKey="testCompletion" fill="#10b981" name="Test Case Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Site Progress Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={siteData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="site" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg)', 
                  border: '1px solid var(--tooltip-border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={3} name="Task Completion %" />
              <Line type="monotone" dataKey="testCompletion" stroke="#10b981" strokeWidth={3} name="Test Completion %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5" />
            Task Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Fabric Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="siteType" 
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs" 
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg)', 
                  border: '1px solid var(--tooltip-border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="totalTasks" fill="#8b5cf6" name="Total Tasks" />
              <Bar dataKey="completedTasks" fill="#10b981" name="Completed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
