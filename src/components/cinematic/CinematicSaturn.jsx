import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const SATURN_AXIAL_TILT = (26.73 * Math.PI) / 180;

export function CinematicSaturn({
  position = [0, 0, 0],
  radius = 4.2,
  isSelected = false,
  onClick,
  isPlaying = true
}) {
  const planetRef = useRef();
  const ringRef = useRef();

  const saturnTexture = useTexture('/assets/planets/saturn/saturn.jpg');
  const ringTexture = useTexture('/assets/planets/saturn/saturn_ring.png');

  // Ring UV Radial Mapping Adjustment for RingGeometry
  const ringGeometry = useMemo(() => {
    const inner = radius * 1.25;
    const outer = radius * 2.45;
    const geo = new THREE.RingGeometry(inner, outer, 128);
    const pos = geo.attributes.position;
    const v3 = new THREE.Vector3();
    const uvs = [];

    // Map radial distance (inner -> 0.0, outer -> 1.0) along U coordinate
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const dist = Math.sqrt(v3.x * v3.x + v3.y * v3.y);
      const u = (dist - inner) / (outer - inner);
      uvs.push(u, 0.5);
    }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return geo;
  }, [radius]);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    // Saturn rotates rapidly (~10.6 hours)
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Selection highlight (subtle) */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 2.55, radius * 2.65, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Saturn Body and Ring Group with 26.73° Axial Tilt */}
      <group rotation={[SATURN_AXIAL_TILT, 0, 0]}>
        {/* Core Gas Giant Sphere */}
        <mesh ref={planetRef} castShadow receiveShadow>
          <sphereGeometry args={[radius, 96, 96]} />
          <meshStandardMaterial
            map={saturnTexture}
            roughness={0.75}
            metalness={0.05}
          />
        </mesh>

        {/* Atmospheric Limb Halo */}
        <mesh>
          <sphereGeometry args={[radius * 1.025, 64, 64]} />
          <meshBasicMaterial
            color="#fef08a"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Majestic Multi-Division Rings */}
        <mesh ref={ringRef} geometry={ringGeometry} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            map={ringTexture}
            transparent={true}
            opacity={0.92}
            side={THREE.DoubleSide}
            roughness={0.5}
            metalness={0.05}
            alphaTest={0.02}
          />
        </mesh>
      </group>
    </group>
  );
}
