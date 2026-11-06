// TERRAFORGE 2.0 — Scientific Computing Module: Energy Balance Climate Model (EBM)
// Physics: Zero-Dimensional & 1D Energy Balance with Radiative Forcing and Ice-Albedo Feedback
// Formulations: Stefan-Boltzmann Law, Myhre et al. (1998) CO2 Forcing, Budyko-Sellers Albedo Formulation

export const SOLAR_CONSTANT_EARTH = 1361.0; // W/m^2 (TSI at 1 AU)
export const STEFAN_BOLTZMANN = 5.670374e-8; // W m^-2 K^-4
export const PRE_INDUSTRIAL_CO2 = 280; // ppm

export const CLIMATE_SCENARIOS = {
  preIndustrial: {
    name: 'Pre-Industrial Baseline',
    co2Ppm: 280,
    solarForcingPercent: 100,
    cloudCoverage: 0.60,
    description: 'Equilibrium climate state prior to modern industrial fossil combustion (~1750 CE).'
  },
  presentDay: {
    name: 'Present Day (2026 Observational)',
    co2Ppm: 425,
    solarForcingPercent: 100,
    cloudCoverage: 0.60,
    description: 'Atmospheric CO2 concentration measured at Mauna Loa Observatory (~425 ppm).'
  },
  parisTarget: {
    name: 'Paris Agreement (RCP 2.6 / Net Zero)',
    co2Ppm: 450,
    solarForcingPercent: 100,
    cloudCoverage: 0.61,
    description: 'Aggressive mitigation stabilization pathway designed to cap warming within 1.5°C to 2.0°C.'
  },
  highEmissions: {
    name: 'High Emissions (SSP5-8.5 / Runaway)',
    co2Ppm: 950,
    solarForcingPercent: 100,
    cloudCoverage: 0.52,
    description: 'Unmitigated fossil-fueled development leading to extensive polar ice loss and extreme forcing.'
  },
  iceAgeGlacial: {
    name: 'Last Glacial Maximum (~20,000 yr BP)',
    co2Ppm: 185,
    solarForcingPercent: 99.5,
    cloudCoverage: 0.75,
    description: 'Continental ice sheet expansion across Eurasia and North America with depressed sea levels.'
  }
};

/**
 * Computes Radiative Forcing from CO2 relative to pre-industrial baseline (Myhre et al. 1998):
 * ΔF = 5.35 * ln(C / C_0) [W/m^2]
 */
export function calculateCo2Forcing(co2Ppm) {
  if (co2Ppm <= 0) throw new Error('CO2 concentration must be strictly positive');
  return 5.35 * Math.log(co2Ppm / PRE_INDUSTRIAL_CO2);
}

/**
 * Temperature-dependent dynamic planetary albedo (Budyko ice-albedo feedback)
 * As planet cools below freezing, ice and snow sheets expand and reflect more incident sunlight.
 */
export function calculateDynamicAlbedo(tempCelsius, cloudCoverage = 0.6) {
  // Classical Budyko ice-albedo feedback anchored at modern Earth equilibrium (15°C -> albedo 0.30)
  const baseAlbedo = 0.30 - 0.007 * (tempCelsius - 15);
  // Cloud modification factor scaled around 0.60 reference
  const cloudDelta = (cloudCoverage - 0.60) * 0.10;
  const effectiveAlbedo = baseAlbedo + cloudDelta;
  return Math.min(0.65, Math.max(0.18, effectiveAlbedo));
}

/**
 * Calculates equilibrium surface temperature (in Kelvin and Celsius) for an Energy Balance Model:
 * F_in = F_out
 * (S_0 * (1 - α)) / 4 + ΔF = ε * σ * T^4
 * T = [ ((S_0 * (1 - α)) / 4 + ΔF) / (ε * σ) ]^(1/4)
 */
export function calculateEquilibriumTemp({
  solarConstant = SOLAR_CONSTANT_EARTH,
  albedo = 0.30,
  co2Forcing = 0,
  effectiveEmissivity = 0.612 // Accounts for greenhouse atmospheric opacity
}) {
  const absorbedSolar = (solarConstant * (1 - albedo)) / 4;
  const netIncomingFlux = absorbedSolar + co2Forcing;

  if (netIncomingFlux <= 0) {
    throw new Error('Unphysical radiative flux: absorbed energy must be positive');
  }

  const tempK = Math.pow(netIncomingFlux / (effectiveEmissivity * STEFAN_BOLTZMANN), 0.25);
  return {
    tempK,
    tempC: tempK - 273.15,
    absorbedSolarWm2: absorbedSolar,
    outgoingThermalWm2: netIncomingFlux
  };
}

/**
 * Multi-Decadal Transient Climate Simulation
 * Integrates: C_ocean * dT/dt = F_in - F_out
 */
export function simulateClimateTrajectory({
  initialTempC = 14.5,
  co2Ppm = 425,
  targetCo2Ppm = 600,
  cloudCoverage = 0.60,
  solarForcingPercent = 100,
  simulationYears = 50,
  timeStepYears = 1
}) {
  const solarConstant = SOLAR_CONSTANT_EARTH * (solarForcingPercent / 100);
  const effectiveEmissivity = 0.612;
  const oceanHeatCapacity = 1.05e8; // Effective upper ocean heat capacity ~ J / (m^2 * K)
  const secondsPerYear = 3.1536e7;

  const trajectory = [];
  let currentTempC = initialTempC;

  const steps = Math.round(simulationYears / timeStepYears);

  for (let i = 0; i <= steps; i++) {
    const year = i * timeStepYears;
    const progress = i / steps;

    // Linear ramp of CO2 from start to target
    const currentCo2 = co2Ppm + (targetCo2Ppm - co2Ppm) * progress;
    const co2Forcing = calculateCo2Forcing(currentCo2);

    const albedo = calculateDynamicAlbedo(currentTempC, cloudCoverage);
    const absorbedSolar = (solarConstant * (1 - albedo)) / 4;

    const tempK = currentTempC + 273.15;
    const outgoingThermal = effectiveEmissivity * STEFAN_BOLTZMANN * Math.pow(tempK, 4);

    const netFluxImbalance = absorbedSolar + co2Forcing - outgoingThermal; // W/m^2

    // Rate of temperature change: dT = (netFlux / C_ocean) * dt
    const dtSeconds = timeStepYears * secondsPerYear;
    const deltaT = (netFluxImbalance / oceanHeatCapacity) * dtSeconds;

    trajectory.push({
      year,
      tempC: Number(currentTempC.toFixed(2)),
      tempAnomalyC: Number((currentTempC - 14.0).toFixed(2)), // Anomaly relative to pre-industrial 14.0°C
      co2Ppm: Math.round(currentCo2),
      co2ForcingWm2: Number(co2Forcing.toFixed(2)),
      albedo: Number(albedo.toFixed(3)),
      netFluxImbalanceWm2: Number(netFluxImbalance.toFixed(2)),
      absorbedSolarWm2: Number(absorbedSolar.toFixed(1)),
      outgoingThermalWm2: Number(outgoingThermal.toFixed(1))
    });

    currentTempC += deltaT;
  }

  const finalState = trajectory[trajectory.length - 1];

  return {
    inputs: {
      initialTempC,
      co2Ppm,
      targetCo2Ppm,
      cloudCoverage,
      solarForcingPercent,
      simulationYears
    },
    finalState,
    trajectory,
    modelNotes: [
      'Zero-dimensional global radiative-convective energy balance model (EBM).',
      'CO2 forcing evaluated via Myhre et al. (1998) formulation ΔF = 5.35 * ln(C/C0).',
      'Ice-albedo positive feedback incorporates temperature-dependent surface cryosphere expansion.',
      'Thermal inertia modeled via well-mixed upper ocean mixed-layer heat capacity (70m equivalent depth).'
    ]
  };
}
