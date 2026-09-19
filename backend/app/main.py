import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.simulation.seed_data import generate_seed_data
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_appliances import router as appliances_router
from app.api.routes_energy import router as energy_router
from app.api.routes_ai import router as ai_router
from app.api.routes_simulation import router as simulation_router
from app.api.routes_settings import router as settings_router
from app.api.routes_reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database is seeded with consistent historical data
    try:
        generate_seed_data(force=False)
    except Exception as e:
        print(f"[STARTUP] Seed check: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Smart Energy Saver & Intelligent Appliance-Level Energy Management System REST API",
    lifespan=lifespan
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(appliances_router, prefix=settings.API_V1_PREFIX)
app.include_router(energy_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "SIMULATION_MODE",
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }

@app.get("/api/health")
def health_check():
    return {"status": "HEALTHY", "simulation": "ACTIVE"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
