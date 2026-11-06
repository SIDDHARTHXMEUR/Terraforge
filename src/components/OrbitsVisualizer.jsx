import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PLANETS_CONFIG, SOLAR_SYSTEM_PLANETS } from '../data/planetsData';

export function OrbitsVisualizer({
  showOrbits = true,
  selectedPlanet = 'earth',
  isTrueScale = false,
  onSelectPlanet
}) {
  if (!showOrbits) return null;

  // Generate orbit ring curves centered at Sun [0, 0, 0]
  const orbits = useMemo(() => {
    return SOLAR_SYSTEM_PLANETS.map((id) => {
      const config = PLANETS_CONFIG[id];
      const radius = isTrueScale
        ? (config.semiMajorAxisAU || 1.0) * 35.0
        : (config.cinematicOrbitRadius || 30.0);

      const segments = 128;
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const isSelected = selectedPlanet === id;

      return {
        id,
        name: config.name,
        geometry,
        color: isSelected ? '#00f2fe' : '#475569',
        opacity: isSelected ? 0.9 : 0.35,
        lineWidth: isSelected ? 2 : 1
      };
    });
  }, [selectedPlanet, isTrueScale]);

  return (
    <group>
      {orbits.map((orbit) => (
        <line key={orbit.id} geometry={orbit.geometry}>
          <lineBasicMaterial
            color={orbit.color}
            transparent
            opacity={orbit.opacity}
            linewidth={orbit.lineWidth}
          />
        </line>
      ))}
    </group>
  );
}
