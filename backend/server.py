from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="RDP Manager API", description="API for managing RDP connections")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Enums
class RDPStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CONNECTING = "connecting"
    ERROR = "error"

class OSType(str, Enum):
    WINDOWS = "windows"
    LINUX = "linux"
    MACOS = "macos"


# Define Models
class RDPServer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    host: str
    port: int = 3389
    username: str
    password: str
    domain: Optional[str] = None
    os_type: OSType = OSType.WINDOWS
    description: Optional[str] = None
    status: RDPStatus = RDPStatus.INACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RDPServerCreate(BaseModel):
    name: str
    host: str
    port: int = 3389
    username: str
    password: str
    domain: Optional[str] = None
    os_type: OSType = OSType.WINDOWS
    description: Optional[str] = None

class RDPServerUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    domain: Optional[str] = None
    os_type: Optional[OSType] = None
    description: Optional[str] = None

class RDPConnection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    server_id: str
    session_id: str
    status: RDPStatus = RDPStatus.CONNECTING
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None

class ConnectionCreate(BaseModel):
    server_id: str


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "RDP Manager API is running"}

# RDP Server endpoints
@api_router.post("/rdp-servers", response_model=RDPServer)
async def create_rdp_server(server: RDPServerCreate):
    server_dict = server.dict()
    server_obj = RDPServer(**server_dict)
    await db.rdp_servers.insert_one(server_obj.dict())
    return server_obj

@api_router.get("/rdp-servers", response_model=List[RDPServer])
async def get_rdp_servers():
    servers = await db.rdp_servers.find().to_list(1000)
    return [RDPServer(**server) for server in servers]

@api_router.get("/rdp-servers/{server_id}", response_model=RDPServer)
async def get_rdp_server(server_id: str):
    server = await db.rdp_servers.find_one({"id": server_id})
    if not server:
        raise HTTPException(status_code=404, detail="RDP Server not found")
    return RDPServer(**server)

@api_router.put("/rdp-servers/{server_id}", response_model=RDPServer)
async def update_rdp_server(server_id: str, server_update: RDPServerUpdate):
    server = await db.rdp_servers.find_one({"id": server_id})
    if not server:
        raise HTTPException(status_code=404, detail="RDP Server not found")
    
    update_data = server_update.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.rdp_servers.update_one(
            {"id": server_id}, 
            {"$set": update_data}
        )
    
    updated_server = await db.rdp_servers.find_one({"id": server_id})
    return RDPServer(**updated_server)

@api_router.delete("/rdp-servers/{server_id}")
async def delete_rdp_server(server_id: str):
    result = await db.rdp_servers.delete_one({"id": server_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RDP Server not found")
    return {"message": "RDP Server deleted successfully"}

# RDP Connection endpoints
@api_router.post("/connections", response_model=RDPConnection)
async def create_connection(connection: ConnectionCreate):
    # Check if server exists
    server = await db.rdp_servers.find_one({"id": connection.server_id})
    if not server:
        raise HTTPException(status_code=404, detail="RDP Server not found")
    
    # Create connection record
    session_id = str(uuid.uuid4())
    connection_obj = RDPConnection(
        server_id=connection.server_id,
        session_id=session_id
    )
    await db.rdp_connections.insert_one(connection_obj.dict())
    
    # Update server status
    await db.rdp_servers.update_one(
        {"id": connection.server_id},
        {"$set": {"status": RDPStatus.ACTIVE, "updated_at": datetime.utcnow()}}
    )
    
    return connection_obj

@api_router.get("/connections", response_model=List[RDPConnection])
async def get_connections():
    connections = await db.rdp_connections.find().to_list(1000)
    return [RDPConnection(**connection) for connection in connections]

@api_router.get("/connections/active", response_model=List[RDPConnection])
async def get_active_connections():
    connections = await db.rdp_connections.find({
        "status": {"$in": [RDPStatus.ACTIVE, RDPStatus.CONNECTING]}
    }).to_list(1000)
    return [RDPConnection(**connection) for connection in connections]

@api_router.delete("/connections/{connection_id}")
async def end_connection(connection_id: str):
    connection = await db.rdp_connections.find_one({"id": connection_id})
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Update connection status
    await db.rdp_connections.update_one(
        {"id": connection_id},
        {"$set": {"status": RDPStatus.INACTIVE, "ended_at": datetime.utcnow()}}
    )
    
    # Update server status if no other active connections
    active_connections = await db.rdp_connections.count_documents({
        "server_id": connection["server_id"],
        "status": {"$in": [RDPStatus.ACTIVE, RDPStatus.CONNECTING]}
    })
    
    if active_connections == 0:
        await db.rdp_servers.update_one(
            {"id": connection["server_id"]},
            {"$set": {"status": RDPStatus.INACTIVE, "updated_at": datetime.utcnow()}}
        )
    
    return {"message": "Connection ended successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
