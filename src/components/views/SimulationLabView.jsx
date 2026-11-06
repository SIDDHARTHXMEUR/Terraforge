import React, { useState, useMemo } from 'react';
import {
  simulateClimateTrajectory,
  CLIMATE_SCENARIOS
} from '../../math/climateModel';
import {
  simulateAsteroidImpact,
  IMPACT_PRESETS
} from '../../math/asteroidImpact';
import {
  solveOrbitState,
  SUN_MASS_KG,
  EARTH_MASS_KG
} from '../../math/orbitalMechanics';
import { useAppStore } from '../../state/useAppStore';
import {
  FlaskConical,
  Flame,
  Globe2,
  Orbit,
  Download,
  RotateCcw,
  Sliders,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export function SimulationLabView() {
  const { addSimulationRecord } = useAppStore();
  const [activeModule, setActiveModule] = useState('climate'); // 'climate' | 'impact' | 'orbit'

  // Module A: Climate Parameters
  const [climateParams, setClimateParams] = useState({
    scenario: 'presentDay',
    initialTempC: 15.0,
    co2Ppm: 425,
    targetCo2Ppm: 600,
    cloudCoverage: 0.60,
    solarForcingPercent: 100,
    simulationYears: 50
  });

  // Module B: Asteroid Impact Parameters
  const [impactParams, setImpactParams] = useState({
    preset: 'barringer',
    diameterM: 50,
    densityKgm3: 7800, // Iron meteorite
    velocityKms: 12.8,
    impactAngleDeg: 45,
    targetDensityKgm3: 2600
  });

  // Module C: Orbital Mechanics Parameters
  const [orbitParams, setOrbitParams] = useState({
    centralBody: 'sun',
    semiMajorAxisAU: 1.0,
    eccentricity: 0.0167,
    inclinationDeg: 0.0,
    trueAnomalyDeg: 45.0
  });

  // 1. Run Climate Simulation
  const climateResults = useMemo(() => {
    try {
      return simulateClimateTrajectory({
        initialTempC: climateParams.initialTempC,
        co2Ppm: climateParams.co2Ppm,
        targetCo2Ppm: climateParams.targetCo2Ppm,
        cloudCoverage: climateParams.cloudCoverage,
        solarForcingPercent: climateParams.solarForcingPercent,
        simulationYears: climateParams.simulationYears
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [climateParams]);

  // 2. Run Asteroid Impact Simulation
  const impactResults = useMemo(() => {
    try {
      return simulateAsteroidImpact({
        diameterM: impactParams.diameterM,
        densityKgm3: impactParams.densityKgm3,
        velocityKms: impactParams.velocityKms,
        impactAngleDeg: impactParams.impactAngleDeg,
        targetDensityKgm3: impactParams.targetDensityKgm3
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [impactParams]);

  // 3. Run Orbital Mechanics Solver
  const orbitResults = useMemo(() => {
    try {
      const centralMass = orbitParams.centralBody === 'earth' ? EARTH_MASS_KG : SUN_MASS_KG;
      return solveOrbitState({
        centralBodyMassKg: centralMass,
        semiMajorAxisAU: orbitParams.semiMajorAxisAU,
        eccentricity: orbitParams.eccentricity,
        inclinationDeg: orbitParams.inclinationDeg,
        trueAnomalyDeg: orbitParams.trueAnomalyDeg
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [orbitParams]);

  // Export current simulation data
  const handleExport = () => {
    let payload = {};
    if (activeModule === 'climate') payload = { module: 'Climate', ...climateResults };
    if (activeModule === 'impact') payload = { module: 'AsteroidImpact', ...impactResults };
    if (activeModule === 'orbit') payload = { module: 'OrbitalMechanics', ...orbitResults };

    addSimulationRecord({ module: activeModule, summary: payload });

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `terraforge-${activeModule}-sim-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-full bg-[#030712] text-gray-200 overflow-y-auto pt-16 px-6 pb-12 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
            <FlaskConical className="w-4 h-4" />
            <span className="tracking-widest uppercase">SCIENTIFIC SIMULATION & COMPUTATION LAB</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Independent Planetary Physics & Thermodynamics Engine
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Strict deterministic mathematical models with verifiable calculations, assumptions, and exportable results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/80 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'climate', label: '1. Climate & Radiative Forcing', icon: Globe2 },
          { id: 'impact', label: '2. Asteroid Impact Physics', icon: Flame },
          { id: 'orbit', label: '3. Keplerian Two-Body Orbital Mechanics', icon: Orbit }
        ].map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* Module Content */}
      <div className="max-w-7xl mx-auto">
        {/* ================= CLIMATE MODULE ================= */}
        {activeModule === 'climate' && climateResults && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Controls Column */}
            <div className="bg-black/60 border border-white/10 rounded-lg p-5">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>CLIMATE SCENARIO CONTROLS</span>
              </h2>

              {/* Scenarios Preset Picker */}
              <div className="mb-4">
                <label className="text-[11px] text-gray-400 block mb-1.5">HISTORIC / IPCC PRESETS:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(CLIMATE_SCENARIOS).map(([key, scn]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setClimateParams((prev) => ({
                          ...prev,
                          scenario: key,
                          co2Ppm: scn.co2Ppm,
                          targetCo2Ppm: scn.co2Ppm + 120,
                          cloudCoverage: scn.cloudCoverage,
                          solarForcingPercent: scn.solarForcingPercent
                        }));
                      }}
                      className={`text-left p-2 rounded border text-xs transition-all ${
                        climateParams.scenario === key
                          ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200 font-semibold'
                          : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-sans font-bold">{scn.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{scn.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">INITIAL TEMPERATURE:</span>
                    <span className="text-cyan-300 font-bold">{climateParams.initialTempC}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="35"
                    step="0.5"
                    value={climateParams.initialTempC}
                    onChange={(e) => setClimateParams({ ...climateParams, initialTempC: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">TARGET ATMOSPHERIC CO₂:</span>
                    <span className="text-cyan-300 font-bold">{climateParams.targetCo2Ppm} ppm</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1200"
                    step="10"
                    value={climateParams.targetCo2Ppm}
                    onChange={(e) => setClimateParams({ ...climateParams, targetCo2Ppm: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">CLOUD COVERAGE FACTOR:</span>
                    <span className="text-cyan-300 font-bold">{Math.round(climateParams.cloudCoverage * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={climateParams.cloudCoverage}
                    onChange={(e) => setClimateParams({ ...climateParams, cloudCoverage: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">SIMULATION DURATION:</span>
                    <span className="text-cyan-300 font-bold">{climateParams.simulationYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={climateParams.simulationYears}
                    onChange={(e) => setClimateParams({ ...climateParams, simulationYears: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Results & Visual Graphs Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">FINAL TEMPERATURE</span>
                  <span className="text-lg font-bold text-white">
                    {climateResults.finalState?.tempC}°C
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">TEMPERATURE ANOMALY</span>
                  <span className={`text-lg font-bold ${climateResults.finalState?.tempAnomalyC >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                    {climateResults.finalState?.tempAnomalyC >= 0 ? '+' : ''}{climateResults.finalState?.tempAnomalyC}°C
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">CO₂ RADIATIVE FORCING</span>
                  <span className="text-lg font-bold text-cyan-300">
                    +{climateResults.finalState?.co2ForcingWm2} W/m²
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">PLANETARY ALBEDO (α)</span>
                  <span className="text-lg font-bold text-emerald-300">
                    {climateResults.finalState?.albedo}
                  </span>
                </div>
              </div>

              {/* Temperature Trajectory Chart (Clean SVG Vector Graph) */}
              <div className="bg-black/60 border border-white/10 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-white">
                    MULTI-DECADAL TEMPERATURE TRAJECTORY (°C)
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    T_eq = [ ((S_0*(1-α))/4 + ΔF) / (εσ) ]^(1/4)
                  </span>
                </div>

                <div className="h-56 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                    <line x1="40" y1="80" x2="480" y2="80" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                    <line x1="40" y1="140" x2="480" y2="140" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                    <line x1="40" y1="180" x2="480" y2="180" stroke="#475569" opacity="0.8" />
                    <line x1="40" y1="20" x2="40" y2="180" stroke="#475569" opacity="0.8" />

                    {/* Polyline for temperature trajectory */}
                    {(() => {
                      const points = climateResults.trajectory;
                      if (!points || points.length === 0) return null;
                      const minT = Math.min(...points.map((p) => p.tempC)) - 1;
                      const maxT = Math.max(...points.map((p) => p.tempC)) + 1;
                      const rangeT = Math.max(1, maxT - minT);

                      const svgCoords = points.map((p, idx) => {
                        const x = 40 + (idx / (points.length - 1)) * 440;
                        const y = 180 - ((p.tempC - minT) / rangeT) * 150;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#00f2fe"
                            strokeWidth="2.5"
                            points={svgCoords}
                          />
                          {points.map((p, idx) => {
                            if (idx % 5 !== 0 && idx !== points.length - 1) return null;
                            const x = 40 + (idx / (points.length - 1)) * 440;
                            const y = 180 - ((p.tempC - minT) / rangeT) * 150;
                            return (
                              <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r="3.5"
                                fill="#00f2fe"
                                stroke="#030712"
                                strokeWidth="1"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-4">
                  <span>Year 0</span>
                  <span>Year {Math.round(climateParams.simulationYears / 2)}</span>
                  <span>Year {climateParams.simulationYears}</span>
                </div>
              </div>

              {/* Scientific Assumptions Footnote */}
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded text-[11px] text-gray-400">
                <span className="text-cyan-400 font-semibold block mb-1">MODEL METHODOLOGY & LIMITATIONS:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  {climateResults.modelNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================= ASTEROID IMPACT MODULE ================= */}
        {activeModule === 'impact' && impactResults && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Controls */}
            <div className="bg-black/60 border border-white/10 rounded-lg p-5">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>IMPACTOR PARAMETERS</span>
              </h2>

              {/* Historic Impact Presets */}
              <div className="mb-4">
                <label className="text-[11px] text-gray-400 block mb-1.5">HISTORIC EVENT PRESETS:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(IMPACT_PRESETS).map(([key, pst]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setImpactParams((prev) => ({
                          ...prev,
                          preset: key,
                          diameterM: pst.diameterM,
                          densityKgm3: pst.densityKgm3,
                          velocityKms: pst.velocityKms,
                          impactAngleDeg: pst.impactAngleDeg
                        }));
                      }}
                      className={`text-left p-2 rounded border text-xs transition-all ${
                        impactParams.preset === key
                          ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200 font-semibold'
                          : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="font-sans font-bold">{pst.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        D={pst.diameterM}m | v={pst.velocityKms} km/s | θ={pst.impactAngleDeg}°
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">IMPACTOR DIAMETER:</span>
                    <span className="text-cyan-300 font-bold">{impactParams.diameterM} m</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={impactParams.diameterM}
                    onChange={(e) => setImpactParams({ ...impactParams, diameterM: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">IMPACTOR DENSITY:</span>
                    <span className="text-cyan-300 font-bold">{impactParams.densityKgm3} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="100"
                    value={impactParams.densityKgm3}
                    onChange={(e) => setImpactParams({ ...impactParams, densityKgm3: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                    <span>Ice (1000)</span>
                    <span>Stone (3000)</span>
                    <span>Iron (7800)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">IMPACT VELOCITY:</span>
                    <span className="text-cyan-300 font-bold">{impactParams.velocityKms} km/s</span>
                  </div>
                  <input
                    type="range"
                    min="11.2"
                    max="72.0"
                    step="0.5"
                    value={impactParams.velocityKms}
                    onChange={(e) => setImpactParams({ ...impactParams, velocityKms: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    Earth escape velocity min = 11.2 km/s
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">IMPACT ANGLE:</span>
                    <span className="text-cyan-300 font-bold">{impactParams.impactAngleDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={impactParams.impactAngleDeg}
                    onChange={(e) => setImpactParams({ ...impactParams, impactAngleDeg: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Results Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Physics Output Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">KINETIC ENERGY</span>
                  <span className="text-base font-bold text-white">
                    {impactResults.physics.megatonsTNT.toFixed(2)} MT TNT
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">FINAL CRATER DIAMETER</span>
                  <span className="text-base font-bold text-cyan-300">
                    {impactResults.crater.finalDiameterKm >= 1
                      ? `${impactResults.crater.finalDiameterKm} km`
                      : `${impactResults.crater.finalDiameterM} m`}
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">SEISMIC MAGNITUDE</span>
                  <span className="text-base font-bold text-amber-400">
                    M {impactResults.environmentalEffects.seismicMagnitude}
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">CRATER DEPTH</span>
                  <span className="text-base font-bold text-emerald-300">
                    {impactResults.crater.finalDepthM} m
                  </span>
                </div>
              </div>

              {/* Damage Radii Visual Bar */}
              <div className="bg-black/60 border border-white/10 p-4 rounded-lg">
                <h3 className="text-xs font-bold text-white mb-2">
                  ENVIRONMENTAL BLAST & DAMAGE EXTENTS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-red-300 font-bold">5-psi Severe Airblast Radius:</span>
                      <span className="text-white font-bold">{impactResults.environmentalEffects.blastRadius5psiKm} km</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Severe multistory residential collapse and widespread structural demolition.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-amber-300 font-bold">Thermal Fireball Radius:</span>
                      <span className="text-white font-bold">{impactResults.environmentalEffects.thermalFireballRadiusKm} km</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Radiant thermal flux sufficient to ignite clothing and produce 3rd-degree burns.
                    </p>
                  </div>
                </div>
              </div>

              {/* Exact Formula & Scaling Attribution */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-lg text-xs">
                <h4 className="text-cyan-400 font-bold mb-2">DETERMINISTIC FORMULAS:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">VOLUME:</span>
                    <span>V = (4/3) × π × r³ = {impactResults.physics.volumeM3.toExponential(2)} m³</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">MASS:</span>
                    <span>M = ρ × V = {impactResults.physics.massKg.toExponential(2)} kg</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">KINETIC ENERGY:</span>
                    <span>E_k = 0.5 × M × v² = {impactResults.physics.energyJoules.toExponential(2)} J</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">CRATER MORPHOLOGY:</span>
                    <span>{impactResults.crater.craterType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ORBITAL MECHANICS MODULE ================= */}
        {activeModule === 'orbit' && orbitResults && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Controls */}
            <div className="bg-black/60 border border-white/10 rounded-lg p-5">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>KEPLERIAN ORBIT CONTROLS</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">CENTRAL GRAVITATIONAL BODY:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrbitParams({ ...orbitParams, centralBody: 'sun', semiMajorAxisAU: 1.0 })}
                      className={`p-2 rounded border text-xs text-left ${
                        orbitParams.centralBody === 'sun'
                          ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200 font-bold'
                          : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      Sun (1.989 × 10³⁰ kg)
                    </button>
                    <button
                      onClick={() => setOrbitParams({ ...orbitParams, centralBody: 'earth', semiMajorAxisAU: 0.00257 })}
                      className={`p-2 rounded border text-xs text-left ${
                        orbitParams.centralBody === 'earth'
                          ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200 font-bold'
                          : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      Earth (5.972 × 10²⁴ kg)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">SEMI-MAJOR AXIS (a):</span>
                    <span className="text-cyan-300 font-bold">{orbitParams.semiMajorAxisAU} AU</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.05"
                    value={orbitParams.semiMajorAxisAU}
                    onChange={(e) => setOrbitParams({ ...orbitParams, semiMajorAxisAU: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">ECCENTRICITY (e):</span>
                    <span className="text-cyan-300 font-bold">{orbitParams.eccentricity}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.01"
                    value={orbitParams.eccentricity}
                    onChange={(e) => setOrbitParams({ ...orbitParams, eccentricity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                    <span>Circular (0.0)</span>
                    <span>Elliptic (0.5)</span>
                    <span>Highly Elliptic (0.85)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">TRUE ANOMALY (ν):</span>
                    <span className="text-cyan-300 font-bold">{orbitParams.trueAnomalyDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={orbitParams.trueAnomalyDeg}
                    onChange={(e) => setOrbitParams({ ...orbitParams, trueAnomalyDeg: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Orbital State Columns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">CURRENT ORBITAL VELOCITY</span>
                  <span className="text-base font-bold text-cyan-300">
                    {orbitResults.currentVelocityKmS.toFixed(2)} km/s
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">ORBITAL PERIOD (T)</span>
                  <span className="text-base font-bold text-white">
                    {orbitResults.periodDays.toFixed(1)} Days
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">PERIAPSIS (CLOSEST)</span>
                  <span className="text-base font-bold text-emerald-300">
                    {(orbitResults.periapsisKm / 1e6).toFixed(2)}M km
                  </span>
                </div>
                <div className="bg-black/60 border border-white/10 p-3 rounded-lg">
                  <span className="text-[10px] text-gray-500 block">APOAPSIS (FURTHEST)</span>
                  <span className="text-base font-bold text-amber-300">
                    {(orbitResults.apoapsisKm / 1e6).toFixed(2)}M km
                  </span>
                </div>
              </div>

              {/* 2D Orbital Geometry Cross-Section Diagram */}
              <div className="bg-black/60 border border-white/10 p-4 rounded-lg">
                <h3 className="text-xs font-bold text-white mb-2">
                  KEPLERIAN ORBIT SCHEMATIC (VIS-VIVA PROPAGATION)
                </h3>
                <div className="h-56 w-full flex items-center justify-center relative bg-black/40 rounded border border-white/5">
                  <svg className="w-full h-full max-w-md" viewBox="-120 -80 240 160">
                    {/* Ellipse Orbit */}
                    {(() => {
                      const a = 80;
                      const b = a * Math.sqrt(Math.max(0.1, 1 - Math.pow(orbitParams.eccentricity, 2)));
                      const focus = a * orbitParams.eccentricity;
                      const nuRad = (orbitParams.trueAnomalyDeg * Math.PI) / 180;
                      const r = (a * (1 - Math.pow(orbitParams.eccentricity, 2))) / (1 + orbitParams.eccentricity * Math.cos(nuRad));
                      const satX = r * Math.cos(nuRad) - focus;
                      const satY = -r * Math.sin(nuRad);

                      return (
                        <>
                          {/* Central Star at Focus */}
                          <circle cx={-focus} cy="0" r="7" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                          <text x={-focus} y="-12" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace">FOCUS (M)</text>

                          {/* Elliptical Path */}
                          <ellipse
                            cx="0"
                            cy="0"
                            rx={a}
                            ry={b}
                            fill="none"
                            stroke="#00f2fe"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            opacity="0.85"
                          />

                          {/* Satellite Marker */}
                          <circle cx={satX} cy={satY} r="4" fill="#ffffff" stroke="#00f2fe" strokeWidth="2" />
                          <line x1={-focus} y1="0" x2={satX} y2={satY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                          <text x={satX} y={satY + 12} textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">SATELLITE</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Exact Equations */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-lg text-xs">
                <span className="text-cyan-400 font-bold block mb-1">PHYSICS FORMULATIONS APPLIED:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-300">
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">VIS-VIVA EQUATION:</span>
                    <span>v = √(μ × (2/r - 1/a))</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">KEPLER'S THIRD LAW:</span>
                    <span>T = 2π × √(a³ / μ)</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">SPECIFIC ENERGY:</span>
                    <span>ε = -μ / (2a) = {orbitResults.specificEnergyJkg.toExponential(2)} J/kg</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5">
                    <span className="text-gray-500 block text-[10px]">ESCAPE VELOCITY AT r:</span>
                    <span>v_esc = √(2μ/r) = {orbitResults.escapeVelocityKmS.toFixed(2)} km/s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

