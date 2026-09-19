from fastapi import APIRouter, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings
from app.ai.comparison_engine import comparison_engine
from app.simulation.seed_data import calculate_slab_cost

router = APIRouter(prefix="/energy", tags=["Energy Analytics"])

@router.get("/chart")
def get_energy_chart(granularity: str = Query("hourly", enum=["hourly", "daily", "weekly", "monthly"])):
    """Returns aggregated energy and power for interactive main chart."""
    with get_db() as conn:
        cursor = conn.cursor()

        if granularity == "hourly":
            cursor.execute("""
            SELECT timestamp, power_w, energy_kwh 
            FROM energy_readings 
            WHERE timestamp LIKE '2026-09-19%'
            ORDER BY timestamp ASC;
            """)
            rows = cursor.fetchall()
            hourly_map: Dict[str, Dict[str, float]] = {}
            for r in rows:
                h = r["timestamp"][11:13] + ":00"
                if h not in hourly_map:
                    hourly_map[h] = {"power_w": 0.0, "energy_kwh": 0.0, "count": 0}
                hourly_map[h]["power_w"] += r["power_w"]
                hourly_map[h]["energy_kwh"] += r["energy_kwh"]
                hourly_map[h]["count"] += 1

            return [
                {
                    "time": h,
                    "energy_kwh": round(v["energy_kwh"], 3),
                    "power_w": round(v["power_w"] / max(1, v["count"]), 1),
                    "cost": round(v["energy_kwh"] * settings.DEFAULT_TARIFF_PER_KWH, 2)
                }
                for h, v in hourly_map.items()
            ]

        elif granularity == "daily":
            cursor.execute("""
            SELECT date, total_energy_kwh, peak_power_w, total_cost 
            FROM daily_summary 
            WHERE date >= '2026-09-01'
            ORDER BY date ASC;
            """)
            rows = cursor.fetchall()
            return [
                {
                    "time": r["date"][5:],  # "09-12"
                    "energy_kwh": round(r["total_energy_kwh"], 2),
                    "power_w": round(r["peak_power_w"], 1),
                    "cost": round(r["total_cost"], 2)
                }
                for r in rows
            ]

        elif granularity == "weekly":
            # Group daily data by week
            cursor.execute("""
            SELECT date, total_energy_kwh, peak_power_w, total_cost 
            FROM daily_summary 
            WHERE date >= '2026-07-01'
            ORDER BY date ASC;
            """)
            rows = cursor.fetchall()
            weekly_map: Dict[str, Dict[str, float]] = {}
            for r in rows:
                d_obj = datetime.strptime(r["date"], "%Y-%m-%d")
                w_str = f"Wk {d_obj.isocalendar()[1]}"
                if w_str not in weekly_map:
                    weekly_map[w_str] = {"energy_kwh": 0.0, "power_w": 0.0, "cost": 0.0}
                weekly_map[w_str]["energy_kwh"] += r["total_energy_kwh"]
                weekly_map[w_str]["cost"] += r["total_cost"]
                if r["peak_power_w"] > weekly_map[w_str]["power_w"]:
                    weekly_map[w_str]["power_w"] = r["peak_power_w"]

            return [
                {
                    "time": w,
                    "energy_kwh": round(v["energy_kwh"], 2),
                    "power_w": round(v["power_w"], 1),
                    "cost": round(v["cost"], 2)
                }
                for w, v in list(weekly_map.items())[-8:]
            ]

        elif granularity == "monthly":
            cursor.execute("""
            SELECT month_name, total_energy_kwh, peak_power_w, total_cost 
            FROM monthly_summary 
            ORDER BY year ASC, month ASC;
            """)
            rows = cursor.fetchall()
            return [
                {
                    "time": r["month_name"][:3],
                    "energy_kwh": round(r["total_energy_kwh"], 2),
                    "power_w": round(r["peak_power_w"], 1),
                    "cost": round(r["total_cost"], 2)
                }
                for r in rows
            ]

@router.get("/monthly")
def get_monthly_history():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM monthly_summary ORDER BY year ASC, month ASC;")
        return [dict(r) for r in cursor.fetchall()]

@router.get("/comparison")
def get_monthly_comparison(
    year1: int = Query(2026),
    month1: int = Query(8),
    year2: int = Query(2026),
    month2: int = Query(9)
):
    """Mandatory feature: 2-month comparison with dynamic natural language AI explanation."""
    return comparison_engine.compare_months(year1, month1, year2, month2)

@router.get("/budgets")
def get_appliance_budgets():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.id, a.name, a.category, a.monthly_budget_kwh,
               COALESCE(am.total_energy_kwh, a.baseline_monthly_kwh) as actual_kwh,
               r.name as room_name
        FROM appliances a
        JOIN rooms r ON a.room_id = r.id
        LEFT JOIN appliance_monthly am ON (a.id = am.appliance_id AND am.year = 2026 AND am.month = 9);
        """)
        rows = cursor.fetchall()

        budgets = []
        for r in rows:
            budget = r["monthly_budget_kwh"]
            actual = round(r["actual_kwh"], 2)
            remaining = round(budget - actual, 2)
            pct_used = round((actual / budget * 100), 1) if budget > 0 else 0.0
            status = "EXCEEDED" if remaining < 0 else ("WARNING" if pct_used >= 85 else "ON_TRACK")

            budgets.append({
                "id": r["id"],
                "name": r["name"],
                "room": r["room_name"],
                "category": r["category"],
                "budget_kwh": budget,
                "actual_kwh": actual,
                "remaining_kwh": remaining,
                "percentage_used": pct_used,
                "status": status
            })

        return budgets

@router.get("/savings")
def get_savings_verification():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM saving_events ORDER BY timestamp DESC;
        """)
        events = [dict(r) for r in cursor.fetchall()]

        total_saved_kwh = sum(e["energy_saved_kwh"] for e in events)
        total_cost_saved = sum(e["cost_saved"] for e in events)

        return {
            "total_saved_kwh": round(total_saved_kwh, 3),
            "total_cost_saved": round(total_cost_saved, 2),
            "verified_actions_count": len(events),
            "events": events
        }

@router.get("/tariff-bill")
def get_tariff_bill():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(total_energy_kwh) FROM daily_summary WHERE date LIKE '2026-09-%';")
        curr_units = cursor.fetchone()[0] or 165.4

        cursor.execute("SELECT total_energy_kwh, total_cost FROM monthly_summary WHERE year = 2026 AND month = 8;")
        prev = cursor.fetchone()
        prev_units = prev["total_energy_kwh"] if prev else 238.0
        prev_bill = prev["total_cost"] if prev else 1785.0

        curr_bill = calculate_slab_cost(curr_units)
        diff_bill = round(curr_bill - prev_bill, 2)

        return {
            "current_units_kwh": round(curr_units, 2),
            "current_estimated_bill": curr_bill,
            "previous_units_kwh": round(prev_units, 2),
            "previous_bill": prev_bill,
            "difference": diff_bill,
            "currency": settings.DEFAULT_CURRENCY,
            "slabs": [
                {"tier": "0 - 100 kWh", "rate": "₹4.50 / unit"},
                {"tier": "101 - 200 kWh", "rate": "₹6.50 / unit"},
                {"tier": "201 - 400 kWh", "rate": "₹8.00 / unit"},
                {"tier": "> 400 kWh", "rate": "₹9.50 / unit"}
            ],
            "fixed_charge": settings.FIXED_MONTHLY_CHARGE
        }
