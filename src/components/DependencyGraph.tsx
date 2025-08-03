import { Network } from 'lucide-react';

interface DependencyGraphProps {
  fabricId?: string;
  sectionId?: string;
}

export function DependencyGraph({ }: DependencyGraphProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Network className="mr-2 h-5 w-5" />
          Task Dependency Graph
        </h3>
      </div>
      
      <div style={{ height: '500px' }} className="flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Network className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Dependency Graph Temporarily Disabled</p>
          <p className="text-sm">Missing @xyflow/react dependency</p>
          <p className="text-xs mt-2">This component is disabled for testing purposes</p>
        </div>
      </div>
    </div>
  );
}
