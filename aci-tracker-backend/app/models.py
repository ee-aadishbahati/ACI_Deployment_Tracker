from pydantic import BaseModel
from typing import Dict, Optional, Any, List
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

class User(BaseModel):
    """User model for collaboration features"""
    id: str
    username: str
    email: str
    displayName: str
    role: str
    fabricAccess: List[str]
    avatar: Optional[str] = None
    isOnline: Optional[bool] = False

class TaskComment(BaseModel):
    """Task comment model"""
    id: str
    taskId: str
    fabricId: str
    userId: str
    content: str
    mentions: List[str] = []
    timestamp: datetime
    parentCommentId: Optional[str] = None
    edited: Optional[datetime] = None
    attachments: List[str] = []

class Notification(BaseModel):
    """Notification model"""
    id: str
    userId: str
    type: str
    taskId: str
    fabricId: str
    message: str
    read: bool = False
    timestamp: datetime
    fromUserId: Optional[str] = None

class TaskTemplate(BaseModel):
    """Task template model"""
    id: str
    name: str
    description: str
    tasks: List[Any] = []
    fabricType: Optional[str] = None
    siteType: Optional[str] = None
    createdBy: str
    createdAt: datetime
    tags: List[str] = []

class AppData(BaseModel):
    """Complete application data structure matching localStorage format"""
    fabricStates: Dict[str, Dict[str, bool]] = {}
    fabricNotes: Dict[str, Dict[str, str]] = {}
    fabricCompletionDates: Dict[str, Dict[str, str]] = {}
    fabricNoteModificationDates: Dict[str, Dict[str, str]] = {}
    testCaseStates: Dict[str, Dict[str, Any]] = {}
    taskCategories: Dict[str, Dict[str, str]] = {}
    taskKanbanStatus: Dict[str, Dict[str, str]] = {}
    subChecklists: Dict[str, Any] = {}
    currentFabric: Optional[str] = None
    users: Dict[str, User] = {}
    currentUser: Optional[str] = None
    taskComments: Dict[str, List[TaskComment]] = {}
    notifications: List[Notification] = []
    taskTemplates: List[TaskTemplate] = []
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

class TaskKanbanStatusUpdate(BaseModel):
    """Request model for updating task kanban status"""
    kanbanStatus: str

class CommentCreate(BaseModel):
    """Request model for creating a comment"""
    content: str
    mentions: List[str] = []
    parentCommentId: Optional[str] = None

class CommentUpdate(BaseModel):
    """Request model for updating a comment"""
    content: str

class CloneTasksRequest(BaseModel):
    """Request model for cloning tasks across fabrics"""
    taskIds: List[str]
    sourceFabricId: str
    targetFabricIds: List[str]

class WebSocketMessage(BaseModel):
    """WebSocket message format for real-time updates"""
    type: str
    fabricId: str
    taskId: str
    data: Any
    timestamp: datetime
