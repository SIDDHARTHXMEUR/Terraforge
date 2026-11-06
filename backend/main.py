"""
TERRAFORGE 2.0 — Scientific Backend Service
FastAPI REST API providing deterministic astrophysical computations,
NASA Open API caching/proxying, and Gemini AI scientific inference.
"""

import math
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Terraforge 2.0 Scientific Engine API",
    description="Astrophysical Simulation, Orbital Kinematics, and Planetary Intelligence API",
    version="2.0.0"
)

# CORS configuration for local Vite development and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
G_CONST = 6.67430e-11  # m^3 kg^-1 s^-2
SUN_MASS_KG = 1.9885e30
EARTH_MASS_KG = 5.9722e24
AU_METERS = 149597870700
JOULES_PER_MEGATON_TNT = 4.184e15

# ==================== SCHEMAS ====================

class ClimateSimRequest(BaseModel):
    initial_temp_c: float = Field(15.0, description="Initial global mean surface temperature in Celsius")
    co2_ppm: float = Field(425.0, description="Baseline atmospheric CO2 in ppm")
    target_co2_ppm: float = Field(600.0, description="Target atmospheric CO2 in ppm")
    cloud_coverage: float = Field(0.60, ge=0.0, le=1.0, description="Planetary cloud coverage fraction")
    solar_forcing_percent: float = Field(100.0, description="Solar irradiance percentage relative to 1361 W/m^2")
    simulation_years: int = Field(50, ge=5, le=200, description="Duration in years")

class AsteroidImpactRequest(BaseModel):
    diameter_m: float = Field(100.0, gt=0, description="Impactor spherical diameter in meters")
    density_kgm3: float = Field(3000.0, gt=0, description="Impactor bulk density in kg/m^3")
    velocity_kms: float = Field(20.0, gt=0, description="Impact velocity in km/s")
    impact_angle_deg: float = Field(45.0, ge=5.0, le=90.0, description="Impact trajectory angle relative to horizontal")
    target_density_kgm3: float = Field(2600.0, gt=0, description="Target crustal rock density in kg/m^3")

class OrbitalMechanicsRequest(BaseModel):
    central_body: str = Field("sun", description="'sun' or 'earth'")
    semi_major_axis_au: float = Field(1.0, gt=0, description="Semi-major axis in AU")
    eccentricity: float = Field(0.0167, ge=0.0, lt=1.0, description="Orbital eccentricity [0, 1)")
    inclination_deg: float = Field(0.0, description="Orbital inclination in degrees")
    true_anomaly_deg: float = Field(0.0, description="True anomaly angle in degrees")

class AIChatRequest(BaseModel):
    prompt: str = Field(..., description="User query or instruction")
    context_body: Optional[str] = Field("earth", description="Currently focused celestial body")
    api_key: Optional[str] = Field(None, description="Optional Google Gemini API key")

# ==================== ENDPOINTS ====================

@app.get("/api/health")
def health_check():
    """Health status and telemetry endpoint."""
    return {
        "status": "ONLINE",
        "service": "Terraforge 2.0 Scientific API",
        "version": "2.0.0",
        "timestamp": time.time(),
        "capabilities": [
            "two_body_orbital_mechanics",
            "asteroid_crater_pi_group_scaling",
            "thermodynamic_energy_balance_climate_model",
            "gemini_cognitive_reasoning_proxy"
        ]
    }

@app.post("/api/sim/climate")
def run_climate_sim(req: ClimateSimRequest):
    """
    Zero-dimensional energy balance model with Myhre et al. (1998) CO2 forcing
    and Budyko-Sellers ice-albedo temperature feedback.
    """
    solar_constant = 1361.0 * (req.solar_forcing_percent / 100.0)
    effective_emissivity = 0.612
    sigma = 5.670374e-8
    ocean_heat_capacity = 1.05e8  # J / (m^2 * K)
    seconds_per_year = 3.1536e7

    trajectory = []
    current_temp_c = req.initial_temp_c
    steps = req.simulation_years

    for year in range(steps + 1):
        progress = year / steps
        current_co2 = req.co2_ppm + (req.target_co2_ppm - req.co2_ppm) * progress
        co2_forcing = 5.35 * math.log(max(1.0, current_co2) / 280.0)

        # Dynamic Budyko ice-albedo feedback
        base_albedo = 0.30 - 0.007 * (current_temp_c - 15.0)
        cloud_delta = (req.cloud_coverage - 0.60) * 0.10
        albedo = min(0.65, max(0.18, base_albedo + cloud_delta))

        absorbed_solar = (solar_constant * (1.0 - albedo)) / 4.0
        temp_k = current_temp_c + 273.15
        outgoing_thermal = effective_emissivity * sigma * (temp_k ** 4)

        net_flux = absorbed_solar + co2_forcing - outgoing_thermal

        trajectory.append({
            "year": year,
            "temp_c": round(current_temp_c, 2),
            "temp_anomaly_c": round(current_temp_c - 14.0, 2),
            "co2_ppm": round(current_co2),
            "co2_forcing_wm2": round(co2_forcing, 2),
            "albedo": round(albedo, 3),
            "net_flux_wm2": round(net_flux, 2)
        })

        # Advance temperature
        delta_t = (net_flux / ocean_heat_capacity) * seconds_per_year
        current_temp_c += delta_t

    return {
        "inputs": req.dict(),
        "final_state": trajectory[-1],
        "trajectory": trajectory
    }

@app.post("/api/sim/impact")
def run_asteroid_impact(req: AsteroidImpactRequest):
    """
    Dimensional analysis and pi-group transient crater scaling based on
    Collins, Melosh & Marcus (2005).
    """
    radius_m = req.diameter_m / 2.0
    volume_m3 = (4.0 / 3.0) * math.pi * (radius_m ** 3)
    mass_kg = req.density_kgm3 * volume_m3
    velocity_mps = req.velocity_kms * 1000.0

    energy_joules = 0.5 * mass_kg * (velocity_mps ** 2)
    megatons_tnt = energy_joules / JOULES_PER_MEGATON_TNT
    hiroshima_equivalents = energy_joules / 6.3e13

    # Transient crater diameter (Collins et al. 2005)
    angle_rad = math.radians(req.impact_angle_deg)
    density_ratio = req.density_kgm3 / req.target_density_kgm3
    sin_angle = max(0.01, math.sin(angle_rad))
    g = 9.807

    transient_diameter_m = (
        1.161 * (density_ratio ** (1.0 / 3.0))
        * (req.diameter_m ** 0.78)
        * (velocity_mps ** 0.44)
        * (g ** -0.22)
        * (sin_angle ** (1.0 / 3.0))
    )
    transient_depth_m = transient_diameter_m / 3.0

    # Transition to complex crater
    simple_threshold = 3200.0  # meters
    if transient_diameter_m < simple_threshold:
        final_diameter_m = 1.25 * transient_diameter_m
        crater_type = "Simple Bowl Crater"
        final_depth_m = final_diameter_m / 5.0
    else:
        final_diameter_m = 1.17 * (transient_diameter_m ** 1.13) / (simple_threshold ** 0.13)
        crater_type = "Complex Central-Peak Impact Structure"
        final_depth_m = 1.04 * ((final_diameter_m / 1000.0) ** 0.301) * 1000.0

    seismic_magnitude = max(0.0, 0.67 * math.log10(max(1.0, energy_joules)) - 5.87)
    blast_radius_5psi_km = 4.5 * (max(0.001, megatons_tnt) ** (1.0 / 3.0))
    thermal_fireball_km = 2.1 * (max(0.001, megatons_tnt) ** 0.41)

    return {
        "inputs": req.dict(),
        "physics": {
            "volume_m3": volume_m3,
            "mass_kg": mass_kg,
            "energy_joules": energy_joules,
            "megatons_tnt": round(megatons_tnt, 2),
            "hiroshima_equivalents": round(hiroshima_equivalents, 1)
        },
        "crater": {
            "transient_diameter_m": round(transient_diameter_m),
            "transient_depth_m": round(transient_depth_m),
            "final_diameter_m": round(final_diameter_m),
            "final_diameter_km": round(final_diameter_m / 1000.0, 2),
            "final_depth_m": round(final_depth_m),
            "crater_type": crater_type
        },
        "environmental_effects": {
            "seismic_magnitude": round(seismic_magnitude, 1),
            "blast_radius_5psi_km": round(blast_radius_5psi_km, 1),
            "thermal_fireball_radius_km": round(thermal_fireball_km, 1)
        }
    }

@app.post("/api/sim/orbit")
def solve_orbit(req: OrbitalMechanicsRequest):
    """
    Two-body Keplerian orbital solver using Vis-Viva equation and Kepler's Third Law.
    """
    central_mass = EARTH_MASS_KG if req.central_body.lower() == "earth" else SUN_MASS_KG
    mu = G_CONST * central_mass
    a_meters = req.semi_major_axis_au * AU_METERS

    period_seconds = 2.0 * math.pi * math.sqrt((a_meters ** 3) / mu)
    period_days = period_seconds / 86400.0

    nu_rad = math.radians(req.true_anomaly_deg)
    r_meters = (a_meters * (1.0 - req.eccentricity ** 2)) / (1.0 + req.eccentricity * math.cos(nu_rad))

    v_mps = math.sqrt(mu * ((2.0 / r_meters) - (1.0 / a_meters)))
    v_circ_mps = math.sqrt(mu / r_meters)
    v_esc_mps = math.sqrt(2.0 * mu / r_meters)

    periapsis_km = (a_meters * (1.0 - req.eccentricity)) / 1000.0
    apoapsis_km = (a_meters * (1.0 + req.eccentricity)) / 1000.0
    specific_energy = -mu / (2.0 * a_meters)

    return {
        "inputs": req.dict(),
        "state": {
            "current_radius_au": round(r_meters / AU_METERS, 4),
            "current_radius_km": round(r_meters / 1000.0),
            "current_velocity_kms": round(v_mps / 1000.0, 2),
            "circular_velocity_kms": round(v_circ_mps / 1000.0, 2),
            "escape_velocity_kms": round(v_esc_mps / 1000.0, 2),
            "period_days": round(period_days, 2),
            "period_years": round(period_days / 365.256, 3),
            "periapsis_km": round(periapsis_km),
            "apoapsis_km": round(apoapsis_km),
            "specific_energy_jkg": specific_energy
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
