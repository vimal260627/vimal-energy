from typing import Dict, List, Any, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings

class WastageEngine:
    def __init__(self):
        self.default_delay_mins = settings.WASTAGE_OCCUPANCY_TIMEOUT_MINUTES
        self.threshold_w = settings.WASTAGE_POWER_THRESHOLD_W

    def evaluate_room(self, room_id: str, occupancy: int, duration_mins: int = 25) -> List[Dict[str, Any]]:
        """
        Evaluates whether appliances in an unoccupied room represent energy wastage.
        If room is unoccupied (occupancy == 0) and appliances are running > threshold,
        generates wastage events and optionally triggers auto-off in SMART mode.
        """
        detected_events = []
        if occupancy > 0:
            return detected_events

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT a.id, a.name, a.room_id, a.current_power_w, a.control_mode,
                   a.status, a.virtual_relay_state, r.name as room_name
            FROM appliances a
            JOIN rooms r ON a.room_id = r.id
            WHERE a.room_id = ? AND a.status = 'ON' AND a.current_power_w >= ?;
            """, (room_id, self.threshold_w))
            appliances = cursor.fetchall()

            for app in appliances:
                aid = app["id"]
                power_w = app["current_power_w"]
                room_name = app["room_name"]
                app_name = app["name"]
                mode = app["control_mode"]

                # Calculate wasted kWh
                wasted_kwh = round((power_w / 1000.0) * (duration_mins / 60.0), 3)
                wasted_cost = round(wasted_kwh * settings.DEFAULT_TARIFF_PER_KWH, 2)
                action_taken = "AUTO_OFF" if mode == "SMART" else "ALERT_ONLY"
                event_status = "RESOLVED" if mode == "SMART" else "DETECTED"

                # Check if there is already an active detected event for this appliance
                cursor.execute("""
                SELECT id FROM wastage_events 
                WHERE appliance_id = ? AND status = 'DETECTED';
                """, (aid,))
                existing = cursor.fetchone()
                
                if not existing:
                    cursor.execute("""
                    INSERT INTO wastage_events (
                        timestamp, room_id, room_name, appliance_id, appliance_name,
                        duration_minutes, wasted_kwh, estimated_cost, action_taken, status
                    ) VALUES (datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, (
                        room_id, room_name, aid, app_name, duration_mins,
                        wasted_kwh, wasted_cost, action_taken, event_status
                    ))

                    # If mode is SMART, auto-turn off appliance and record saving verification event
                    if mode == "SMART":
                        # Turn off appliance
                        cursor.execute("""
                        UPDATE appliances 
                        SET status = 'OFF', current_power_w = 0.0, virtual_relay_state = 0 
                        WHERE id = ?;
                        """, (aid,))

                        # Log saving verification event
                        saved_kwh = wasted_kwh
                        cost_saved = wasted_cost
                        cursor.execute("""
                        INSERT INTO saving_events (
                            timestamp, appliance_id, appliance_name, action_type,
                            power_before_w, power_after_w, power_diff_w, energy_saved_kwh, cost_saved, verified
                        ) VALUES (datetime('now', 'localtime'), ?, ?, 'VIRTUAL_RELAY_AUTO_OFF', ?, 0.0, ?, ?, ?, 1);
                        """, (aid, app_name, power_w, power_w, saved_kwh, cost_saved))

                    detected_events.append({
                        "appliance_id": aid,
                        "appliance_name": app_name,
                        "room_name": room_name,
                        "duration_minutes": duration_mins,
                        "wasted_kwh": wasted_kwh,
                        "estimated_cost": wasted_cost,
                        "action_taken": action_taken,
                        "status": event_status
                    })

            conn.commit()

        return detected_events

    def get_all_wastage_events(self) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, timestamp, room_id, room_name, appliance_id, appliance_name,
                   duration_minutes, wasted_kwh, estimated_cost, action_taken, status
            FROM wastage_events
            ORDER BY timestamp DESC;
            """)
            return [dict(r) for r in cursor.fetchall()]

    def resolve_wastage(self, event_id: int) -> Dict[str, Any]:
        """User clicks 'Apply Smart Saving' on an alert."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM wastage_events WHERE id = ?;", (event_id,))
            event = cursor.fetchone()
            if not event:
                raise ValueError("Wastage event not found.")

            aid = event["appliance_id"]
            app_name = event["appliance_name"]
            
            # Fetch current appliance power
            cursor.execute("SELECT current_power_w FROM appliances WHERE id = ?;", (aid,))
            app_row = cursor.fetchone()
            power_before = app_row["current_power_w"] if app_row else 50.0

            # Turn off appliance
            cursor.execute("UPDATE appliances SET status = 'OFF', current_power_w = 0.0, virtual_relay_state = 0 WHERE id = ?;", (aid,))
            
            # Update event
            cursor.execute("UPDATE wastage_events SET action_taken = 'AUTO_OFF', status = 'RESOLVED' WHERE id = ?;", (event_id,))

            # Add to savings verification ledger
            saved_kwh = event["wasted_kwh"]
            cost_saved = event["estimated_cost"]
            cursor.execute("""
            INSERT INTO saving_events (
                timestamp, appliance_id, appliance_name, action_type,
                power_before_w, power_after_w, power_diff_w, energy_saved_kwh, cost_saved, verified
            ) VALUES (datetime('now', 'localtime'), ?, ?, 'MANUAL_OPTIMIZATION', ?, 0.0, ?, ?, ?, 1);
            """, (aid, app_name, power_before, power_before, saved_kwh, cost_saved))

            # Also increment daily_summary energy_saved
            cursor.execute("""
            UPDATE daily_summary 
            SET energy_saved_kwh = energy_saved_kwh + ?
            WHERE date = date('now', 'localtime');
            """, (saved_kwh,))

            conn.commit()
            return {"status": "success", "message": f"{app_name} turned OFF. Saved {saved_kwh} kWh ({settings.DEFAULT_CURRENCY}{cost_saved})."}

wastage_engine = WastageEngine()
