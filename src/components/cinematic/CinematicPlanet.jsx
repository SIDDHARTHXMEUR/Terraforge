import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Dedicated Cinematic Planet Renderer for Mercury, Venus, Mars, Jupiter, Uranus, Neptune
export function CinematicPlanet({
  id,
  position = [0, 0, 0],
  radius = 2.0,
  axialTilt = 0,
  texturePath,
  atmosphereColor = '#4da6ff',
  atmosphereIntensity = 0.08,
  hasRings = false,
  isPlaying = true
}) {
  const planetTexture = useTexture(texturePath);
  const planetBodyRef = useRef();
  const cloudsRef = useRef();

  // If Venus, load the second cloud layer
  const venusAtmosphereMap = id === 'venus' ? useTexture('/assets/planets/venus/venus_atmosphere.jpg') : null;

  // Thin ring geometry for Uranus if specified
  const ringGeometry = useMemo(() => {
    if (!hasRings) return null;
    const innerRadius = radius * 1.5;
    const outerRadius = radius * 2.1;
    return new THREE.RingGeometry(innerRadius, outerRadius, 96);
  }, [hasRings, radius]);

  useFrame((_, delta) => {
    if (isPlaying) {
      if (planetBodyRef.current) {
        planetBodyRef.current.rotation.y += delta * 0.08;
      }
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * 0.12;
      }
    }
  });

  return (
    <group position={position} rotation={[axialTilt, 0, 0]}>
      {/* 1. Planetary Surface Mesh */}
      <mesh ref={planetBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={planetTexture}
          roughness={id === 'jupiter' || id === 'uranus' || id === 'neptune' ? 0.95 : 0.82}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Venus Dense Supercritical Cloud Atmosphere Layer */}
      {id === 'venus' && venusAtmosphereMap && (
        <mesh ref={cloudsRef} scale={1.025}>
          <sphereGeometry args={[radius, 96, 96]} />
          <meshStandardMaterial
            map={venusAtmosphereMap}
            transparent={true}
            opacity={0.88}
            blending={THREE.NormalBlending}
            roughness={1.0}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3. Atmospheric Limb Glow (Rayleigh scattering rim) */}
      {atmosphereIntensity > 0 && (
        <mesh scale={1.04}>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshBasicMaterial
            color={atmosphereColor}
            transparent={true}
            opacity={atmosphereIntensity}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 4. Planetary Rings (e.g. Uranus faint ice ring system) */}
      {hasRings && ringGeometry && (
        <mesh
          geometry={ringGeometry}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshBasicMaterial
            color="#bfe8ff"
            transparent={true}
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
