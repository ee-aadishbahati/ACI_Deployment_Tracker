import { useApp } from '../contexts/AppContext';
import { BarChart3, Users, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { getProgressColor } from '../utils/colorUtils';
import { calculateProgress } from '../utils/progressUtils';

export function FabricDashboard() {
  const { state, getFabricProgress } = useApp();

  const getAllProgress = () => {
    return state.fabrics.map(fabric => ({
      fabric,
      progress: getFabricProgress(fabric.id)
    }));
  };

  const allProgress = getAllProgress();
  const totalTasks = allProgress.reduce((sum, item) => sum + item.progress.totalTasks, 0);
  const totalCompleted = allProgress.reduce((sum, item) => sum + item.progress.completedTasks, 0);
  const totalTestCases = allProgress.reduce((sum, item) => sum + item.progress.totalTestCases, 0);
  const totalTestCasesCompleted = allProgress.reduce((sum, item) => sum + item.progress.completedTestCases, 0);
  const totalHighPriorityPending = allProgress.reduce((sum, item) => sum + item.progress.highPriorityPending, 0);

  const overallCompletion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const testCaseCompletion = totalTestCases > 0 ? Math.round((totalTestCasesCompleted / totalTestCases) * 100) : 0;


  const getSiteProgress = (site: string) => {
    const siteProgress = allProgress.filter(item => item.fabric.site === site);
    const siteTasks = siteProgress.reduce((sum, item) => sum + item.progress.totalTasks, 0);
    const siteCompleted = siteProgress.reduce((sum, item) => sum + item.progress.completedTasks, 0);
    return calculateProgress(siteCompleted, siteTasks).percentage;
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <BarChart3 className="mr-2" />
          Multi-Site ACI Deployment Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Overall Progress</p>
                <p className="text-2xl font-bold text-blue-900">{overallCompletion}%</p>
                <p className="text-xs text-blue-700">{totalCompleted}/{totalTasks} tasks</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Test Cases</p>
                <p className="text-2xl font-bold text-green-900">{testCaseCompletion}%</p>
                <p className="text-xs text-green-700">{totalTestCasesCompleted}/{totalTestCases} completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">High Priority Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{totalHighPriorityPending}</p>
                <p className="text-xs text-yellow-700">Requires attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Fabrics</p>
                <p className="text-2xl font-bold text-purple-900">{state.fabrics.length}</p>
                <p className="text-xs text-purple-700">Across 3 sites</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Site Progress */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress by Site</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['North', 'South', 'Tertiary'].map(site => {
            const siteProgress = getSiteProgress(site);
            const siteFabrics = allProgress.filter(item => item.fabric.site === site);
            
            return (
              <div key={site} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">
                    {site} Data Center
                    {site === 'Tertiary' && (
                      <span className="block text-xs text-blue-600">(NDO Host)</span>
                    )}
                  </h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getProgressColor(siteProgress)}`}>
                    {siteProgress}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  {siteFabrics.map(({ fabric, progress }) => {
                    const fabricCompletion = calculateProgress(progress.completedTasks, progress.totalTasks).percentage;
                    
                    return (
                      <div key={fabric.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{fabric.type} Fabric</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-800">{fabricCompletion}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${fabricCompletion}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Fabric Status */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Fabric Status</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fabric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Cases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  High Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allProgress.map(({ fabric, progress }) => {
                const completion = calculateProgress(progress.completedTasks, progress.totalTasks).percentage;
                const testCompletion = calculateProgress(progress.completedTestCases, progress.totalTestCases).percentage;
                
                return (
                  <tr key={fabric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {fabric.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {fabric.site} • {fabric.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {progress.completedTasks}/{progress.totalTasks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {progress.completedTestCases}/{progress.totalTestCases} ({testCompletion}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {progress.highPriorityPending > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {progress.highPriorityPending} pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Up to date
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProgressColor(completion)}`}>
                        {completion >= 90 ? 'Near Complete' : 
                         completion >= 70 ? 'In Progress' : 
                         completion >= 40 ? 'Started' : 'Not Started'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
