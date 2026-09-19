from typing import Dict, List, Any, Optional
from datetime import datetime
from app.core.database import get_db

try:
    from sklearn.ensemble import IsolationForest
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class ApplianceAnomalyDetector:
    def __init__(self):
        self.contamination = 0.05

    def check_reading(self, appliance_id: str, power_w: float, hour: int = 12) -> Optional[Dict[str, Any]]:
        """
        Analyzes a single live reading against learned distributions.
        Returns anomaly record dictionary if out of bounds, else None.
        """
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT a.name, a.baseline_power_w, a.rated_power_w, r.name as room_name
            FROM appliances a
            JOIN rooms r ON a.room_id = r.id
            WHERE a.id = ?;
            """, (appliance_id,))
            row = cursor.fetchone()
            if not row:
                return None

            app_name = row["name"]
            baseline_w = row["baseline_power_w"]
            rated_w = row["rated_power_w"]
            room_name = row["room_name"]

        # Anomaly logic:
        # If power > 1.25 * rated power -> HIGH anomaly
        # If power > 1.35 * baseline and power > 100W -> MEDIUM/HIGH anomaly
        ratio = power_w / baseline_w if baseline_w > 0 else 1.0

        if power_w > (rated_w * 1.15) or ratio > 1.45:
            severity = "HIGH"
            diff_pct = round((ratio - 1.0) * 100, 1)
            description = (
                f"Abnormal power draw detected: {app_name} operating at {power_w:.1f} W "
                f"({diff_pct}% above learned baseline of {baseline_w:.0f} W). "
                f"Check appliance operating conditions (e.g. coil blockage, mechanical drag, or voltage sag)."
            )
            return {
                "appliance_id": appliance_id,
                "appliance_name": app_name,
                "room_name": room_name,
                "detected_power_w": power_w,
                "baseline_power_w": baseline_w,
                "severity": severity,
                "description": description,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        elif ratio > 1.25 and power_w > 50.0:
            severity = "MEDIUM"
            diff_pct = round((ratio - 1.0) * 100, 1)
            description = (
                f"Unusual consumption pattern: {app_name} consuming {power_w:.1f} W "
                f"({diff_pct}% above baseline). Possible efficiency issue or elevated ambient heat load."
            )
            return {
                "appliance_id": appliance_id,
                "appliance_name": app_name,
                "room_name": room_name,
                "detected_power_w": power_w,
                "baseline_power_w": baseline_w,
                "severity": severity,
                "description": description,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        elif ratio > 1.15 and power_w > 50.0:
            severity = "LOW"
            diff_pct = round((ratio - 1.0) * 100, 1)
            description = (
                f"Mild baseline deviation: {app_name} operating {diff_pct}% above normal baseline."
            )
            return {
                "appliance_id": appliance_id,
                "appliance_name": app_name,
                "room_name": room_name,
                "detected_power_w": power_w,
                "baseline_power_w": baseline_w,
                "severity": severity,
                "description": description,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

        return None

    def get_all_anomalies(self) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, timestamp, appliance_id, room_name, appliance_name,
                   detected_power_w, baseline_power_w, severity, description, status
            FROM anomalies
            ORDER BY timestamp DESC;
            """)
            return [dict(r) for r in cursor.fetchall()]

anomaly_detector = ApplianceAnomalyDetector()
