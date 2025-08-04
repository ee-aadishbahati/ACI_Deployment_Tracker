import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  fabricId: string;
  taskId: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketProps {
  onTaskStateUpdate?: (fabricId: string, taskId: string, checked: boolean) => void;
  onTaskNotesUpdate?: (fabricId: string, taskId: string, notes: string) => void;
  onTaskCategoryUpdate?: (fabricId: string, taskId: string, category: string) => void;
}

export const useWebSocket = ({
  onTaskStateUpdate,
  onTaskNotesUpdate,
  onTaskCategoryUpdate,
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const IS_PRODUCTION = (import.meta as any).env.MODE === 'production' || 
                       (import.meta as any).env.PROD === true;

  const connect = () => {
    if (IS_PRODUCTION) {
      console.log('Production mode: WebSocket connection disabled');
      setIsConnected(false);
      return;
    }

    try {
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
      const wsUrl = apiUrl.replace('http', 'ws') + '/ws';
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'task_state_updated':
              onTaskStateUpdate?.(message.fabricId, message.taskId, message.data.checked);
              break;
            case 'task_notes_updated':
              onTaskNotesUpdate?.(message.fabricId, message.taskId, message.data.notes);
              break;
            case 'task_category_updated':
              onTaskCategoryUpdate?.(message.fabricId, message.taskId, message.data.category);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { isConnected };
};
