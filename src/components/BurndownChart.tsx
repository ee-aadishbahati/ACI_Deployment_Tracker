import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Calendar } from 'lucide-react';

interface ProgressSnapshot {
  date: string;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
}

export function BurndownChart() {
  const { state, getFabricProgress } = useApp();
  const [historicalData, setHistoricalData] = useState<ProgressSnapshot[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('aci-progress-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistoricalData(parsed);
      } catch (error) {
        console.error('Error parsing historical data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const currentProgress = state.fabrics.reduce((acc, fabric) => {
      const progress = getFabricProgress(fabric.id);
      return {
        totalTasks: acc.totalTasks + progress.totalTasks,
        completedTasks: acc.completedTasks + progress.completedTasks
      };
    }, { totalTasks: 0, completedTasks: 0 });

    const today = new Date().toISOString().split('T')[0];
    const snapshot: ProgressSnapshot = {
      date: today,
      totalTasks: currentProgress.totalTasks,
      completedTasks: currentProgress.completedTasks,
      remainingTasks: currentProgress.totalTasks - currentProgress.completedTasks,
      completionPercentage: currentProgress.totalTasks > 0 ? 
        Math.round((currentProgress.completedTasks / currentProgress.totalTasks) * 100) : 0
    };

    setHistoricalData(prev => {
      const existingIndex = prev.findIndex(item => item.date === today);
      let newData;
      
      if (existingIndex >= 0) {
        newData = [...prev];
        newData[existingIndex] = snapshot;
      } else {
        newData = [...prev, snapshot].sort((a, b) => a.date.localeCompare(b.date));
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filtered = newData.filter(item => new Date(item.date) >= thirtyDaysAgo);

      localStorage.setItem('aci-progress-history', JSON.stringify(filtered));
      
      return filtered;
    });
  }, [state.fabricStates, state.testCaseStates, getFabricProgress, state.fabrics]);

  const generateIdealBurndown = () => {
    if (historicalData.length === 0) return [];
    
    const startDate = new Date(historicalData[0].date);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const initialTasks = historicalData[0].totalTasks;
    
    return Array.from({ length: totalDays + 1 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const remainingTasks = Math.max(0, initialTasks - (initialTasks * i / totalDays));
      
      return {
        date: date.toISOString().split('T')[0],
        idealRemaining: Math.round(remainingTasks)
      };
    });
  };

  const idealData = generateIdealBurndown();
  
  const chartData = idealData.map(ideal => {
    const actual = historicalData.find(h => h.date === ideal.date);
    return {
      date: ideal.date,
      idealRemaining: ideal.idealRemaining,
      actualRemaining: actual?.remainingTasks || null,
      completionPercentage: actual?.completionPercentage || null
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
        <TrendingDown className="mr-2 h-5 w-5" />
        Project Burndown Chart
      </h3>
      
      <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Tracking {historicalData.length} days of progress</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis className="text-xs" />
          <Tooltip 
            labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg)', 
              border: '1px solid var(--tooltip-border)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="idealRemaining" 
            stroke="#94a3b8" 
            strokeDasharray="5 5"
            strokeWidth={2}
            name="Ideal Burndown" 
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="actualRemaining" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Actual Remaining Tasks" 
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
