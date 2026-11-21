import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db import init_db
from services.scheduler import start_scheduler, stop_scheduler

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    init_db()
    # Start APScheduler background worker
    start_scheduler()
    yield
    # Graceful shutdown
    stop_scheduler()

app = FastAPI(
    title="Actioned API",
    description="Meetings that remember what they decided - AI + Backend Core",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "actioned-backend",
        "version": "0.1.0"
    }

@app.post("/dev/seed", tags=["Development"])
async def trigger_seed():
    from seed import seed_demo_data
    seed_demo_data()
    return {"status": "seeded", "message": "Demo meetings 1 & 2 seeded successfully into SQLite and ChromaDB."}

@app.post("/dev/reset", tags=["Development"])
async def trigger_reset():
    from seed import reset_all
    reset_all()
    return {"status": "reset", "message": "Database and vector memory wiped clean."}

# Include API routers
from api.meetings import router as meetings_router
from api.decisions import router as decisions_router
from api.digest import router as digest_router

app.include_router(meetings_router)
app.include_router(decisions_router)
app.include_router(digest_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
