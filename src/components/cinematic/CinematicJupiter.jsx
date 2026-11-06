import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Jupiter with Galilean Moons (Io, Europa) and Dynamic Atmospheric Limb
export function CinematicJupiter({
  position = [0, 0, 0],
  radius = 5.2,
  isPlaying = true,
  onClick
}) {
  const [jupiterMap, ioMap, europaMap] = useTexture([
    '/assets/planets/jupiter/jupiter.jpg',
    '/assets/planets/moons/io.jpg',
    '/assets/planets/moons/europa.jpg'
  ]);

  const jupiterRef = useRef();
  const ioRef = useRef();
  const europaRef = useRef();
  const ioAngleRef = useRef(0.5);
  const europaAngleRef = useRef(2.1);

  useFrame((_, delta) => {
    if (isPlaying) {
      if (jupiterRef.current) {
        jupiterRef.current.rotation.y += delta * 0.18; // Fast 9.9 hour Jovian day
      }
      ioAngleRef.current += delta * 0.45;
      europaAngleRef.current += delta * 0.22;
    }

    // Io Orbit (421,700 km, volcanic sulphur moon)
    if (ioRef.current) {
      const ioDist = radius * 2.2;
      ioRef.current.position.set(
        Math.cos(ioAngleRef.current) * ioDist,
        0,
        Math.sin(ioAngleRef.current) * ioDist
      );
      ioRef.current.rotation.y = -ioAngleRef.current;
    }

    // Europa Orbit (670,900 km, subsurface water ice ocean)
    if (europaRef.current) {
      const euDist = radius * 3.4;
      europaRef.current.position.set(
        Math.cos(europaAngleRef.current) * euDist,
        0.2,
        Math.sin(europaAngleRef.current) * euDist
      );
      europaRef.current.rotation.y = -europaAngleRef.current;
    }
  });

  return (
    <group position={position} rotation={[(3.13 * Math.PI) / 180, 0, 0]} onClick={onClick}>
      {/* 1. Jupiter Gas Giant Body */}
      <mesh ref={jupiterRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={jupiterMap}
          roughness={0.92}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Warm Amber Atmospheric Limb Rim */}
      <mesh scale={1.03}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="#d99852"
          transparent={true}
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Io (Volcanic Sulphur Galilean Moon) */}
      <mesh ref={ioRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.08, 48, 48]} />
        <meshStandardMaterial
          map={ioMap}
          roughness={0.9}
        />
      </mesh>

      {/* 4. Europa (Smooth Ice Shell Galilean Moon) */}
      <mesh ref={europaRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.07, 48, 48]} />
        <meshStandardMaterial
          map={europaMap}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

