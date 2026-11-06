import React, { useMemo } from 'react';
import * as THREE from 'three';

export function DeepSpaceSkybox() {
  // Generate 2,500 high-fidelity point stars with color temperature variations (O, B, A, F, G, K, M stellar types)
  const [starPositions, starColors] = useMemo(() => {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const stellarPalette = [
      new THREE.Color('#ffffff'), // Pure white
      new THREE.Color('#93c5fd'), // Blue-white (O/B star)
      new THREE.Color('#fef08a'), // Yellow-white (F/G star)
      new THREE.Color('#fed7aa'), // Orange (K star)
      new THREE.Color('#fca5a5')  // Red dwarf (M star)
    ];

    for (let i = 0; i < count; i++) {
      // Distribute on an expansive sphere of radius ~1,200
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1100 + Math.random() * 200;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = stellarPalette[Math.floor(Math.random() * stellarPalette.length)];
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starPositions.length / 3}
            array={starPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={starColors.length / 3}
            array={starColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors={true}
          transparent={true}
          opacity={0.85}
          sizeAttenuation={false}
        />
      </points>
    </group>
  );
}

