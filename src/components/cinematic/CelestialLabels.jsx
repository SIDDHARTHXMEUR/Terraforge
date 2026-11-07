import React, { useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
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
  isVisibleOverall = true,
  onSelect
}) {
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef();
  const [offsetX, offsetY] = offset;

  // Synchronously update label group position in same frame loop
  useFrame(() => {
    if (groupRef.current && position) {
      groupRef.current.position.set(position[0], position[1] + yLift, position[2]);
    }
  });

  // Leader line geometry: from anchor (0, 0) up-right to (offsetX, offsetY)
  const tickLength = 16;
  const endX = offsetX + (offsetX > 0 ? tickLength : -tickLength);
  const isVisible = (!hoverOnly || isHovered) && isVisibleOverall;

  return (
    <group ref={groupRef} position={[position[0], position[1] + yLift, position[2]]}>
      <Html
        center={false}
        occlude={false}
        position={[0, 0, 0]}
        pointerEvents={isVisibleOverall ? 'auto' : 'none'}
        style={{
          pointerEvents: isVisibleOverall ? 'auto' : 'none',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          opacity: isVisibleOverall ? 1 : 0,
          transition: 'opacity 0.08s linear'
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
          {/* Thin Leader Line: on hover only */}
          <svg
            className="absolute overflow-visible pointer-events-none transition-opacity duration-200"
            style={{
              top: 0,
              left: 0,
              opacity: isHovered ? 0.85 : 0
            }}
          >
            {/* Anchor tick dot at planet position */}
            <circle
              cx="0"
              cy="0"
              r={1.2}
              fill="rgba(255, 255, 255, 0.9)"
            />
            {/* Angled leader line extending outward */}
            <polyline
              points={`0,0 ${offsetX},${offsetY} ${endX},${offsetY}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="0.75"
            />
          </svg>

          {/* Plain, Understated 11px Plain Text Label */}
          <div
            className={`absolute whitespace-nowrap transition-all duration-200 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
              left: `${endX + (offsetX > 0 ? 6 : -6)}px`,
              top: `${offsetY}px`,
              transform: `translate(${offsetX > 0 ? '0' : '-100%'}, -50%)`
            }}
          >
            <span
              className={`font-mono uppercase transition-all duration-200 block text-[11px] tracking-[0.2em] ${
                isSelected
                  ? 'text-white font-medium'
                  : isHovered
                  ? 'text-white font-normal'
                  : 'text-white/60 hover:text-white font-normal'
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
  const isOverview = selectedBody === 'overview';
  const shouldShow = visible && isOverview;

  useFrame(() => {
    // DEV instrumentation: record toggle latency for labels
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.__lastToggleClick?.type === 'labels') {
      const click = window.__lastToggleClick;
      if ((click.target && shouldShow) || (!click.target && !shouldShow)) {
        const latency = Math.round(performance.now() - click.time);
        if (window.__perfMetrics) window.__perfMetrics.toggleLatencies.labels = latency;
        window.__lastToggleClick = null;
      }
    }
  });

  return (
    <group visible={isOverview}>
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
            isVisibleOverall={shouldShow}
            onSelect={onSelectBody}
          />
        );
      })}
    </group>
  );
}
