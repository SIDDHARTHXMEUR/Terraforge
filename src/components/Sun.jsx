import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function Sun({ isTrueScale = false, radius = 8.5, onClick, isSelected = false }) {
  const sunTexture = useTexture('/textures/sun/sun_surface.jpg');
  const sunMeshRef = useRef();

  // Slow rotation of solar photosphere
  useFrame((_, delta) => {
    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.y += delta * 0.05;
    }
  });

  const effectiveRadius = isTrueScale ? 109.3 : radius;

  return (
    <group position={[0, 0, 0]} onClick={onClick}>
      {/* Primary Omnidirectional Point Light from Sun Center to all orbiting planets */}
      <pointLight
        position={[0, 0, 0]}
        intensity={3.8}
        distance={1000}
        decay={0.05}
        color="#fffaf0"
      />

      {/* Directional Key Lights providing crisp day/night terminators */}
      <directionalLight position={[10, 5, 10]} intensity={0.6} color="#ffffff" />
      <directionalLight position={[-10, 5, -10]} intensity={0.6} color="#ffffff" />

      {/* Balanced deep space ambient light so dark sides remain readable */}
      <ambientLight intensity={0.12} color="#1e293b" />

      {/* Glowing Sun Photosphere Sphere */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[effectiveRadius, 64, 64]} />
        <meshBasicMaterial
          map={sunTexture}
          color="#ffffff"
        />
      </mesh>

      {/* Atmospheric Solar Corona Glow */}
      <mesh>
        <sphereGeometry args={[effectiveRadius * 1.06, 64, 64]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Focus indicator */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[effectiveRadius * 1.25, effectiveRadius * 1.35, 64]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
