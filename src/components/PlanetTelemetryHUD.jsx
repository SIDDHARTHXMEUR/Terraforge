import React, { useMemo } from 'react';
import { Users, Trees, Waves, Wind, Activity, Thermometer } from 'lucide-react';

export function PlanetTelemetryHUD({ sim }) {
  const temp = sim.temp;

  // Determine Ecosystem State & 5 Key Points based on Temperature
  const telemetry = useMemo(() => {
    if (temp <= -10) {
      // ICE / FROSTWORLD (-60°C to -10°C)
      return {
        climateName: 'Frostworld (Cryogenic)',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        points: [
          { icon: Users, label: 'Population', value: '~0.02B', detail: 'Sub-surface Thermal Shelters' },
          { icon: Trees, label: 'Ecosystem', value: 'Cryogenic', detail: 'Dormant Glacial Microbes' },
          { icon: Waves, label: 'Oceans', value: '100% Frozen', detail: 'Global Ice Sheet (High Albedo)' },
          { icon: Wind, label: 'Atmosphere', value: 'Blizzard', detail: 'Sub-Zero Nitrogen Frost' },
          { icon: Activity, label: 'Biosphere', value: 'Frozen', detail: 'Photosynthesis Halted (-60°C)' }
        ]
      };
    } else if (temp >= 35) {
      // DESERT / SCORCHED EXPANSE (+35°C to +60°C)
      return {
        climateName: 'Scorched Expanse (Arid)',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        points: [
          { icon: Users, label: 'Population', value: '~0.15B', detail: 'Polar Relocation Camps' },
          { icon: Trees, label: 'Ecosystem', value: 'Desertified', detail: 'Arid Scrub & Drought Flora' },
          { icon: Waves, label: 'Oceans', value: 'Desiccated', detail: 'Evaporated Basins & Salt Flats' },
          { icon: Wind, label: 'Atmosphere', value: 'Dust Haze', detail: 'Thermal CO₂ Greenhouse Trap' },
          { icon: Activity, label: 'Biosphere', value: 'Heat Stress', detail: 'Severe Water Deficit (+60°C)' }
        ]
      };
    } else {
      // EARTH / TERRA (-9°C to +34°C)
      return {
        climateName: 'Terra (Habitable Zone)',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        points: [
          { icon: Users, label: 'Population', value: '~8.10B', detail: 'Optimal Human Habitability' },
          { icon: Trees, label: 'Ecosystem', value: 'Thriving', detail: 'Lush Forests & Agriculture' },
          { icon: Waves, label: 'Oceans', value: 'Liquid Water', detail: '71% Ocean Surface Coverage' },
          { icon: Wind, label: 'Atmosphere', value: 'N₂/O₂ Mix', detail: '1.0 atm Stable Pressure' },
          { icon: Activity, label: 'Biosphere', value: 'Optimal', detail: 'Active Photosynthesis (+15°C)' }
        ]
      };
    }
  }, [temp]);

  return (
    <div className="fixed bottom-4 right-4 z-20 pointer-events-auto solar-drawer bg-[#0f1115]/85 backdrop-blur-2xl border border-white/10 p-3.5 rounded-2xl w-72 text-white shadow-2xl animate-fade-in space-y-2.5">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#00f2fe]/20 text-[#00f2fe]">
            <Thermometer className="w-3.5 h-3.5" />
          </div>
          <span className="font-outfit font-bold text-xs tracking-wider uppercase text-[#00f2fe]">
            Planetary Telemetry
          </span>
        </div>
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${telemetry.badgeColor}`}>
          {temp > 0 ? `+${temp.toFixed(0)}°C` : `${temp.toFixed(0)}°C`}
        </span>
      </div>

      {/* 5 Key Environmental Impact Points */}
      <div className="space-y-1.5">
        {telemetry.points.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className="bg-white/[0.03] hover:bg-white/[0.06] p-1.5 px-2 rounded-xl border border-white/[0.06] transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <IconComponent className="w-3.5 h-3.5 text-[#00f2fe] shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] font-semibold text-gray-200 leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[9px] text-gray-400 truncate">
                    {item.detail}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-[#00f2fe] shrink-0 ml-1">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
