import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function CinematicPlanet({
  config,
  position = [0, 0, 0],
  radius = 2.0,
  isSelected = false,
  onClick,
  isPlaying = true
}) {
  const meshRef = useRef();
  const ringRef = useRef();

  // Load high-resolution planet texture
  const texture = useTexture(config.texture);

  const axialTiltRad = useMemo(() => {
    return ((config.axialTiltDeg || 0) * Math.PI) / 180;
  }, [config.axialTiltDeg]);

  const atmoColor = useMemo(() => {
    return new THREE.Color(config.atmosphereColor || '#38bdf8');
  }, [config.atmosphereColor]);

  useFrame((_, delta) => {
    if (!isPlaying) return;

    // Real individual rotational velocity (retrograde for Venus and Uranus)
    const sign = config.rotationPeriodHours && config.rotationPeriodHours < 0 ? -1 : 1;
    const speed = (24 / Math.abs(config.rotationPeriodHours || 24)) * 0.25;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * speed * sign;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Subtle Selection Halo */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.35, radius * 1.45, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Planetary Group with Real Astronomical Axial Tilt */}
      <group rotation={[axialTiltRad, 0, 0]}>
        {/* Core Planet Sphere */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[radius, 96, 96]} />
          <meshStandardMaterial
            map={texture}
            roughness={config.category?.includes('Gas') || config.category?.includes('Ice') ? 0.7 : 0.85}
            metalness={0.05}
          />
        </mesh>

        {/* Atmospheric Limb Scattering Glow for worlds with atmosphere */}
        {config.atmosphereIntensity > 0.15 && (
          <mesh>
            <sphereGeometry args={[radius * 1.025, 64, 64]} />
            <meshBasicMaterial
              color={atmoColor}
              transparent
              opacity={0.16 * config.atmosphereIntensity}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Uranus Ring System */}
        {config.id === 'uranus' && (
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.35, radius * 1.9, 96]} />
            <meshBasicMaterial
              color="#a5f3fc"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
