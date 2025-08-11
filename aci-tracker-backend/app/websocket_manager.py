import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import WebSocket
from app.models import WebSocketMessage

class ConnectionManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast_message(self, message: WebSocketMessage):
        """Broadcast message to all connected clients"""
        message_data = message.model_dump_json()
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_data)
            except Exception:
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_task_state_update(self, fabric_id: str, task_id: str, checked: bool):
        """Broadcast task state update"""
        message = WebSocketMessage(
            type="task_state_updated",
            fabricId=fabric_id,
            taskId=task_id,
            data={"checked": checked},
            timestamp=datetime.now()
        )
        await self.broadcast_message(message)
    
    async def broadcast_task_notes_update(self, fabric_id: str, task_id: str, notes: str):
        """Broadcast task notes update"""
        message = WebSocketMessage(
            type="task_notes_updated",
            fabricId=fabric_id,
            taskId=task_id,
            data={"notes": notes},
            timestamp=datetime.now()
        )
        await self.broadcast_message(message)
    
    async def broadcast_task_category_update(self, fabric_id: str, task_id: str, category: str):
        """Broadcast task category update"""
        message = WebSocketMessage(
            type="task_category_updated",
            fabricId=fabric_id,
            taskId=task_id,
            data={"category": category},
            timestamp=datetime.now()
        )
        await self.broadcast_message(message)
    
    async def broadcast_task_kanban_update(self, fabric_id: str, task_id: str, kanban_status: str):
        """Broadcast task kanban status update"""
        message = WebSocketMessage(
            type="task_kanban_updated",
            fabricId=fabric_id,
            taskId=task_id,
            data={"kanbanStatus": kanban_status},
            timestamp=datetime.now()
        )
        await self.broadcast_message(message)

manager = ConnectionManager()
