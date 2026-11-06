import React from 'react';
import { Html } from '@react-three/drei';

const CELESTIAL_BODIES = [
  { id: 'sun', label: 'SOL', color: '#ffaa00' },
  { id: 'mercury', label: 'MERCURY', color: '#cbd5e1' },
  { id: 'venus', label: 'VENUS', color: '#fbbf24' },
  { id: 'earth', label: 'EARTH', color: '#38bdf8' },
  { id: 'mars', label: 'MARS', color: '#fb923c' },
  { id: 'asteroids', label: 'ASTEROID BELT', color: '#a8a29e' },
  { id: 'jupiter', label: 'JUPITER', color: '#fde047' },
  { id: 'saturn', label: 'SATURN', color: '#fef08a' },
  { id: 'uranus', label: 'URANUS', color: '#67e8f9' },
  { id: 'neptune', label: 'NEPTUNE', color: '#60a5fa' }
];

export function CelestialLabels({
  bodyPositions = {},
  selectedBody = 'overview',
  visible = true,
  onSelectBody
}) {
  if (!visible) return null;

  // When focusing on an individual planet, hide labels so the view is pristine and unobstructed
  const isOverview = selectedBody === 'overview';

  return (
    <group>
      {CELESTIAL_BODIES.map(({ id, label, color }) => {
        // If inspecting an individual body, only show labels if in overview, or never on the focused body
        if (!isOverview && selectedBody === id) return null;

        const pos = bodyPositions[id] || [0, 0, 0];
        const isSelected = selectedBody === id;

        return (
          <group key={id} position={[pos[0], pos[1] + (id === 'sun' ? 14 : 3.5), pos[2]]}>
            <Html center pointerEvents="auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectBody) onSelectBody(id);
                }}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all duration-300 backdrop-blur-md cursor-pointer whitespace-nowrap select-none ${
                  isSelected
                    ? 'bg-white/20 text-white border border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.4)] scale-105'
                    : 'bg-black/70 text-white/70 hover:text-white border border-white/10 hover:border-white/30 hover:bg-black/90'
                }`}
                style={{ transform: isOverview ? 'scale(1)' : 'scale(0.85)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
