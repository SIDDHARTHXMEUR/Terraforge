import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Pluto 122.53° Axial Tilt (Retrograde rotation)
const PLUTO_AXIAL_TILT = (122.53 * Math.PI) / 180;

export function CinematicPluto({
  position = [0, 0, 0],
  radius = 2.2,
  isPlaying = true,
  onClick
}) {
  const [plutoMap] = useTexture(['/assets/planets/ceres/ceres.jpg']);
  const plutoRef = useRef();

  useFrame((_, delta) => {
    if (isPlaying && plutoRef.current) {
      // 6.387 day slow retrograde rotation
      plutoRef.current.rotation.y += delta * 0.045;
    }
  });

  return (
    <group position={position} rotation={[0, 0, PLUTO_AXIAL_TILT]} onClick={onClick}>
      <mesh ref={plutoRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={plutoMap}
          bumpMap={plutoMap}
          bumpScale={0.06}
          roughness={0.88}
          metalness={0.02}
          color="#cfb095"
        />
      </mesh>
    </group>
  );
}
