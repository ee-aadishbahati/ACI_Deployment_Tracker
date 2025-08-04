from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.models import AppData, TaskStateUpdate, TaskNotesUpdate, TaskCategoryUpdate
from app.database import db
from app.websocket_manager import manager

app = FastAPI(title="ACI Deployment Tracker Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://ee-aadishbahati.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "ACI Deployment Tracker Backend", "version": "1.0.0"}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/data", response_model=AppData)
async def get_all_data():
    """Get all application data (equivalent to localStorage.getItem)"""
    return db.get_all_data()

@app.put("/api/data", response_model=AppData)
async def update_all_data(data: AppData):
    """Update all application data (equivalent to localStorage.setItem)"""
    return db.update_all_data(data)

@app.patch("/api/fabric/{fabric_id}/task/{task_id}/state", response_model=AppData)
async def update_task_state(fabric_id: str, task_id: str, update: TaskStateUpdate):
    """Update task completion status"""
    updated_data = db.update_task_state(fabric_id, task_id, update.checked)
    
    await manager.broadcast_task_state_update(fabric_id, task_id, update.checked)
    
    return updated_data

@app.patch("/api/fabric/{fabric_id}/task/{task_id}/notes", response_model=AppData)
async def update_task_notes(fabric_id: str, task_id: str, update: TaskNotesUpdate):
    """Update task notes"""
    updated_data = db.update_task_notes(fabric_id, task_id, update.notes)
    
    await manager.broadcast_task_notes_update(fabric_id, task_id, update.notes)
    
    return updated_data

@app.patch("/api/fabric/{fabric_id}/task/{task_id}/category", response_model=AppData)
async def update_task_category(fabric_id: str, task_id: str, update: TaskCategoryUpdate):
    """Update task category"""
    updated_data = db.update_task_category(fabric_id, task_id, update.category)
    
    await manager.broadcast_task_category_update(fabric_id, task_id, update.category)
    
    return updated_data

@app.patch("/api/fabric/{fabric_id}/current")
async def set_current_fabric(fabric_id: str):
    """Set current fabric"""
    return db.set_current_fabric(fabric_id)

@app.post("/api/initialize", response_model=AppData)
async def initialize_backend_data(initialization_data: dict):
    """Initialize backend with task structure from frontend"""
    return db.initialize_with_frontend_data(initialization_data)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
