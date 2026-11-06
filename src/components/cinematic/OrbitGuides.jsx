import React, { useMemo } from 'react';
import * as THREE from 'three';

const ORBIT_COLORS = {
  mercury: '#9ca3af',
  venus: '#eab308',
  earth: '#38bdf8',
  mars: '#f97316',
  asteroids: '#a8a29e',
  jupiter: '#facc15',
  saturn: '#fde047',
  uranus: '#67e8f9',
  neptune: '#60a5fa'
};

function OrbitLine({ radius, color = '#38bdf8', opacity = 0.22 }) {
  const lineGeometry = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <lineLoop geometry={lineGeometry}>
      <lineBasicMaterial
        color={color}
        transparent={true}
        opacity={opacity}
        depthWrite={false}
      />
    </lineLoop>
  );
}

export function OrbitGuides({
  radii = {
    mercury: 24,
    venus: 36,
    earth: 50,
    mars: 66,
    asteroidsInner: 78,
    asteroidsOuter: 94,
    jupiter: 122,
    saturn: 165,
    uranus: 208,
    neptune: 250
  },
  visible = true
}) {
  if (!visible) return null;

  return (
    <group>
      <OrbitLine radius={radii.mercury} color={ORBIT_COLORS.mercury} opacity={0.28} />
      <OrbitLine radius={radii.venus} color={ORBIT_COLORS.venus} opacity={0.26} />
      <OrbitLine radius={radii.earth} color={ORBIT_COLORS.earth} opacity={0.32} />
      <OrbitLine radius={radii.mars} color={ORBIT_COLORS.mars} opacity={0.28} />
      <OrbitLine radius={radii.asteroidsInner} color={ORBIT_COLORS.asteroids} opacity={0.16} />
      <OrbitLine radius={radii.asteroidsOuter} color={ORBIT_COLORS.asteroids} opacity={0.16} />
      <OrbitLine radius={radii.jupiter} color={ORBIT_COLORS.jupiter} opacity={0.28} />
      <OrbitLine radius={radii.saturn} color={ORBIT_COLORS.saturn} opacity={0.28} />
      <OrbitLine radius={radii.uranus} color={ORBIT_COLORS.uranus} opacity={0.24} />
      <OrbitLine radius={radii.neptune} color={ORBIT_COLORS.neptune} opacity={0.24} />
    </group>
  );
}
