# Standalone test runner
import sqlite3
from app.core.config import settings
from app.core.database import get_db
from app.simulation.seed_data import generate_seed_data, calculate_slab_cost
from app.simulation.engine import simulation_engine
from app.ai.anomaly_detector import anomaly_detector
from app.ai.wastage_engine import wastage_engine
from app.ai.forecaster import forecaster
from app.ai.comparison_engine import comparison_engine

def test_database_mathematical_consistency():
    """Verify that sum of all appliances equals the monthly summary total."""
    generate_seed_data(force=False)
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Test for August 2026
        cursor.execute("SELECT total_energy_kwh FROM monthly_summary WHERE year = 2026 AND month = 8;")
        month_total = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(total_energy_kwh) FROM appliance_monthly WHERE year = 2026 AND month = 8;")
        app_sum = cursor.fetchone()[0]
        
        assert abs(month_total - app_sum) < 0.1, f"Mismatch: monthly={month_total}, sum_appliances={app_sum}"

def test_slab_tariff_calculation():
    """Verify billing calculations for tier brackets."""
    # 50 kWh: 50 * 4.50 + 50 fixed = 275
    cost_50 = calculate_slab_cost(50.0)
    assert cost_50 == 275.0, f"Expected 275.0, got {cost_50}"
    
    # 150 kWh: 100 * 4.50 (450) + 50 * 6.50 (325) + 50 fixed = 825.0
    cost_150 = calculate_slab_cost(150.0)
    assert cost_150 == 825.0, f"Expected 825.0, got {cost_150}"

def test_anomaly_detection():
    """Verify Isolation Forest flags excessive power draw."""
    # Normal living AC baseline is ~1200W. 1780W is +48%
    anomaly = anomaly_detector.check_reading("living_ac", 1780.0)
    assert anomaly is not None, "Expected anomaly to be detected"
    assert anomaly["severity"] in ["HIGH", "MEDIUM"]
    assert "Abnormal" in anomaly["description"] or "Unusual" in anomaly["description"]

def test_wastage_detection_empty_room():
    """Verify wastage engine flags loads running in unoccupied room."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE appliances SET status = 'ON', current_power_w = 45.0 WHERE id = 'living_light';")
        conn.commit()

    events = wastage_engine.evaluate_room("living_room", occupancy=0, duration_mins=30)
    assert len(events) > 0, "Expected wastage event for empty room with active light"
    assert events[0]["wasted_kwh"] > 0

def test_simulation_toggle_and_savings_verification():
    """Verify toggling virtual relay updates state and creates savings ledger entry."""
    # Turn ON first
    res_on = simulation_engine.toggle_appliance("bed_ac", "ON")
    assert res_on["status"] == "ON"
    assert res_on["current_power_w"] > 0

    # Turn OFF -> should verify savings
    res_off = simulation_engine.toggle_appliance("bed_ac", "OFF")
    assert res_off["status"] == "OFF"
    assert res_off["current_power_w"] == 0.0

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM saving_events WHERE appliance_id = 'bed_ac' ORDER BY timestamp DESC LIMIT 1;")
        row = cursor.fetchone()
        assert row is not None, "Expected saving event to be recorded"
        assert row["energy_saved_kwh"] > 0

def test_forecaster_output():
    """Verify forecaster produces 24h and 7d points."""
    pred = forecaster.predict(target_kwh=260.0)
    assert len(pred["next_24h"]) == 24
    assert len(pred["next_7d"]) == 7
    assert pred["end_of_month_projected_kwh"] > 0
    assert "insights" in pred

def test_two_month_dynamic_ai_comparison():
    """Verify dynamic AI comparison produces natural language summary from data."""
    comp = comparison_engine.compare_months(2026, 8, 2026, 9)
    assert "month1" in comp
    assert "month2" in comp
    assert len(comp["appliance_comparison"]) > 0
    assert len(comp["ai_explanation"]) > 20
    assert "Energy consumption" in comp["ai_explanation"]

if __name__ == "__main__":
    test_database_mathematical_consistency()
    test_slab_tariff_calculation()
    test_anomaly_detection()
    test_wastage_detection_empty_room()
    test_simulation_toggle_and_savings_verification()
    test_forecaster_output()
    test_two_month_dynamic_ai_comparison()
    print("[ALL TESTS PASSED SUCCESSFULLY!]")
