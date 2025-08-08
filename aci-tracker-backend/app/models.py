from pydantic import BaseModel
from typing import Dict, Optional, Any
from datetime import datetime

class FabricState(BaseModel):
    """Task completion states for a specific fabric"""
    pass

class FabricNotes(BaseModel):
    """Task notes for a specific fabric"""
    pass

class TestCaseStates(BaseModel):
    """Test case execution states for fabrics"""
    pass

class TaskCategories(BaseModel):
    """Task priority categories for fabrics"""
    pass

class SubChecklists(BaseModel):
    """Sub-checklists for fabrics"""
    pass

class AppData(BaseModel):
    """Complete application data structure matching localStorage format"""
    fabricStates: Dict[str, Dict[str, bool]] = {}
    fabricNotes: Dict[str, Dict[str, str]] = {}
    fabricCompletionDates: Dict[str, Dict[str, str]] = {}
    fabricNoteModificationDates: Dict[str, Dict[str, str]] = {}
    testCaseStates: Dict[str, Dict[str, Any]] = {}
    taskCategories: Dict[str, Dict[str, str]] = {}
    subChecklists: Dict[str, Any] = {}
    currentFabric: Optional[str] = None
    lastSaved: Optional[datetime] = None

class TaskStateUpdate(BaseModel):
    """Request model for updating task completion state"""
    checked: bool

class TaskNotesUpdate(BaseModel):
    """Request model for updating task notes"""
    notes: str

class TaskCategoryUpdate(BaseModel):
    """Request model for updating task category"""
    category: str

class WebSocketMessage(BaseModel):
    """WebSocket message format for real-time updates"""
    type: str
    fabricId: str
    taskId: str
    data: Any
    timestamp: datetime
