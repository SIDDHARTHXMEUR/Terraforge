import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PLANETS_DATA, CELESTIAL_ORDER } from '../data/planetsData';
import { generateOrbitalTrajectoryPoints } from '../math/orbitalMechanics';

export function OrbitsVisualizer({
  showOrbits = true,
  selectedPlanet = 'earth',
  onSelectPlanet
}) {
  if (!showOrbits) return null;

  // Generate trajectory line loops for each planet
  const orbitPaths = useMemo(() => {
    return CELESTIAL_ORDER.filter(id => id !== 'moon').map((id) => {
      const data = PLANETS_DATA[id];
      const radius = data.orbitRadiusDisplay;
      const eccentricity = data.eccentricity || 0;
      const inclinationRad = ((data.inclinationDeg || 0) * Math.PI) / 180;

      const points = generateOrbitalTrajectoryPoints(radius, eccentricity, inclinationRad, 96);
      const vectors = points.map(p => new THREE.Vector3(p.x, p.y, p.z));

      // Close loop
      if (vectors.length > 0) {
        vectors.push(vectors[0].clone());
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(vectors);

      return {
        id,
        name: data.name,
        geometry,
        color: id === selectedPlanet ? '#00f2fe' : '#334155',
        opacity: id === selectedPlanet ? 0.9 : 0.35,
        lineWidth: id === selectedPlanet ? 2 : 1
      };
    });
  }, [selectedPlanet]);

  return (
    <group>
      {orbitPaths.map((orbit) => (
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
