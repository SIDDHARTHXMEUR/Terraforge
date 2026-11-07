import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { DISPLAY_RADII } from '../../data/displayScale';

// Calibrated aerospace editorial label offsets designed to prevent text collisions
// Alternating quad-direction vectors ensure inner planets (Mercury, Venus, Earth, Mars, Ceres)
// never collide even during orbital conjunctions.
const CELESTIAL_BODIES = [
  { id: 'sun', label: 'SOL', offset: [65, -55], yLift: DISPLAY_RADII.sun * 1.05 },
  { id: 'mercury', label: 'MERCURY', offset: [40, -25], yLift: DISPLAY_RADII.mercury * 1.25 },
  { id: 'venus', label: 'VENUS', offset: [45, 30], yLift: DISPLAY_RADII.venus * 1.25 },
  { id: 'earth', label: 'EARTH', offset: [52, -48], yLift: DISPLAY_RADII.earth * 1.25 },
  { id: 'mars', label: 'MARS', offset: [-50, -35], yLift: DISPLAY_RADII.mars * 1.25 },
  { id: 'asteroids', label: 'CERES', offset: [-45, 30], yLift: DISPLAY_RADII.ceres * 1.5, hoverOnly: true },
  { id: 'jupiter', label: 'JUPITER', offset: [65, -55], yLift: DISPLAY_RADII.jupiter * 1.15 },
  { id: 'saturn', label: 'SATURN', offset: [-65, -55], yLift: DISPLAY_RADII.saturn * 1.15 },
  { id: 'uranus', label: 'URANUS', offset: [50, 40], yLift: DISPLAY_RADII.uranus * 1.20 },
  { id: 'neptune', label: 'NEPTUNE', offset: [-50, 40], yLift: DISPLAY_RADII.neptune * 1.20 }
];

function CelestialLabelItem({
  id,
  label,
  offset,
  yLift,
  position,
  isSelected,
  hoverOnly = false,
  onSelect
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [offsetX, offsetY] = offset;

  // Leader line geometry: from anchor (0, 0) up-right to (offsetX, offsetY)
  const tickLength = 16;
  const endX = offsetX + (offsetX > 0 ? tickLength : -tickLength);
  const isVisible = !hoverOnly || isHovered;

  return (
    <group position={[position[0], position[1] + yLift, position[2]]}>
      <Html
        center={false}
        position={[0, 0, 0]}
        pointerEvents="auto"
        style={{
          pointerEvents: 'auto',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
      >
        <div
          className="relative group cursor-pointer select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (!hoverOnly && onSelect) onSelect(id);
          }}
          style={{ width: '1px', height: '1px' }}
        >
          {/* Thin Leader Line: delicate aerospace aesthetic */}
          <svg
            className="absolute overflow-visible pointer-events-none transition-opacity duration-300"
            style={{
              top: 0,
              left: 0,
              opacity: isVisible ? (isHovered || isSelected ? 0.95 : 0.25) : 0
            }}
          >
            {/* Anchor tick dot at planet position */}
            <circle
              cx="0"
              cy="0"
              r={isHovered ? 1.5 : 1.0}
              fill="rgba(255, 255, 255, 0.85)"
            />
            {/* Angled leader line extending outward */}
            <polyline
              points={`0,0 ${offsetX},${offsetY} ${endX},${offsetY}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth={isHovered ? '1.0' : '0.65'}
              strokeDasharray={isHovered ? 'none' : '2 2'}
            />
          </svg>

          {/* Plain, Understated Swiss Editorial Label Text */}
          <div
            className={`absolute whitespace-nowrap transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
              left: `${endX + (offsetX > 0 ? 6 : -6)}px`,
              top: `${offsetY}px`,
              transform: `translate(${offsetX > 0 ? '0' : '-100%'}, -50%)`
            }}
          >
            <span
              className={`font-mono uppercase transition-all duration-300 block ${
                isSelected
                  ? 'text-white text-[10px] tracking-[0.3em] font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : isHovered
                  ? 'text-white text-[10px] tracking-[0.25em] font-normal drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                  : 'text-white/50 hover:text-white/80 text-[9px] tracking-[0.22em] font-light'
              }`}
            >
              {label}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

export function CelestialLabels({
  bodyPositions = {},
  selectedBody = 'overview',
  visible = true,
  onSelectBody
}) {
  if (!visible) return null;

  // In close-up view of an individual planet, hide all planetary labels so cinematic view is 100% pristine and unobstructed
  const isOverview = selectedBody === 'overview';
  if (!isOverview) return null;

  return (
    <group>
      {CELESTIAL_BODIES.map(({ id, label, offset, yLift, hoverOnly }) => {
        const pos = bodyPositions[id] || [0, 0, 0];
        const isSelected = selectedBody === id;

        return (
          <CelestialLabelItem
            key={id}
            id={id}
            label={label}
            offset={offset}
            yLift={yLift}
            position={pos}
            isSelected={isSelected}
            hoverOnly={hoverOnly}
            onSelect={onSelectBody}
          />
        );
      })}
    </group>
  );
}
