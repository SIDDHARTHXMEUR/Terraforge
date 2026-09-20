import React from 'react';
import { Thermometer, Cloud, Sun, RotateCw, Sliders, X } from 'lucide-react';

export function SimControls({ sim, updateSim, onClose }) {
  return (
    <div className="solar-drawer p-4 rounded-2xl text-white space-y-4 w-80 shadow-2xl animate-fade-in border border-white/15">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="font-outfit font-semibold text-sm flex items-center gap-2 text-[#00f2fe] uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-[#00f2fe]" /> Simulation Parameters
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Temperature Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 text-gray-300">
            <Thermometer className="w-4 h-4 text-red-400" /> Temperature
          </span>
          <span className="font-mono text-red-300 font-semibold">
            {sim.temp > 0 ? `+${sim.temp.toFixed(0)}` : sim.temp.toFixed(0)} °C
          </span>
        </div>
        <input
          type="range"
          min="-60"
          max="60"
          step="1"
          value={sim.temp}
          onChange={(e) => updateSim('temp', parseFloat(e.target.value))}
          className="w-full accent-red-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>-60°C (Ice)</span>
          <span>+15°C (Earth)</span>
          <span>+60°C (Desert)</span>
        </div>
      </div>

      {/* Cloud Coverage Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 text-gray-300">
            <Cloud className="w-4 h-4 text-sky-400" /> Cloud Coverage
          </span>
          <span className="font-mono text-sky-300 font-semibold">
            {(sim.cloudCoverage * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={sim.cloudCoverage}
          onChange={(e) => updateSim('cloudCoverage', parseFloat(e.target.value))}
          className="w-full accent-sky-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
        />
      </div>

      {/* Atmosphere Intensity Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 text-gray-300">
            <Sun className="w-4 h-4 text-[#00f2fe]" /> Atmosphere Glow
          </span>
          <span className="font-mono text-[#00f2fe] font-semibold">
            {sim.atmosphereIntensity.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={sim.atmosphereIntensity}
          onChange={(e) => updateSim('atmosphereIntensity', parseFloat(e.target.value))}
          className="w-full accent-[#00f2fe] cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
        />
      </div>

      {/* Rotation Speed Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 text-gray-300">
            <RotateCw className="w-4 h-4 text-teal-400 animate-spin-slow" /> Rotation Speed
          </span>
          <span className="font-mono text-teal-300 font-semibold">
            {sim.rotationSpeed.toFixed(2)}x
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={sim.rotationSpeed}
          onChange={(e) => updateSim('rotationSpeed', parseFloat(e.target.value))}
          className="w-full accent-teal-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
        />
      </div>
    </div>
  );
}
