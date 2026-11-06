// TERRAFORGE 2.0 — Scientific Computing Module: Asteroid Impact Physics Engine
// Based on established planetary impact literature (Collins, Melosh, & Marcus, 2005 / Holsapple-Schmidt Scaling)

export const JOULES_PER_MEGATON_TNT = 4.184e15;
export const HIROSHIMA_JOULES = 6.3e13; // ~15 kilotons
export const EARTH_SURFACE_GRAVITY = 9.807; // m/s^2

export const IMPACT_PRESETS = {
  chelyabinsk: {
    name: 'Chelyabinsk Meteor (2013)',
    diameterM: 20,
    densityKgm3: 3300, // Chondrite stone
    velocityKms: 19.16,
    impactAngleDeg: 18,
    targetType: 'sedimentary'
  },
  tunguska: {
    name: 'Tunguska Event (1908)',
    diameterM: 65,
    densityKgm3: 2600, // Stony asteroid / airburst
    velocityKms: 15.0,
    impactAngleDeg: 35,
    targetType: 'crystalline'
  },
  barringer: {
    name: 'Barringer Meteor Crater (~50,000 yr)',
    diameterM: 50,
    densityKgm3: 7800, // Metallic Iron-Nickel
    velocityKms: 12.8,
    impactAngleDeg: 45,
    targetType: 'sedimentary'
  },
  chicxulub: {
    name: 'Chicxulub Dinosaur Extinction (~66 Ma)',
    diameterM: 10000, // 10 km
    densityKgm3: 3000, // Carbonaceous chondrite
    velocityKms: 20.0,
    impactAngleDeg: 60,
    targetType: 'sedimentary'
  }
};

/**
 * Calculates sphere volume: V = 4/3 * π * r^3
 * @param {number} diameterMeters
 */
export function calculateImpactVolume(diameterMeters) {
  if (diameterMeters <= 0) throw new Error('Diameter must be positive');
  const radius = diameterMeters / 2;
  return (4 / 3) * Math.PI * Math.pow(radius, 3);
}

/**
 * Calculates projectile mass: Mass = Density * Volume
 */
export function calculateImpactMass(volumeM3, densityKgm3) {
  if (volumeM3 <= 0 || densityKgm3 <= 0) throw new Error('Volume and density must be positive');
  return volumeM3 * densityKgm3;
}

/**
 * Calculates kinetic energy: E_k = 0.5 * Mass * Velocity^2
 */
export function calculateKineticEnergy(massKg, velocityMps) {
  if (massKg <= 0 || velocityMps <= 0) throw new Error('Mass and velocity must be positive');
  return 0.5 * massKg * Math.pow(velocityMps, 2);
}

/**
 * Full Asteroid Impact Simulation Engine
 */
export function simulateAsteroidImpact({
  diameterM = 100,
  densityKgm3 = 3000,
  velocityKms = 20,
  impactAngleDeg = 45,
  targetDensityKgm3 = 2600,
  targetGravity = EARTH_SURFACE_GRAVITY
}) {
  const radiusM = diameterM / 2;
  const velocityMps = velocityKms * 1000;
  const angleRad = (impactAngleDeg * Math.PI) / 180;

  // 1. Volume & Mass
  const volumeM3 = calculateImpactVolume(diameterM);
  const massKg = calculateImpactMass(volumeM3, densityKgm3);

  // 2. Kinetic Energy
  const energyJoules = calculateKineticEnergy(massKg, velocityMps);
  const megatonsTNT = energyJoules / JOULES_PER_MEGATON_TNT;
  const hiroshimaEquivalents = energyJoules / HIROSHIMA_JOULES;

  // 3. Transient Crater Diameter (Collins, Melosh, Marcus 2005 scaling)
  // D_tc = 1.161 * (rho_i / rho_t)^(1/3) * L^0.78 * v^0.44 * g^(-0.22) * sin(theta)^(1/3)
  const densityRatio = densityKgm3 / targetDensityKgm3;
  const sinAngle = Math.max(0.01, Math.sin(angleRad));
  const transientCraterDiameterM =
    1.161 *
    Math.pow(densityRatio, 1 / 3) *
    Math.pow(diameterM, 0.78) *
    Math.pow(velocityMps, 0.44) *
    Math.pow(targetGravity, -0.22) *
    Math.pow(sinAngle, 1 / 3);

  // Transient Crater Depth (approx 1/3 of transient diameter)
  const transientDepthM = transientCraterDiameterM / 3.0;

  // 4. Final Crater Diameter (transition from simple to complex crater at ~3.2 km on Earth)
  const simpleToComplexTransitionM = 3200;
  let finalCraterDiameterM;
  let craterType;

  if (transientCraterDiameterM < simpleToComplexTransitionM) {
    // Simple bowl-shaped crater
    finalCraterDiameterM = 1.25 * transientCraterDiameterM;
    craterType = 'Simple Bowl Crater';
  } else {
    // Complex crater with central peak or multi-ring collapse
    finalCraterDiameterM =
      1.17 *
      (Math.pow(transientCraterDiameterM, 1.13) /
        Math.pow(simpleToComplexTransitionM, 0.13));
    craterType = 'Complex Central-Peak Impact Structure';
  }

  const finalCraterDepthM =
    craterType === 'Simple Bowl Crater'
      ? finalCraterDiameterM / 5.0
      : 1.04 * Math.pow(finalCraterDiameterM / 1000, 0.301) * 1000;

  // 5. Equivalent Richter Seismic Magnitude
  // Approx empirical formula: Mw = 0.67 * log10(E_joules) - 5.87
  const seismicMagnitude = Math.max(0, 0.67 * Math.log10(energyJoules) - 5.87);

  // 6. Airblast Overpressure Radius (5 psi severe structural destruction)
  // Distance scales roughly with (Energy in Megatons)^(1/3)
  const blastRadius5psiKm = 4.5 * Math.pow(Math.max(0.001, megatonsTNT), 1 / 3);

  // 7. Thermal Radiation Fireball Radius (3rd degree burns radius)
  const thermalFireballRadiusKm = 2.1 * Math.pow(Math.max(0.001, megatonsTNT), 0.41);

  // 8. Ejecta Blanket Volume
  const ejectaVolumeKm3 = (Math.PI * Math.pow(transientCraterDiameterM / 2000, 2) * (transientDepthM / 1000)) / 3;

  return {
    inputs: {
      diameterM,
      densityKgm3,
      velocityKms,
      impactAngleDeg,
      targetDensityKgm3
    },
    physics: {
      volumeM3,
      massKg,
      massMetricTons: massKg / 1000,
      energyJoules,
      megatonsTNT,
      hiroshimaEquivalents
    },
    crater: {
      transientDiameterM: Math.round(transientCraterDiameterM),
      transientDepthM: Math.round(transientDepthM),
      finalDiameterM: Math.round(finalCraterDiameterM),
      finalDiameterKm: Number((finalCraterDiameterM / 1000).toFixed(2)),
      finalDepthM: Math.round(finalCraterDepthM),
      craterType,
      ejectaVolumeKm3: Number(ejectaVolumeKm3.toFixed(3))
    },
    environmentalEffects: {
      seismicMagnitude: Number(seismicMagnitude.toFixed(1)),
      blastRadius5psiKm: Number(blastRadius5psiKm.toFixed(1)),
      thermalFireballRadiusKm: Number(thermalFireballRadiusKm.toFixed(1))
    },
    assumptions: [
      'Projectile modeled as a homogeneous spherical impactor.',
      'Target assumed to be cohesive rock / continental crust.',
      'Atmospheric deceleration is neglected for bodies > 100m diameter.',
      'Transient crater scaling uses Collins, Melosh & Marcus (2005) dimensionless pi-group scaling.',
      'Thermal fireball radii are empirical approximations for surface bursts.'
    ]
  };
}

