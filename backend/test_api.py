from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "capabilities" in data

def test_climate_sim():
    payload = {
        "initial_temp_c": 15.0,
        "co2_ppm": 425.0,
        "target_co2_ppm": 600.0,
        "cloud_coverage": 0.60,
        "solar_forcing_percent": 100.0,
        "simulation_years": 30
    }
    response = client.post("/api/sim/climate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "trajectory" in data
    assert len(data["trajectory"]) == 31
    assert "final_state" in data

def test_asteroid_impact():
    payload = {
        "diameter_m": 50.0,
        "density_kgm3": 7800.0,
        "velocity_kms": 12.8,
        "impact_angle_deg": 45.0,
        "target_density_kgm3": 2600.0
    }
    response = client.post("/api/sim/impact", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["physics"]["megatons_tnt"] > 1.0
    assert data["crater"]["final_diameter_m"] > 500

def test_orbital_mechanics():
    payload = {
        "central_body": "sun",
        "semi_major_axis_au": 1.0,
        "eccentricity": 0.0167,
        "inclination_deg": 0.0,
        "true_anomaly_deg": 0.0
    }
    response = client.post("/api/sim/orbit", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Earth velocity around Sun is ~29.8 to 30.3 km/s at periapsis
    assert 29.0 <= data["state"]["current_velocity_kms"] <= 31.0
    assert 364.0 <= data["state"]["period_days"] <= 366.0

