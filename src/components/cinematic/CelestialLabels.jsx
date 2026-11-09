import React, { useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DISPLAY_RADII } from '../../data/displayScale';

// Calibrated aerospace editorial label offsets designed to prevent text collisions
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
  const { camera } = useThree();
  const [isBehindSun, setIsBehindSun] = useState(false);

  // Synchronously update label group position and test Sun disc occlusion
  useFrame(() => {
    if (groupRef.current && position) {
      groupRef.current.position.set(position[0], position[1] + yLift, position[2]);
    }

    if (id !== 'sun' && position) {
      const cPos = camera.position;
      const bVec = new THREE.Vector3(position[0], position[1] + yLift, position[2]);
      const rayDir = new THREE.Vector3().subVectors(bVec, cPos);
      const distToBody = rayDir.length();
      rayDir.normalize();

      // Sun is at [0, 0, 0] with radius DISPLAY_RADII.sun
      const toSun = new THREE.Vector3(0, 0, 0).sub(cPos);
      const t = toSun.dot(rayDir);

      if (t > 0 && t < distToBody) {
        const closestPoint = cPos.clone().addScaledVector(rayDir, t);
        const distFromSunCenter = closestPoint.length();
        const occluded = distFromSunCenter < (DISPLAY_RADII.sun * 1.05);
        if (occluded !== isBehindSun) setIsBehindSun(occluded);
      } else {
        if (isBehindSun) setIsBehindSun(false);
      }
    }
  });

  const tickLength = 16;
  const endX = offsetX + (offsetX > 0 ? tickLength : -tickLength);
  const isVisible = (!hoverOnly || isHovered) && isVisibleOverall && !isBehindSun;

  return (
    <group ref={groupRef} position={[position[0], position[1] + yLift, position[2]]}>
      <Html
        center={false}
        occlude={false}
        position={[0, 0, 0]}
        pointerEvents={isVisible ? 'auto' : 'none'}
        style={{
          pointerEvents: isVisible ? 'auto' : 'none',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          opacity: isVisible ? 1 : 0,
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
            <circle cx="0" cy="0" r={1.2} fill="rgba(255, 255, 255, 0.9)" />
            <polyline
              points={`0,0 ${offsetX},${offsetY} ${endX},${offsetY}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="0.75"
            />
          </svg>

          {/* Understated Text Label */}
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
