import sqlite3
import json
import logging
from pathlib import Path
from contextlib import contextmanager
from typing import Generator, Any, List, Dict, Optional
from app.core.config import settings, DB_PATH

logger = logging.getLogger("energy_db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise e
    finally:
        conn.close()

def init_db():
    """Create all required tables with indexes."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Rooms
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            floor TEXT DEFAULT 'Ground Floor',
            icon TEXT DEFAULT 'Home',
            target_temperature REAL DEFAULT 24.0,
            current_temperature REAL DEFAULT 26.5,
            occupancy INTEGER DEFAULT 1,
            light_lux REAL DEFAULT 350.0
        );
        """)
        
        # 2. Appliances
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appliances (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            room_id TEXT NOT NULL,
            category TEXT NOT NULL,
            rated_power_w REAL NOT NULL,
            current_power_w REAL NOT NULL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'OFF',
            control_mode TEXT NOT NULL DEFAULT 'MANUAL',
            operating_hours_today REAL DEFAULT 0.0,
            baseline_power_w REAL NOT NULL,
            baseline_monthly_kwh REAL NOT NULL,
            monthly_budget_kwh REAL NOT NULL,
            efficiency_status TEXT NOT NULL DEFAULT 'NORMAL',
            virtual_relay_state INTEGER NOT NULL DEFAULT 0,
            last_active_time TEXT,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        );
        """)
        
        # 3. Energy Readings (Time-series telemetry)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS energy_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            appliance_id TEXT NOT NULL,
            room_id TEXT NOT NULL,
            power_w REAL NOT NULL,
            energy_kwh REAL NOT NULL,
            voltage_v REAL NOT NULL DEFAULT 230.0,
            current_a REAL NOT NULL DEFAULT 0.0,
            temperature_c REAL DEFAULT 25.0,
            occupancy INTEGER DEFAULT 1,
            light_lux REAL DEFAULT 300.0,
            status TEXT NOT NULL DEFAULT 'ON',
            FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON energy_readings(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_readings_appliance ON energy_readings(appliance_id, timestamp);")

        # 4. Daily Summary
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            total_energy_kwh REAL NOT NULL,
            total_cost REAL NOT NULL,
            peak_power_w REAL NOT NULL,
            peak_time TEXT,
            occupied_energy_kwh REAL NOT NULL,
            unoccupied_energy_kwh REAL NOT NULL,
            energy_saved_kwh REAL NOT NULL DEFAULT 0.0,
            co2_emissions_kg REAL NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_summary(date);")

        # 5. Monthly Summary
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS monthly_summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            month_name TEXT NOT NULL,
            total_energy_kwh REAL NOT NULL,
            total_cost REAL NOT NULL,
            peak_power_w REAL NOT NULL,
            avg_daily_kwh REAL NOT NULL,
            energy_saved_kwh REAL NOT NULL DEFAULT 0.0,
            co2_emissions_kg REAL NOT NULL,
            target_kwh REAL NOT NULL,
            UNIQUE(year, month)
        );
        """)

        # 6. Appliance Monthly Aggregates (Strict mathematical consistency)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appliance_monthly (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            appliance_id TEXT NOT NULL,
            total_energy_kwh REAL NOT NULL,
            total_cost REAL NOT NULL,
            operating_hours REAL NOT NULL,
            FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE,
            UNIQUE(year, month, appliance_id)
        );
        """)

        # 7. Anomalies (Isolation Forest & Rule Based)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            appliance_id TEXT NOT NULL,
            room_name TEXT NOT NULL,
            appliance_name TEXT NOT NULL,
            detected_power_w REAL NOT NULL,
            baseline_power_w REAL NOT NULL,
            severity TEXT NOT NULL DEFAULT 'MEDIUM',
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE
        );
        """)

        # 8. Wastage Events (Empty room + loads ON)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS wastage_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            room_id TEXT NOT NULL,
            room_name TEXT NOT NULL,
            appliance_id TEXT NOT NULL,
            appliance_name TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            wasted_kwh REAL NOT NULL,
            estimated_cost REAL NOT NULL,
            action_taken TEXT NOT NULL DEFAULT 'ALERT_ONLY',
            status TEXT NOT NULL DEFAULT 'DETECTED',
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE
        );
        """)

        # 9. Saving Events (Savings Verification Ledger)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS saving_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            appliance_id TEXT NOT NULL,
            appliance_name TEXT NOT NULL,
            action_type TEXT NOT NULL,
            power_before_w REAL NOT NULL,
            power_after_w REAL NOT NULL,
            power_diff_w REAL NOT NULL,
            energy_saved_kwh REAL NOT NULL,
            cost_saved REAL NOT NULL,
            verified INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE
        );
        """)

        # 10. Recommendations
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            category TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'INFO',
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            potential_saving_kwh REAL NOT NULL,
            potential_saving_cost REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'NEW'
        );
        """)

        # 11. Settings (Key-Value)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """)

        # 12. Notifications
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'INFO',
            is_read INTEGER NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT 'SYSTEM'
        );
        """)

        # Insert default settings if not exists
        default_settings = {
            "currency": settings.DEFAULT_CURRENCY,
            "tariff_per_kwh": str(settings.DEFAULT_TARIFF_PER_KWH),
            "fixed_charge": str(settings.FIXED_MONTHLY_CHARGE),
            "use_slab": "true" if settings.USE_SLAB_TARIFF else "false",
            "monthly_target_kwh": str(settings.DEFAULT_MONTHLY_TARGET_KWH),
            "emission_factor": str(settings.GRID_EMISSION_FACTOR_KG_PER_KWH),
            "wastage_timeout_mins": str(settings.WASTAGE_OCCUPANCY_TIMEOUT_MINUTES),
            "simulation_mode": "ACTIVE",
            "simulation_speed": "1.0"
        }
        for k, v in default_settings.items():
            cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);", (k, v))

        conn.commit()
        logger.info("Database initialized successfully.")
