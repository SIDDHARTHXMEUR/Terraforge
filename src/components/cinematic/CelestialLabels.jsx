import React, { useState } from 'react';
import { Html } from '@react-three/drei';

const CELESTIAL_BODIES = [
  { id: 'sun', label: 'SOL', offset: [50, -40], yLift: 12.0 },
  { id: 'mercury', label: 'MERCURY', offset: [36, -26], yLift: 1.5 },
  { id: 'venus', label: 'VENUS', offset: [40, -30], yLift: 2.2 },
  { id: 'earth', label: 'EARTH', offset: [42, -32], yLift: 2.5 },
  { id: 'mars', label: 'MARS', offset: [38, -28], yLift: 1.8 },
  { id: 'asteroids', label: 'CERES', offset: [45, -35], yLift: 1.0, hoverOnly: true },
  { id: 'jupiter', label: 'JUPITER', offset: [55, -45], yLift: 6.0 },
  { id: 'saturn', label: 'SATURN', offset: [60, -50], yLift: 5.0 },
  { id: 'uranus', label: 'URANUS', offset: [44, -34], yLift: 3.5 },
  { id: 'neptune', label: 'NEPTUNE', offset: [44, -34], yLift: 3.5 }
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
