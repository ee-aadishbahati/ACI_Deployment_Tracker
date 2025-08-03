import { useCallback, useMemo, useState } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  ConnectionMode,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '../contexts/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { Network, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DependencyGraphProps {
  fabricId?: string;
  sectionId?: string;
}

export function DependencyGraph({ fabricId, sectionId }: DependencyGraphProps) {
  const { state } = useApp();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const targetFabricId = fabricId || state.currentFabric;

  useWebSocket({
    onTaskStateUpdate: () => setLastUpdate(Date.now()),
    onTaskNotesUpdate: () => setLastUpdate(Date.now()),
    onTaskCategoryUpdate: () => setLastUpdate(Date.now()),
  });

  const autoLayoutNodes = useCallback((nodes: Node[], edges: Edge[]): Node[] => {
    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, string[]>();
    
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      outEdges.set(node.id, []);
    });
    
    edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      outEdges.get(edge.source)?.push(edge.target);
    });
    
    const layers: string[][] = [];
    const queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const currentLayer = [...queue];
      queue.length = 0;
      layers.push(currentLayer);
      
      currentLayer.forEach(nodeId => {
        visited.add(nodeId);
        outEdges.get(nodeId)?.forEach(targetId => {
          const newInDegree = (inDegree.get(targetId) || 0) - 1;
          inDegree.set(targetId, newInDegree);
          if (newInDegree === 0 && !visited.has(targetId)) {
            queue.push(targetId);
          }
        });
      });
    }
    
    const layerHeight = 120;
    const nodeWidth = 180;
    
    return nodes.map(node => {
      const layerIndex = layers.findIndex(layer => layer.includes(node.id));
      const positionInLayer = layers[layerIndex]?.indexOf(node.id) || 0;
      const layerSize = layers[layerIndex]?.length || 1;
      
      return {
        ...node,
        position: {
          x: positionInLayer * nodeWidth - (layerSize * nodeWidth) / 2,
          y: layerIndex * layerHeight
        }
      };
    });
  }, []);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];
    
    state.sections.forEach(section => {
      if (sectionId && section.id !== sectionId) return;
      
      section.subsections.forEach(subsection => {
        subsection.tasks.forEach(task => {
          if (!task.testCase) return;
          
          const fabric = state.fabrics.find(f => f.id === targetFabricId);
          if (!fabric) return;
          
          if (!(task.fabricSpecific || 
                (task.ndoCentralized && fabric.site === 'Tertiary') ||
                (!task.fabricSpecific && !task.ndoCentralized))) {
            return;
          }

          const testCaseState = state.testCaseStates[targetFabricId]?.[task.testCase.tcId];
          const isCompleted = testCaseState?.status === 'Pass';
          const taskCompleted = state.fabricStates[targetFabricId]?.[task.id] || false;
          
          const nodeId = task.testCase.tcId;
          const nodeColor = isCompleted ? '#10b981' : 
                           task.testCase.priority === 'High' ? '#ef4444' : 
                           task.testCase.priority === 'Medium' ? '#f59e0b' : '#6b7280';
          
          nodeMap.set(nodeId, {
            id: nodeId,
            type: 'default',
            position: { x: 0, y: 0 },
            data: {
              label: (
                <div className="p-2 text-center">
                  <div className="flex items-center justify-center mb-1">
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : taskCompleted ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xs font-medium">{task.testCase.tcId}</div>
                  <div className="text-xs text-gray-600 max-w-32 truncate">
                    {task.text}
                  </div>
                  <div className="text-xs mt-1">
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      task.testCase.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.testCase.priority}
                    </span>
                  </div>
                </div>
              )
            },
            style: {
              background: nodeColor,
              color: 'white',
              border: '2px solid #1f2937',
              borderRadius: '8px',
              width: 150,
              fontSize: '12px'
            }
          });

          if (task.testCase.dependencies) {
            task.testCase.dependencies.forEach(depId => {
              edgeList.push({
                id: `${depId}-${nodeId}`,
                source: depId,
                target: nodeId,
                type: 'smoothstep',
                animated: !isCompleted,
                style: {
                  stroke: isCompleted ? '#10b981' : '#6b7280',
                  strokeWidth: 2
                }
              });
            });
          }
        });
      });
    });

    const nodes = Array.from(nodeMap.values());
    const layoutNodes = autoLayoutNodes(nodes, edgeList);
    
    return { nodes: layoutNodes, edges: edgeList };
  }, [state.sections, state.testCaseStates, state.fabricStates, targetFabricId, sectionId, state.fabrics, lastUpdate]);

  const [nodesState, , onNodesChange] = useNodesState(nodes);
  const [edgesState, , onEdgesChange] = useEdgesState(edges);

  if (nodes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Network className="h-8 w-8 mx-auto mb-2" />
            <p>No task dependencies found for this fabric</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Network className="mr-2 h-5 w-5" />
          Task Dependency Graph
        </h3>
      </div>
      
      <div style={{ height: '500px' }}>
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionMode={ConnectionMode.Strict}
          fitView
          className="dark:bg-gray-900"
        >
          <Background className="dark:bg-gray-900" />
          <Controls className="dark:bg-gray-800 dark:border-gray-600" />
          <Panel position="top-right" className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Task Done</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-gray-700 dark:text-gray-300">Pending</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
