import React, { useMemo } from 'react';
import * as THREE from 'three';

export function LandingStarfield({ count = 2400 }) {
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distribute on a spherical dome
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 250 + Math.random() * 100;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Star color variation: subtle warm whites, pale blues, creams
      const temp = Math.random();
      if (temp > 0.8) {
        // Pale blue
        col[i * 3] = 0.85; col[i * 3 + 1] = 0.92; col[i * 3 + 2] = 1.0;
      } else if (temp > 0.4) {
        // Warm cream / white
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.97; col[i * 3 + 2] = 0.91;
      } else {
        // Faint golden
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.88; col[i * 3 + 2] = 0.75;
      }
    }
    return [pos, col];
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.1}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
