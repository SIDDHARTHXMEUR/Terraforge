import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateImpactVolume,
  calculateImpactMass,
  calculateKineticEnergy,
  simulateAsteroidImpact,
  JOULES_PER_MEGATON_TNT
} from './asteroidImpact.js';

describe('Asteroid Impact Physics Engine Unit Tests', () => {
  it('calculates spherical impact volume correctly', () => {
    const diameter = 10; // radius = 5m
    const volume = calculateImpactVolume(diameter);
    const expected = (4 / 3) * Math.PI * 125;
    assert.ok(Math.abs(volume - expected) < 1e-6);
  });

  it('calculates mass from volume and density accurately', () => {
    const volume = 1000; // m^3
    const density = 3000; // kg/m^3
    const mass = calculateImpactMass(volume, density);
    assert.equal(mass, 3000000);
  });

  it('calculates kinetic energy E_k = 0.5 * m * v^2', () => {
    const mass = 2000; // kg
    const velocity = 10000; // m/s (10 km/s)
    const energy = calculateKineticEnergy(mass, velocity);
    // 0.5 * 2000 * 1e8 = 1e11 J
    assert.equal(energy, 1e11);
  });

  it('simulates Barringer-scale iron meteorite impact correctly', () => {
    const result = simulateAsteroidImpact({
      diameterM: 50,
      densityKgm3: 7800,
      velocityKms: 12.8,
      impactAngleDeg: 45
    });

    // Barringer crater was ~10 MT TNT, final diameter ~1.2 km
    assert.ok(result.physics.megatonsTNT > 1.0 && result.physics.megatonsTNT < 25.0);
    assert.ok(result.crater.finalDiameterM > 800 && result.crater.finalDiameterM < 1600);
    assert.ok(result.environmentalEffects.seismicMagnitude > 4.5);
  });

  it('verifies simple vs complex crater transition threshold', () => {
    // Small body produces simple bowl crater
    const smallSim = simulateAsteroidImpact({ diameterM: 30, velocityKms: 15 });
    assert.equal(smallSim.crater.craterType, 'Simple Bowl Crater');

    // Massive body produces complex central-peak structure
    const giantSim = simulateAsteroidImpact({ diameterM: 3000, velocityKms: 20 });
    assert.equal(giantSim.crater.craterType, 'Complex Central-Peak Impact Structure');
  });
});

