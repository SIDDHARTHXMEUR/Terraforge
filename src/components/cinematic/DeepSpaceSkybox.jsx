import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Dual-layer Deep Space Starfield & Cosmic Void:
// 1. High-resolution NASA astronomical deep-space skybox sphere surrounding the camera
// 2. 3,500 physical multi-spectral 3D point stars (O, B, A, F, G, K, M types) with depth parallax

export function DeepSpaceSkybox() {
  const skyboxMap = useTexture('/textures/sun/starfield_skybox.jpg');
  const skyboxRef = useRef();

  // Always center skybox sphere on camera position so stars are at optical infinity
  useFrame(({ camera }) => {
    if (skyboxRef.current) {
      skyboxRef.current.position.copy(camera.position);
    }
  });

  // 3,500 layered foreground & midground point stars
  const [starPositions, starColors] = useMemo(() => {
    const count = 3500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const stellarPalette = [
      new THREE.Color('#ffffff'), // Pure white
      new THREE.Color('#b0d8ff'), // Blue-white O/B
      new THREE.Color('#fff2ad'), // Warm white F/G
      new THREE.Color('#ffd599'), // Orange K
      new THREE.Color('#ffb3b3')  // Red dwarf M
    ];

    for (let i = 0; i < count; i++) {
      // Natural spherical dispersion between 150 and 900 units from solar origin
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 180 + Math.random() * 850;

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
      {/* 1. Version 1 Astronomical Skybox Sphere */}
      <mesh ref={skyboxRef}>
        <sphereGeometry args={[9000, 48, 48]} />
        <meshBasicMaterial
          map={skyboxMap}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. 3D Parallax Multi-spectral Point Stars */}
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
          size={2.4}
          vertexColors={true}
          transparent={true}
          opacity={0.92}
          sizeAttenuation={false}
        />
      </points>
    </group>
  );
}
