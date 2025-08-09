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
    
    def initialize_with_frontend_data(self, frontend_data: dict) -> AppData:
        """Initialize backend with task structure from frontend, preserving existing data"""
        with self._lock:
            fabrics = frontend_data.get('fabrics', [])
            sections = frontend_data.get('sections', [])
            existing_data = frontend_data.get('existingData', {})
            
            if existing_data:
                print('Merging existing localStorage data into backend')
                if existing_data.get('fabricStates'):
                    for fabric_id, fabric_states in existing_data['fabricStates'].items():
                        if fabric_id not in self._data.fabricStates:
                            self._data.fabricStates[fabric_id] = {}
                        self._data.fabricStates[fabric_id].update(fabric_states)
                
                if existing_data.get('fabricNotes'):
                    for fabric_id, fabric_notes in existing_data['fabricNotes'].items():
                        if fabric_id not in self._data.fabricNotes:
                            self._data.fabricNotes[fabric_id] = {}
                        self._data.fabricNotes[fabric_id].update(fabric_notes)
                
                if existing_data.get('fabricCompletionDates'):
                    for fabric_id, completion_dates in existing_data['fabricCompletionDates'].items():
                        if fabric_id not in self._data.fabricCompletionDates:
                            self._data.fabricCompletionDates[fabric_id] = {}
                        self._data.fabricCompletionDates[fabric_id].update(completion_dates)
                
                if existing_data.get('fabricNoteModificationDates'):
                    for fabric_id, mod_dates in existing_data['fabricNoteModificationDates'].items():
                        if fabric_id not in self._data.fabricNoteModificationDates:
                            self._data.fabricNoteModificationDates[fabric_id] = {}
                        self._data.fabricNoteModificationDates[fabric_id].update(mod_dates)
                
                if existing_data.get('taskCategories'):
                    for fabric_id, categories in existing_data['taskCategories'].items():
                        if fabric_id not in self._data.taskCategories:
                            self._data.taskCategories[fabric_id] = {}
                        self._data.taskCategories[fabric_id].update(categories)
                
                if existing_data.get('testCaseStates'):
                    for fabric_id, test_states in existing_data['testCaseStates'].items():
                        if fabric_id not in self._data.testCaseStates:
                            self._data.testCaseStates[fabric_id] = {}
                        self._data.testCaseStates[fabric_id].update(test_states)
                
                if existing_data.get('subChecklists'):
                    self._data.subChecklists.update(existing_data['subChecklists'])
                
                if existing_data.get('currentFabric'):
                    self._data.currentFabric = existing_data['currentFabric']
            
            for fabric in fabrics:
                fabric_id = fabric.get('id')
                if fabric_id and fabric_id not in self._data.fabricStates:
                    self._data.fabricStates[fabric_id] = {}
                    self._data.fabricNotes[fabric_id] = {}
                    self._data.fabricCompletionDates[fabric_id] = {}
                    self._data.fabricNoteModificationDates[fabric_id] = {}
                    self._data.taskCategories[fabric_id] = {}
            
            for section in sections:
                section_id = section.get('id')
                if section_id:
                    for subsection in section.get('subsections', []):
                        for task in subsection.get('tasks', []):
                            task_id = task.get('id')
                            if task_id:
                                for fabric in fabrics:
                                    fabric_id = fabric.get('id')
                                    if fabric_id:
                                        if task_id not in self._data.fabricStates[fabric_id]:
                                            self._data.fabricStates[fabric_id][task_id] = False
            
            if not self._data.currentFabric and fabrics:
                self._data.currentFabric = fabrics[0].get('id')
            
            self._data.lastSaved = datetime.now()
            return self._data.model_copy(deep=True)

db = InMemoryDatabase()
