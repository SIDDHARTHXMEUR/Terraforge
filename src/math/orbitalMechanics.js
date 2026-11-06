// TERRAFORGE 2.0 — Scientific Computing Module: Two-Body Keplerian Orbital Mechanics
// Standards: Standard Gravitational Parameter μ = G * M
// Lengths in km, Velocities in km/s, Periods in seconds/hours/days

export const GRAVITATIONAL_CONSTANT = 6.67430e-11; // m^3 kg^-1 s^-2
export const SUN_MASS_KG = 1.9885e30;
export const EARTH_MASS_KG = 5.9722e24;

/**
 * Calculates standard gravitational parameter μ = G * M (m^3 / s^2)
 */
export function calculateMu(centralMassKg) {
  if (!centralMassKg || centralMassKg <= 0) {
    throw new Error('Central body mass must be positive');
  }
  return GRAVITATIONAL_CONSTANT * centralMassKg;
}

/**
 * Vis-Viva Equation: v = sqrt(μ * (2/r - 1/a))
 * @param {number} rMeters - Current orbital radius in meters
 * @param {number} aMeters - Semi-major axis in meters (a > 0 for ellipse, infinity for parabola, a < 0 for hyperbola)
 * @param {number} mu - Standard gravitational parameter (m^3 / s^2)
 * @returns {number} Orbital velocity in meters per second
 */
export function calculateOrbitalVelocity(rMeters, aMeters, mu) {
  if (rMeters <= 0 || mu <= 0) {
    throw new Error('Radius and gravitational parameter must be positive');
  }
  const term = (2 / rMeters) - (1 / aMeters);
  if (term < 0) {
    throw new Error('Unphysical orbit parameters (negative kinetic energy)');
  }
  return Math.sqrt(mu * term);
}

/**
 * Circular Orbital Velocity: v = sqrt(μ / r)
 */
export function calculateCircularVelocity(rMeters, mu) {
  return calculateOrbitalVelocity(rMeters, rMeters, mu);
}

/**
 * Escape Velocity: v_esc = sqrt(2 * μ / r)
 */
export function calculateEscapeVelocity(rMeters, mu) {
  if (rMeters <= 0 || mu <= 0) {
    throw new Error('Radius and gravitational parameter must be positive');
  }
  return Math.sqrt((2 * mu) / rMeters);
}

/**
 * Kepler's Third Law: Orbital Period T = 2 * π * sqrt(a^3 / μ)
 * @param {number} aMeters - Semi-major axis in meters
 * @param {number} mu - Standard gravitational parameter
 * @returns {number} Orbital period in seconds
 */
export function calculateOrbitalPeriod(aMeters, mu) {
  if (aMeters <= 0 || mu <= 0) {
    throw new Error('Semi-major axis and gravitational parameter must be positive');
  }
  return 2 * Math.PI * Math.sqrt(Math.pow(aMeters, 3) / mu);
}

/**
 * Computes periapsis (closest approach) and apoapsis (furthest distance)
 * r_p = a * (1 - e)
 * r_a = a * (1 + e)
 */
export function calculateApsides(aKm, eccentricity) {
  if (aKm <= 0) throw new Error('Semi-major axis must be positive');
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error('Eccentricity must be in range [0, 1) for bound elliptic orbits');
  }
  const periapsisKm = aKm * (1 - eccentricity);
  const apoapsisKm = aKm * (1 + eccentricity);
  return {
    periapsisKm,
    apoapsisKm,
    periapsisAU: periapsisKm / 149597870.7,
    apoapsisAU: apoapsisKm / 149597870.7
  };
}

/**
 * Specific Orbital Energy: ε = -μ / (2 * a)
 * @returns {number} Energy in Joules per kilogram (J/kg)
 */
export function calculateSpecificOrbitalEnergy(aMeters, mu) {
  if (aMeters <= 0 || mu <= 0) throw new Error('Invalid orbital parameters');
  return -mu / (2 * aMeters);
}

/**
 * Generates an array of 2D/3D trajectory points for visualization
 * @param {number} semiMajorAxis - In visualization units
 * @param {number} eccentricity - 0 <= e < 1
 * @param {number} inclinationRad - Orbital inclination angle
 * @param {number} segments - Number of segments for the path
 */
export function generateOrbitalTrajectoryPoints(semiMajorAxis, eccentricity = 0, inclinationRad = 0, segments = 128) {
  const points = [];
  const semiMinorAxis = semiMajorAxis * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity));
  const focusOffset = semiMajorAxis * eccentricity;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    // Ellipse centered at focus (0,0,0)
    const x = semiMajorAxis * Math.cos(theta) - focusOffset;
    const z = semiMinorAxis * Math.sin(theta);
    // Apply inclination rotation around X axis
    const y = -z * Math.sin(inclinationRad);
    const zRot = z * Math.cos(inclinationRad);

    points.push({ x, y, z: zRot });
  }
  return points;
}

/**
 * Comprehensive Keplerian Orbital State Solver
 */
export function solveOrbitState({
  centralBodyMassKg = SUN_MASS_KG,
  semiMajorAxisAU = 1.0,
  eccentricity = 0.0167,
  inclinationDeg = 0.0,
  trueAnomalyDeg = 0.0
}) {
  const AU_METERS = 149597870700;
  const aMeters = semiMajorAxisAU * AU_METERS;
  const mu = calculateMu(centralBodyMassKg);

  const periodSeconds = calculateOrbitalPeriod(aMeters, mu);
  const periodDays = periodSeconds / 86400;
  const periodYears = periodDays / 365.256;

  const nuRad = (trueAnomalyDeg * Math.PI) / 180;
  // Radius at current true anomaly: r = a(1 - e^2) / (1 + e*cos(nu))
  const currentRadiusMeters = (aMeters * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(nuRad));
  const currentRadiusAU = currentRadiusMeters / AU_METERS;

  const currentVelocityMps = calculateOrbitalVelocity(currentRadiusMeters, aMeters, mu);
  const currentVelocityKmS = currentVelocityMps / 1000;

  const circularVelocityKmS = calculateCircularVelocity(currentRadiusMeters, mu) / 1000;
  const escapeVelocityKmS = calculateEscapeVelocity(currentRadiusMeters, mu) / 1000;

  const apsides = calculateApsides(aMeters / 1000, eccentricity);
  const specificEnergy = calculateSpecificOrbitalEnergy(aMeters, mu);

  return {
    semiMajorAxisAU,
    semiMajorAxisKm: aMeters / 1000,
    eccentricity,
    inclinationDeg,
    trueAnomalyDeg,
    currentRadiusAU,
    currentRadiusKm: currentRadiusMeters / 1000,
    currentVelocityKmS,
    circularVelocityKmS,
    escapeVelocityKmS,
    periodDays,
    periodYears,
    periapsisKm: apsides.periapsisKm,
    apoapsisKm: apsides.apoapsisKm,
    specificEnergyJkg: specificEnergy
  };
}

