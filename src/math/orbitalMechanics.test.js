import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMu,
  calculateOrbitalVelocity,
  calculateCircularVelocity,
  calculateEscapeVelocity,
  calculateOrbitalPeriod,
  calculateApsides,
  calculateSpecificOrbitalEnergy,
  solveOrbitState,
  SUN_MASS_KG,
  EARTH_MASS_KG
} from './orbitalMechanics.js';

describe('Orbital Mechanics Unit Tests', () => {
  it('calculates standard gravitational parameter μ = G * M correctly', () => {
    const muSun = calculateMu(SUN_MASS_KG);
    // G * M_sun ≈ 1.327e20 m^3/s^2
    assert.ok(muSun > 1.32e20 && muSun < 1.33e20);
  });

  it('calculates circular orbital velocity of Earth around Sun at 1 AU (~29.78 km/s)', () => {
    const muSun = calculateMu(SUN_MASS_KG);
    const rMeters = 149597870700; // 1 AU
    const vMps = calculateCircularVelocity(rMeters, muSun);
    const vKmS = vMps / 1000;
    assert.ok(Math.abs(vKmS - 29.78) < 0.2);
  });

  it('verifies escape velocity relationship v_esc = sqrt(2) * v_circ', () => {
    const mu = calculateMu(EARTH_MASS_KG);
    const rMeters = 6371000; // Earth radius
    const vCirc = calculateCircularVelocity(rMeters, mu);
    const vEsc = calculateEscapeVelocity(rMeters, mu);
    const ratio = vEsc / vCirc;
    assert.ok(Math.abs(ratio - Math.SQRT2) < 0.0001);
  });

  it('calculates orbital period of Earth at 1 AU (~365.25 days)', () => {
    const muSun = calculateMu(SUN_MASS_KG);
    const aMeters = 149597870700;
    const periodSec = calculateOrbitalPeriod(aMeters, muSun);
    const periodDays = periodSec / 86400;
    assert.ok(Math.abs(periodDays - 365.25) < 0.5);
  });

  it('calculates periapsis and apoapsis accurately for elliptic orbits', () => {
    const aKm = 10000;
    const e = 0.2;
    const apsides = calculateApsides(aKm, e);
    assert.equal(apsides.periapsisKm, 8000);
    assert.equal(apsides.apoapsisKm, 12000);
  });

  it('verifies specific orbital energy is strictly negative for bound orbits', () => {
    const mu = calculateMu(SUN_MASS_KG);
    const aMeters = 149597870700;
    const energy = calculateSpecificOrbitalEnergy(aMeters, mu);
    assert.ok(energy < 0);
  });
});
