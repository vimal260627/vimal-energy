import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "energy_system.db"

class Settings:
    PROJECT_NAME: str = "AI-Based Smart Energy Saver & Appliance-Level Management System"
    VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Financial & Tariffs
    DEFAULT_CURRENCY: str = "₹"
    DEFAULT_TARIFF_PER_KWH: float = 7.50  # Flat rate default
    FIXED_MONTHLY_CHARGE: float = 50.0
    USE_SLAB_TARIFF: bool = True
    
    # Slab definition: [(max_kwh, rate_per_kwh)]
    TARIFF_SLABS = [
        (100, 4.50),
        (200, 6.50),
        (400, 8.00),
        (float('inf'), 9.50)
    ]
    
    # Energy Targets & Thresholds
    DEFAULT_MONTHLY_TARGET_KWH: float = 260.0
    GRID_EMISSION_FACTOR_KG_PER_KWH: float = 0.82  # India average grid factor
    
    # Wastage Detection
    WASTAGE_OCCUPANCY_TIMEOUT_MINUTES: int = 15
    WASTAGE_POWER_THRESHOLD_W: float = 20.0  # Powers above this in unoccupied room count as wastage
    
    # Simulation
    SIMULATION_INTERVAL_SECONDS: int = 3  # Ticker step

settings = Settings()
