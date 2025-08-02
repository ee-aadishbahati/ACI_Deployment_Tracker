import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

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

  const connect = () => {
    try {
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
      const wsUrl = apiUrl.replace('http', 'ws') + '/ws';
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        logger.info('WebSocket connected');
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
          logger.error('Error parsing WebSocket message', error);
        }
      };

      wsRef.current.onclose = () => {
        logger.info('WebSocket disconnected');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        logger.error('WebSocket error', error);
      };
    } catch (error) {
      logger.error('Failed to connect WebSocket', error);
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
