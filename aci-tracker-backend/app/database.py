import threading
from datetime import datetime
from typing import Dict, Any, Optional
from app.models import AppData

class InMemoryDatabase:
    """Thread-safe in-memory database for storing application data"""
    
    def __init__(self):
        self._data = AppData()
        self._lock = threading.RLock()
    
    def get_all_data(self) -> AppData:
        """Get complete application data"""
        with self._lock:
            return self._data.model_copy(deep=True)
    
    def update_all_data(self, data: AppData) -> AppData:
        """Update complete application data"""
        with self._lock:
            data.lastSaved = datetime.now()
            self._data = data.model_copy(deep=True)
            return self._data.model_copy(deep=True)
    
    def update_task_state(self, fabric_id: str, task_id: str, checked: bool) -> AppData:
        """Update task completion state"""
        with self._lock:
            if fabric_id not in self._data.fabricStates:
                self._data.fabricStates[fabric_id] = {}
            
            if checked:
                self._data.fabricStates[fabric_id][task_id] = True
            else:
                self._data.fabricStates[fabric_id].pop(task_id, None)
            
            self._data.lastSaved = datetime.now()
            return self._data.model_copy(deep=True)
    
    def update_task_notes(self, fabric_id: str, task_id: str, notes: str) -> AppData:
        """Update task notes"""
        with self._lock:
            if fabric_id not in self._data.fabricNotes:
                self._data.fabricNotes[fabric_id] = {}
            
            if notes.strip():
                self._data.fabricNotes[fabric_id][task_id] = notes
            else:
                self._data.fabricNotes[fabric_id].pop(task_id, None)
            
            self._data.lastSaved = datetime.now()
            return self._data.model_copy(deep=True)
    
    def update_task_category(self, fabric_id: str, task_id: str, category: str) -> AppData:
        """Update task category"""
        with self._lock:
            if fabric_id not in self._data.taskCategories:
                self._data.taskCategories[fabric_id] = {}
            
            if category and category != "No Priority":
                self._data.taskCategories[fabric_id][task_id] = category
            else:
                self._data.taskCategories[fabric_id].pop(task_id, None)
            
            self._data.lastSaved = datetime.now()
            return self._data.model_copy(deep=True)
    
    def set_current_fabric(self, fabric_id: str) -> AppData:
        """Set current fabric"""
        with self._lock:
            self._data.currentFabric = fabric_id
            self._data.lastSaved = datetime.now()
            return self._data.model_copy(deep=True)

db = InMemoryDatabase()
