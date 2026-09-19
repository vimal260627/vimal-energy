from fastapi import APIRouter
from typing import Dict, Any, List
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import DashboardResponse, KPICards, ChartDataPoint, ApplianceBreakdownItem, RoomSchema, ApplianceSchema
from app.simulation.seed_data import calculate_slab_cost

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_data():
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Fetch Today's stats from latest daily_summary
        cursor.execute("SELECT * FROM daily_summary ORDER BY date DESC LIMIT 1;")
        today_row = cursor.fetchone()
        today_energy = round(today_row["total_energy_kwh"], 2) if today_row else 8.42
        energy_saved_today = round(today_row["energy_saved_kwh"], 2) if today_row else 2.15

        # 2. Fetch Current Month stats (September 2026)
        cursor.execute("""
        SELECT SUM(total_energy_kwh) as total_kwh, 
               SUM(energy_saved_kwh) as total_saved,
               MAX(peak_power_w) as peak_power,
               COUNT(*) as days_count
        FROM daily_summary 
        WHERE date LIKE '2026-09-%';
        """)
        month_agg = cursor.fetchone()
        this_month_energy = round(month_agg["total_kwh"] or 165.4, 2)
        total_energy_saved = round(month_agg["total_saved"] or 32.6, 2)
        peak_power_w = round(month_agg["peak_power"] or 3240.0, 1)

        # 3. Calculate Estimated Cost
        estimated_cost = calculate_slab_cost(this_month_energy)

        # 4. Monthly Target & Projected End
        cursor.execute("SELECT value FROM settings WHERE key = 'monthly_target_kwh';")
        target_row = cursor.fetchone()
        target_kwh = float(target_row["value"]) if target_row else settings.DEFAULT_MONTHLY_TARGET_KWH
        target_pct = round((this_month_energy / target_kwh) * 100, 1)

        days_elapsed = month_agg["days_count"] or 19
        avg_daily = this_month_energy / days_elapsed if days_elapsed > 0 else 8.7
        projected_month_end = round(this_month_energy + (avg_daily * (30 - days_elapsed)), 1)

        # Energy Score calculation based on target adherence & active anomalies
        if projected_month_end <= target_kwh:
            energy_score = "Efficient"
        elif projected_month_end <= (target_kwh * 1.15):
            energy_score = "Normal"
        else:
            energy_score = "Needs Attention"

        # 5. Active Appliances count and list
        cursor.execute("""
        SELECT a.*, r.name as room_name 
        FROM appliances a
        JOIN rooms r ON a.room_id = r.id;
        """)
        all_apps = [dict(r) for r in cursor.fetchall()]
        active_apps = [a for a in all_apps if a["status"] == "ON"]
        active_count = len(active_apps)

        # 6. Rooms List
        cursor.execute("SELECT * FROM rooms;")
        rooms = [RoomSchema(**dict(r)) for r in cursor.fetchall()]

        # 7. Recent Trend for Chart (Hourly for today)
        cursor.execute("""
        SELECT timestamp, power_w, energy_kwh 
        FROM energy_readings 
        WHERE timestamp LIKE '2026-09-19%'
        ORDER BY timestamp ASC;
        """)
        readings = cursor.fetchall()
        
        # Aggregate hourly
        hourly_map: Dict[str, Dict[str, float]] = {}
        for r in readings:
            hour_str = r["timestamp"][11:13] + ":00"
            if hour_str not in hourly_map:
                hourly_map[hour_str] = {"power_w": 0.0, "energy_kwh": 0.0, "count": 0}
            hourly_map[hour_str]["power_w"] += r["power_w"]
            hourly_map[hour_str]["energy_kwh"] += r["energy_kwh"]
            hourly_map[hour_str]["count"] += 1

        recent_trend = []
        for h, v in hourly_map.items():
            recent_trend.append(ChartDataPoint(
                time=h,
                energy_kwh=round(v["energy_kwh"], 3),
                power_w=round(v["power_w"] / max(1, v["count"]), 1),
                cost=round(v["energy_kwh"] * settings.DEFAULT_TARIFF_PER_KWH, 2)
            ))
        if not recent_trend:
            # Fallback curve if readings empty
            recent_trend = [
                ChartDataPoint(time=f"{h:02d}:00", energy_kwh=round(0.3 + 0.1 * math.sin(h/3), 2), power_w=850.0, cost=2.5)
                for h in range(13)
            ]

        # 8. Appliance Breakdown (Current month share)
        cursor.execute("""
        SELECT am.total_energy_kwh, am.total_cost, a.id, a.name, a.category, r.name as room_name
        FROM appliance_monthly am
        JOIN appliances a ON am.appliance_id = a.id
        JOIN rooms r ON a.room_id = r.id
        WHERE am.year = 2026 AND am.month = 9
        ORDER BY am.total_energy_kwh DESC;
        """)
        breakdown_rows = cursor.fetchall()
        appliance_breakdown = []
        for b in breakdown_rows:
            pct = round((b["total_energy_kwh"] / max(1.0, this_month_energy)) * 100, 1)
            appliance_breakdown.append(ApplianceBreakdownItem(
                id=b["id"],
                name=b["name"],
                room=b["room_name"],
                energy_kwh=round(b["total_energy_kwh"], 2),
                percentage=pct,
                cost=round(b["total_cost"], 2),
                category=b["category"]
            ))

        # 9. Active anomalies & wastage count
        cursor.execute("SELECT COUNT(*) FROM anomalies WHERE status = 'ACTIVE';")
        active_anomalies_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM wastage_events WHERE status = 'DETECTED';")
        active_wastage_count = cursor.fetchone()[0]

        # 10. Quick recommendation
        cursor.execute("SELECT description FROM recommendations WHERE severity = 'HIGH' LIMIT 1;")
        rec_row = cursor.fetchone()
        quick_rec = rec_row["description"] if rec_row else "Adjust Living Room AC setpoint (+1°C) to save ~18 kWh this month."

        kpi_obj = KPICards(
            today_energy_kwh=today_energy,
            this_month_energy_kwh=this_month_energy,
            estimated_cost=estimated_cost,
            energy_saved_kwh=total_energy_saved,
            peak_power_kw=round(peak_power_w / 1000.0, 2),
            active_appliances=active_count,
            monthly_target_kwh=target_kwh,
            target_percentage_used=target_pct,
            projected_month_end_kwh=projected_month_end,
            energy_score=energy_score,
            simulation_mode="ACTIVE"
        )

        return DashboardResponse(
            kpis=kpi_obj,
            recent_trend=recent_trend,
            appliance_breakdown=appliance_breakdown,
            active_appliances_list=[ApplianceSchema(**a) for a in active_apps],
            rooms=rooms,
            quick_recommendation=quick_rec,
            active_anomalies_count=active_anomalies_count,
            active_wastage_count=active_wastage_count
        )
