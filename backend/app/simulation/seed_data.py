import math
import random
from datetime import datetime, timedelta, date
from app.core.database import get_db, init_db
from app.core.config import settings

ROOMS_DATA = [
    {"id": "living_room", "name": "Living Room", "floor": "Ground Floor", "icon": "Sofa", "temp": 26.0, "occupancy": 1, "lux": 380.0},
    {"id": "bedroom", "name": "Master Bedroom", "floor": "First Floor", "icon": "Bed", "temp": 25.0, "occupancy": 1, "lux": 220.0},
    {"id": "kitchen", "name": "Kitchen", "floor": "Ground Floor", "icon": "Utensils", "temp": 28.0, "occupancy": 0, "lux": 450.0},
    {"id": "utility", "name": "Utility & Garden", "floor": "Ground Floor", "icon": "Wrench", "temp": 29.0, "occupancy": 0, "lux": 550.0}
]

APPLIANCES_DATA = [
    # Living Room
    {"id": "living_ac", "name": "Living Room AC (1.5 Ton)", "room_id": "living_room", "category": "HVAC", 
     "rated_w": 1500.0, "current_w": 1200.0, "status": "ON", "mode": "SMART", "baseline_w": 1150.0, 
     "baseline_m_kwh": 85.0, "budget_kwh": 90.0, "efficiency": "NORMAL", "relay": 1},
    {"id": "living_fan", "name": "Ceiling Fan", "room_id": "living_room", "category": "Motor", 
     "rated_w": 75.0, "current_w": 68.0, "status": "ON", "mode": "MANUAL", "baseline_w": 70.0, 
     "baseline_m_kwh": 32.0, "budget_kwh": 35.0, "efficiency": "EFFICIENT", "relay": 1},
    {"id": "living_tv", "name": "Smart OLED TV 55\"", "room_id": "living_room", "category": "Entertainment", 
     "rated_w": 120.0, "current_w": 95.0, "status": "ON", "mode": "MANUAL", "baseline_w": 95.0, 
     "baseline_m_kwh": 18.0, "budget_kwh": 20.0, "efficiency": "NORMAL", "relay": 1},
    {"id": "living_light", "name": "Living Ambient LED Array", "room_id": "living_room", "category": "Lighting", 
     "rated_w": 45.0, "current_w": 38.0, "status": "ON", "mode": "SMART", "baseline_w": 40.0, 
     "baseline_m_kwh": 14.0, "budget_kwh": 15.0, "efficiency": "EFFICIENT", "relay": 1},

    # Bedroom
    {"id": "bed_ac", "name": "Bedroom Inverter AC (1.0 Ton)", "room_id": "bedroom", "category": "HVAC", 
     "rated_w": 1100.0, "current_w": 0.0, "status": "OFF", "mode": "SMART", "baseline_w": 850.0, 
     "baseline_m_kwh": 55.0, "budget_kwh": 60.0, "efficiency": "EFFICIENT", "relay": 0},
    {"id": "bed_fan", "name": "Bedroom BLDC Fan", "room_id": "bedroom", "category": "Motor", 
     "rated_w": 35.0, "current_w": 0.0, "status": "OFF", "mode": "MANUAL", "baseline_w": 32.0, 
     "baseline_m_kwh": 15.0, "budget_kwh": 18.0, "efficiency": "EFFICIENT", "relay": 0},
    {"id": "bed_light", "name": "Bedroom Warm LED", "room_id": "bedroom", "category": "Lighting", 
     "rated_w": 25.0, "current_w": 0.0, "status": "OFF", "mode": "SMART", "baseline_w": 22.0, 
     "baseline_m_kwh": 8.0, "budget_kwh": 10.0, "efficiency": "EFFICIENT", "relay": 0},

    # Kitchen
    {"id": "kitchen_fridge", "name": "Inverter Refrigerator (340L)", "room_id": "kitchen", "category": "Kitchen", 
     "rated_w": 220.0, "current_w": 145.0, "status": "ON", "mode": "RECOMMENDATION", "baseline_w": 140.0, 
     "baseline_m_kwh": 44.0, "budget_kwh": 45.0, "efficiency": "NORMAL", "relay": 1},
    {"id": "kitchen_microwave", "name": "Convection Microwave", "room_id": "kitchen", "category": "Kitchen", 
     "rated_w": 1250.0, "current_w": 0.0, "status": "OFF", "mode": "MANUAL", "baseline_w": 1100.0, 
     "baseline_m_kwh": 12.0, "budget_kwh": 15.0, "efficiency": "NORMAL", "relay": 0},
    {"id": "kitchen_light", "name": "Kitchen Task Lighting", "room_id": "kitchen", "category": "Lighting", 
     "rated_w": 30.0, "current_w": 0.0, "status": "OFF", "mode": "SMART", "baseline_w": 28.0, 
     "baseline_m_kwh": 9.0, "budget_kwh": 10.0, "efficiency": "EFFICIENT", "relay": 0},

    # Utility
    {"id": "utility_washer", "name": "Front Load Washing Machine", "room_id": "utility", "category": "Appliance", 
     "rated_w": 550.0, "current_w": 0.0, "status": "OFF", "mode": "MANUAL", "baseline_w": 480.0, 
     "baseline_m_kwh": 16.0, "budget_kwh": 18.0, "efficiency": "NORMAL", "relay": 0},
    {"id": "utility_pump", "name": "Submersible Water Pump", "room_id": "utility", "category": "Motor", 
     "rated_w": 750.0, "current_w": 0.0, "status": "OFF", "mode": "SMART", "baseline_w": 720.0, 
     "baseline_m_kwh": 22.0, "budget_kwh": 25.0, "efficiency": "NEEDS_ATTENTION", "relay": 0},
    {"id": "utility_light", "name": "Utility LED Batten", "room_id": "utility", "category": "Lighting", 
     "rated_w": 20.0, "current_w": 0.0, "status": "OFF", "mode": "SMART", "baseline_w": 18.0, 
     "baseline_m_kwh": 5.0, "budget_kwh": 6.0, "efficiency": "EFFICIENT", "relay": 0},
]

def calculate_slab_cost(units_kwh: float) -> float:
    """Calculate billing cost using Indian slab tier rates."""
    slabs = [
        (100.0, 4.50),
        (200.0, 6.50),
        (400.0, 8.00),
        (float('inf'), 9.50)
    ]
    cost = 50.0  # Fixed charge
    remaining = units_kwh
    prev_limit = 0.0
    
    for limit, rate in slabs:
        slab_capacity = limit - prev_limit
        if remaining <= 0:
            break
        consumed_in_slab = min(remaining, slab_capacity)
        cost += consumed_in_slab * rate
        remaining -= consumed_in_slab
        prev_limit = limit
        
    return round(cost, 2)

def generate_seed_data(force: bool = False):
    """Populates 6 months of mathematically consistent synthetic energy data."""
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) FROM monthly_summary;")
        count = cursor.fetchone()[0]
        if count >= 6 and not force:
            print("[SEED] Database already contains 6+ months of historical data. Skipping seed.")
            return

        print("[SEED] Cleaning up existing tables for fresh mathematically consistent seed...")
        cursor.execute("DELETE FROM saving_events;")
        cursor.execute("DELETE FROM wastage_events;")
        cursor.execute("DELETE FROM anomalies;")
        cursor.execute("DELETE FROM recommendations;")
        cursor.execute("DELETE FROM notifications;")
        cursor.execute("DELETE FROM appliance_monthly;")
        cursor.execute("DELETE FROM monthly_summary;")
        cursor.execute("DELETE FROM daily_summary;")
        cursor.execute("DELETE FROM energy_readings;")
        cursor.execute("DELETE FROM appliances;")
        cursor.execute("DELETE FROM rooms;")

        # Insert Rooms
        for r in ROOMS_DATA:
            cursor.execute("""
            INSERT INTO rooms (id, name, floor, icon, target_temperature, current_temperature, occupancy, light_lux)
            VALUES (?, ?, ?, ?, 24.0, ?, ?, ?);
            """, (r["id"], r["name"], r["floor"], r["icon"], r["temp"], r["occupancy"], r["lux"]))

        # Insert Appliances
        for a in APPLIANCES_DATA:
            cursor.execute("""
            INSERT INTO appliances (
                id, name, room_id, category, rated_power_w, current_power_w, status, 
                control_mode, operating_hours_today, baseline_power_w, baseline_monthly_kwh, 
                monthly_budget_kwh, efficiency_status, virtual_relay_state, last_active_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4.5, ?, ?, ?, ?, ?, datetime('now', 'localtime'));
            """, (
                a["id"], a["name"], a["room_id"], a["category"], a["rated_w"], a["current_w"],
                a["status"], a["mode"], a["baseline_w"], a["baseline_m_kwh"], a["budget_kwh"],
                a["efficiency"], a["relay"]
            ))

        # 6-Month Baseline Definitions:
        # Months: April 2026, May 2026, June 2026, July 2026, August 2026, September 2026 (current)
        # August target total ~238 kWh
        # September target total ~267 kWh (or ~165 kWh so far up to day 19, projected 267 kWh)
        # Consistent with prompt section 8 and section 13!
        months_config = [
            {"year": 2026, "month": 4, "name": "April", "days": 30, "target_kwh": 271.0, "ac_mult": 1.15, "temp_avg": 33.5},
            {"year": 2026, "month": 5, "name": "May", "days": 31, "target_kwh": 289.0, "ac_mult": 1.30, "temp_avg": 36.2},
            {"year": 2026, "month": 6, "name": "June", "days": 30, "target_kwh": 267.0, "ac_mult": 1.12, "temp_avg": 32.8},
            {"year": 2026, "month": 7, "name": "July", "days": 31, "target_kwh": 248.0, "ac_mult": 0.95, "temp_avg": 30.1},
            {"year": 2026, "month": 8, "name": "August", "days": 31, "target_kwh": 238.0, "ac_mult": 0.88, "temp_avg": 29.4},
            {"year": 2026, "month": 9, "name": "September", "days": 30, "target_kwh": 267.0, "ac_mult": 1.10, "temp_avg": 31.5}
        ]

        # Monthly weights per appliance for August vs September as explicitly specified in prompt:
        # August: Total 238 kWh -> AC 72 kWh, Refrigerator 43 kWh, Fans (living+bed) 31 kWh, Lights 24 kWh, TV 18 kWh, Washer/Pump 50 kWh
        # September: Total 267 kWh -> AC 91 kWh, Refrigerator 45 kWh, Fans 34 kWh, Lights 22 kWh, TV 15 kWh, Washer/Pump 60 kWh
        appliance_monthly_targets = {
            8: {
                "living_ac": 52.0, "bed_ac": 20.0, "kitchen_fridge": 43.0, "living_fan": 20.0, "bed_fan": 11.0,
                "living_light": 10.0, "bed_light": 6.0, "kitchen_light": 5.0, "utility_light": 3.0,
                "living_tv": 18.0, "kitchen_microwave": 11.0, "utility_washer": 17.0, "utility_pump": 22.0
            },
            9: {
                "living_ac": 65.0, "bed_ac": 26.0, "kitchen_fridge": 45.0, "living_fan": 22.0, "bed_fan": 12.0,
                "living_light": 9.0, "bed_light": 5.0, "kitchen_light": 5.0, "utility_light": 3.0,
                "living_tv": 15.0, "kitchen_microwave": 13.0, "utility_washer": 20.0, "utility_pump": 27.0
            }
        }

        # Seed the 6 months
        for m_idx, m_cfg in enumerate(months_config):
            y = m_cfg["year"]
            m = m_cfg["month"]
            m_name = m_cfg["name"]
            num_days = m_cfg["days"]
            is_current_month = (y == 2026 and m == 9)
            active_days = 19 if is_current_month else num_days  # Up to September 19 today

            # Per-appliance monthly consumption tracking
            app_month_totals = {a["id"]: 0.0 for a in APPLIANCES_DATA}
            app_month_hours = {a["id"]: 0.0 for a in APPLIANCES_DATA}
            monthly_total_energy = 0.0
            monthly_total_cost = 0.0
            monthly_peak_power = 0.0
            monthly_energy_saved = 0.0

            # Daily simulation loop
            for d in range(1, active_days + 1):
                day_date_str = f"{y:04d}-{m:02d}-{d:02d}"
                day_total_energy = 0.0
                day_peak_power = 0.0
                day_peak_time = "14:30"
                occupied_energy = 0.0
                unoccupied_energy = 0.0
                day_energy_saved = round(random.uniform(0.8, 2.1), 2)
                monthly_energy_saved += day_energy_saved

                # Calculate appliance share for this day
                day_factor = (1.0 + 0.12 * math.sin(d * 0.45) + random.uniform(-0.04, 0.04))
                
                # Check if we have explicit target mapping for this month
                if m in appliance_monthly_targets:
                    base_dict = appliance_monthly_targets[m]
                else:
                    base_dict = {a["id"]: a["baseline_m_kwh"] * m_cfg["ac_mult"] if "ac" in a["id"] else a["baseline_m_kwh"] for a in APPLIANCES_DATA}

                for a in APPLIANCES_DATA:
                    aid = a["id"]
                    m_target_app = base_dict.get(aid, a["baseline_m_kwh"])
                    daily_app_kwh = round((m_target_app / num_days) * day_factor, 3)
                    
                    # Compute realistic peak wattage & operational hours
                    if "ac" in aid:
                        app_hours = round(daily_app_kwh / (a["rated_w"] * 0.75 / 1000.0), 2)
                        inst_power = a["rated_w"] * random.uniform(0.70, 0.92)
                    elif "fridge" in aid:
                        app_hours = round(random.uniform(9.0, 11.5), 2)
                        inst_power = a["rated_w"] * random.uniform(0.60, 0.85)
                    elif "light" in aid:
                        app_hours = round(daily_app_kwh / (a["rated_w"] / 1000.0), 2)
                        inst_power = a["rated_w"]
                    else:
                        app_hours = round(daily_app_kwh / (a["rated_w"] * 0.8 / 1000.0), 2)
                        inst_power = a["rated_w"] * random.uniform(0.75, 0.95)

                    app_month_totals[aid] += daily_app_kwh
                    app_month_hours[aid] += app_hours
                    day_total_energy += daily_app_kwh
                    if inst_power > day_peak_power:
                        day_peak_power = inst_power

                # Day summary calculations
                day_total_energy = round(day_total_energy, 3)
                day_cost = calculate_slab_cost(day_total_energy)
                occupied_energy = round(day_total_energy * 0.78, 3)
                unoccupied_energy = round(day_total_energy * 0.22, 3)
                co2_day = round(day_total_energy * settings.GRID_EMISSION_FACTOR_KG_PER_KWH, 2)

                cursor.execute("""
                INSERT INTO daily_summary (
                    date, total_energy_kwh, total_cost, peak_power_w, peak_time,
                    occupied_energy_kwh, unoccupied_energy_kwh, energy_saved_kwh, co2_emissions_kg
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    day_date_str, day_total_energy, day_cost, round(day_peak_power + 1200, 1),
                    day_peak_time, occupied_energy, unoccupied_energy, day_energy_saved, co2_day
                ))

                monthly_total_energy += day_total_energy
                if (day_peak_power + 1200) > monthly_peak_power:
                    monthly_peak_power = day_peak_power + 1200

            # Round month totals
            monthly_total_energy = round(monthly_total_energy, 2)
            monthly_total_cost = calculate_slab_cost(monthly_total_energy)
            avg_daily = round(monthly_total_energy / active_days, 2)
            co2_month = round(monthly_total_energy * settings.GRID_EMISSION_FACTOR_KG_PER_KWH, 2)

            cursor.execute("""
            INSERT INTO monthly_summary (
                year, month, month_name, total_energy_kwh, total_cost, peak_power_w,
                avg_daily_kwh, energy_saved_kwh, co2_emissions_kg, target_kwh
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                y, m, m_name, monthly_total_energy, monthly_total_cost, round(monthly_peak_power, 1),
                avg_daily, round(monthly_energy_saved, 2), co2_month, m_cfg["target_kwh"]
            ))

            # Store per-appliance monthly rollups (STRICT MATHEMATICAL CONSISTENCY)
            # Rebalance so sum of appliances exactly equals monthly_total_energy
            raw_sum = sum(app_month_totals.values())
            scale = monthly_total_energy / raw_sum if raw_sum > 0 else 1.0

            for aid, raw_val in app_month_totals.items():
                adj_kwh = round(raw_val * scale, 2)
                app_cost = round((adj_kwh / monthly_total_energy) * monthly_total_cost, 2) if monthly_total_energy > 0 else 0.0
                cursor.execute("""
                INSERT INTO appliance_monthly (year, month, appliance_id, total_energy_kwh, total_cost, operating_hours)
                VALUES (?, ?, ?, ?, ?, ?);
                """, (y, m, aid, adj_kwh, app_cost, round(app_month_hours[aid], 1)))

        # Now generate detailed 15-minute readings for today (September 19, 2026)
        today_date_str = "2026-09-19"
        base_dt = datetime(2026, 9, 19, 0, 0, 0)
        
        # 15-min intervals for today (up to 12:00 noon)
        intervals = 48  # 12 hours * 4
        for step in range(intervals):
            ts = base_dt + timedelta(minutes=step * 15)
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
            hour = ts.hour
            minute = ts.minute

            # Temperature and occupancy profiles
            ambient_temp = 24.0 + 7.0 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 18 else 24.0
            is_occupied = 1 if (hour >= 7 and hour <= 23) else 0

            for a in APPLIANCES_DATA:
                aid = a["id"]
                p_w = 0.0
                status = "OFF"

                # Behavioural profile
                if aid == "kitchen_fridge":
                    # Fridge cycles: ON 20 min, OFF 20 min
                    status = "ON" if (step % 3 != 0) else "OFF"
                    p_w = a["rated_w"] * random.uniform(0.65, 0.85) if status == "ON" else 4.0
                elif aid == "living_ac":
                    if hour >= 10:
                        status = "ON"
                        p_w = a["rated_w"] * random.uniform(0.72, 0.88)
                elif aid == "living_fan":
                    if hour >= 7:
                        status = "ON"
                        p_w = a["rated_w"] * random.uniform(0.85, 0.95)
                elif aid == "living_tv":
                    if hour in [8, 9, 11, 12]:
                        status = "ON"
                        p_w = a["rated_w"] * random.uniform(0.75, 0.90)
                elif aid == "utility_pump":
                    if hour == 6 and minute < 45:
                        status = "ON"
                        p_w = a["rated_w"] * 0.95
                elif aid == "utility_washer":
                    if hour == 8 and minute < 45:
                        status = "ON"
                        p_w = a["rated_w"] * 0.80
                elif "light" in aid:
                    if hour >= 6 and hour <= 9:
                        status = "ON"
                        p_w = a["rated_w"]
                    elif hour < 6:
                        status = "OFF"
                        p_w = 0.0

                e_kwh = round((p_w / 1000.0) * 0.25, 4)  # 15 minutes = 0.25h
                current_a = round(p_w / 230.0, 2)
                lux = 450.0 if hour >= 8 else 50.0

                cursor.execute("""
                INSERT INTO energy_readings (
                    timestamp, appliance_id, room_id, power_w, energy_kwh,
                    voltage_v, current_a, temperature_c, occupancy, light_lux, status
                ) VALUES (?, ?, ?, ?, ?, 230.0, ?, ?, ?, ?, ?);
                """, (
                    ts_str, aid, a["room_id"], round(p_w, 1), e_kwh,
                    current_a, round(ambient_temp, 1), is_occupied, lux, status
                ))

        # Seed Realistic Anomalies
        cursor.execute("""
        INSERT INTO anomalies (timestamp, appliance_id, room_name, appliance_name, detected_power_w, baseline_power_w, severity, description, status)
        VALUES 
        ('2026-09-19 11:15:00', 'living_ac', 'Living Room', 'Living Room AC (1.5 Ton)', 1780.0, 1200.0, 'HIGH', 'Abnormal compressor load: AC drawing 1780W (48% above baseline). Possible refrigerant leakage or condenser fouling.', 'ACTIVE'),
        ('2026-09-18 16:30:00', 'utility_pump', 'Utility & Garden', 'Submersible Water Pump', 920.0, 750.0, 'MEDIUM', 'Unusual continuous load: Water pump ran 35% above rated current. Possible dry-run or pipe blockage.', 'RESOLVED'),
        ('2026-09-17 14:00:00', 'kitchen_fridge', 'Kitchen', 'Inverter Refrigerator (340L)', 290.0, 145.0, 'LOW', 'Compressor duty cycle extended beyond 90 minutes. Door seal check recommended.', 'RESOLVED');
        """)

        # Seed Realistic Wastage Events
        cursor.execute("""
        INSERT INTO wastage_events (timestamp, room_id, room_name, appliance_id, appliance_name, duration_minutes, wasted_kwh, estimated_cost, action_taken, status)
        VALUES 
        ('2026-09-19 10:30:00', 'living_room', 'Living Room', 'living_light', 'Living Ambient LED Array', 42, 0.032, 0.24, 'ALERT_ONLY', 'DETECTED'),
        ('2026-09-19 09:15:00', 'bedroom', 'Master Bedroom', 'bed_fan', 'Bedroom BLDC Fan', 65, 0.038, 0.28, 'AUTO_OFF', 'RESOLVED'),
        ('2026-09-18 15:45:00', 'living_room', 'Living Room', 'living_tv', 'Smart OLED TV 55\"', 80, 0.127, 0.95, 'AUTO_OFF', 'RESOLVED'),
        ('2026-09-17 13:10:00', 'living_room', 'Living Room', 'living_ac', 'Living Room AC (1.5 Ton)', 35, 0.700, 5.25, 'AUTO_OFF', 'RESOLVED');
        """)

        # Seed Savings Verification Ledger
        cursor.execute("""
        INSERT INTO saving_events (timestamp, appliance_id, appliance_name, action_type, power_before_w, power_after_w, power_diff_w, energy_saved_kwh, cost_saved, verified)
        VALUES
        ('2026-09-19 09:15:00', 'bed_fan', 'Bedroom BLDC Fan', 'VIRTUAL_RELAY_AUTO_OFF', 35.0, 0.0, 35.0, 0.038, 0.28, 1),
        ('2026-09-18 15:45:00', 'living_tv', 'Smart OLED TV 55\"', 'VIRTUAL_RELAY_AUTO_OFF', 95.0, 0.0, 95.0, 0.127, 0.95, 1),
        ('2026-09-17 13:10:00', 'living_ac', 'Living Room AC (1.5 Ton)', 'VIRTUAL_RELAY_AUTO_OFF', 1200.0, 0.0, 1200.0, 0.700, 5.25, 1),
        ('2026-09-16 23:30:00', 'living_light', 'Living Ambient LED Array', 'SCHEDULE_CUTOFF', 45.0, 0.0, 45.0, 0.225, 1.69, 1),
        ('2026-09-15 14:00:00', 'bed_ac', 'Bedroom Inverter AC (1.0 Ton)', 'MANUAL_OPTIMIZATION', 1050.0, 800.0, 250.0, 0.750, 5.62, 1);
        """)

        # Seed AI Recommendations
        cursor.execute("""
        INSERT INTO recommendations (timestamp, category, severity, title, description, potential_saving_kwh, potential_saving_cost, status)
        VALUES
        ('2026-09-19 11:30:00', 'BEHAVIORAL', 'HIGH', 'Adjust Living Room AC Setpoint (+1°C)', 'Increasing AC temperature from 23°C to 24°C can reduce compressor load by 6%, saving ~18 kWh/month.', 18.0, 135.0, 'NEW'),
        ('2026-09-19 08:00:00', 'AUTOMATION', 'MEDIUM', 'Enable Empty-Room Auto-Off Relay', 'Living room lights remained on 42 minutes with zero occupancy today. Auto-off eliminates ~9.5 kWh/month.', 9.5, 71.25, 'NEW'),
        ('2026-09-18 12:00:00', 'EQUIPMENT', 'LOW', 'Inspect Submersible Pump Vane & Impeller', 'Submersible pump operating at 18.7% above baseline power curve. Cleaning impeller could save 12 kWh/month.', 12.0, 90.0, 'NEW'),
        ('2026-09-17 09:00:00', 'TARGET', 'MEDIUM', 'Projected Target Exceedance Alert', 'Current September projection is 276 kWh versus your 260 kWh target. Implement recommended controls to stay within target.', 16.0, 120.0, 'NEW');
        """)

        # Seed Notifications
        cursor.execute("""
        INSERT INTO notifications (timestamp, title, message, severity, is_read, category)
        VALUES
        ('2026-09-19 11:15:00', 'High AC Anomaly Detected', 'Living Room AC drawing 1780W (48% above baseline). Check filter.', 'CRITICAL', 0, 'ANOMALY'),
        ('2026-09-19 10:30:00', 'Wastage Warning', 'Living room lighting left ON for 42 minutes with zero occupancy.', 'WARNING', 0, 'WASTAGE'),
        ('2026-09-19 09:15:00', 'Smart Saving Auto-Off', 'Bedroom Fan turned OFF automatically after vacancy timeout. Saved 0.038 kWh.', 'SUCCESS', 1, 'AUTOMATION'),
        ('2026-09-19 00:00:00', 'Daily Summary Ready', 'Yesterday consumed 8.92 kWh (₹66.90). Energy saved: 1.45 kWh.', 'INFO', 1, 'REPORT');
        """)

        conn.commit()
        print("[SEED] Successfully seeded 6 months of mathematically consistent energy data!")

if __name__ == "__main__":
    generate_seed_data(force=True)
