import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCo2Forcing,
  calculateDynamicAlbedo,
  calculateEquilibriumTemp,
  simulateClimateTrajectory,
  PRE_INDUSTRIAL_CO2
} from './climateModel.js';

describe('Energy Balance Climate Model Unit Tests', () => {
  it('verifies radiative forcing is zero at pre-industrial baseline (280 ppm)', () => {
    const forcing = calculateCo2Forcing(PRE_INDUSTRIAL_CO2);
    assert.equal(forcing, 0);
  });

  it('calculates radiative forcing for CO2 doubling (560 ppm) ≈ +3.7 W/m^2', () => {
    const forcing = calculateCo2Forcing(560);
    // 5.35 * ln(2) ≈ 3.708 W/m^2
    assert.ok(Math.abs(forcing - 3.708) < 0.05);
  });

  it('demonstrates ice-albedo dynamic feedback (colder planet has higher albedo)', () => {
    const iceAlbedo = calculateDynamicAlbedo(-30, 0.6);
    const warmAlbedo = calculateDynamicAlbedo(25, 0.6);
    assert.ok(iceAlbedo > warmAlbedo);
  });

  it('calculates equilibrium Earth surface temperature within physical range (~288 K / +15°C)', () => {
    const result = calculateEquilibriumTemp({
      solarConstant: 1361,
      albedo: 0.30,
      co2Forcing: 0,
      effectiveEmissivity: 0.612
    });

    assert.ok(result.tempC > 12.0 && result.tempC < 17.0);
    assert.ok(result.tempK > 285.0 && result.tempK < 290.0);
  });

  it('simulates multi-decadal warming trajectory monotonically under rising CO2', () => {
    const sim = simulateClimateTrajectory({
      initialTempC: 14.5,
      co2Ppm: 425,
      targetCo2Ppm: 800,
      simulationYears: 50
    });

    const trajectory = sim.trajectory;
    assert.equal(trajectory.length, 51);
    const first = trajectory[0].tempC;
    const last = trajectory[trajectory.length - 1].tempC;
    assert.ok(last > first);
  });
});
