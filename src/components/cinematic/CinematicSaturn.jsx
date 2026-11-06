import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Saturn with double-sided Cassini Division Ring System + Ring Shadow projection
const SATURN_AXIAL_TILT = (26.73 * Math.PI) / 180;

export function CinematicSaturn({
  position = [0, 0, 0],
  radius = 3.6,
  isPlaying = true,
  onClick
}) {
  const [saturnMap, ringMap] = useTexture([
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png'
  ]);

  const saturnBodyRef = useRef();
  const ringRef = useRef();

  // Create high-density custom Ring Geometry with radial UV mapping
  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.35;
    const outerRadius = radius * 2.85;
    const thetaSegments = 160;
    const phiSegments = 32;

    const geo = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;

    // Map planar ring coordinates to radial 1D UV along texture
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u = (dist - innerRadius) / (outerRadius - innerRadius);
      uvs.setXY(i, u, 0.5);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);

  useFrame((_, delta) => {
    if (isPlaying && saturnBodyRef.current) {
      saturnBodyRef.current.rotation.y += delta * 0.16;
    }
  });

  return (
    <group position={position} rotation={[SATURN_AXIAL_TILT, 0, 0]} onClick={onClick}>
      {/* 1. Saturn Gas Giant Atmosphere Body */}
      <mesh ref={saturnBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={saturnMap}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Saturn Subtle Pale Gold Atmospheric Limb Scattering */}
      <mesh scale={1.03}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent={true}
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Physically Photorealistic Cassini Ring Structure */}
      <mesh
        ref={ringRef}
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={ringMap}
          transparent={true}
          opacity={0.96}
          roughness={0.85}
          metalness={0.05}
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>
    </group>
  );
}
