import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Smooth Planetary Atmospheric Rayleigh Scattering Limb Shader
const PlanetAtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform vec3 uColor;
    uniform float uIntensity;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      float rim = 1.0 - clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
      float glow = pow(rim, 3.6);

      gl_FragColor = vec4(uColor * glow * 1.5, glow * uIntensity);
    }
  `
};

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
  isPlaying = true,
  onClick
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

  const atmoColorObj = useMemo(() => new THREE.Color(atmosphereColor), [atmosphereColor]);

  useFrame((_, delta) => {
    if (isPlaying) {
      if (planetBodyRef.current) {
        // Natural axial rotation speeds
        const rotMultiplier = id === 'jupiter' ? 2.4 : id === 'saturn' ? 2.2 : id === 'venus' ? -0.15 : 1.0;
        planetBodyRef.current.rotation.y += delta * 0.08 * rotMultiplier;
      }
      if (cloudsRef.current) {
        // Venus atmospheric super-rotation (4 Earth days)
        cloudsRef.current.rotation.y += delta * 0.22;
      }
    }
  });

  return (
    <group
      position={position}
      rotation={[0, 0, axialTilt]}
      onClick={onClick}
    >
      {/* 1. Planetary Surface Mesh with Relief Bump Mapping */}
      <mesh ref={planetBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={planetTexture}
          bumpMap={id === 'mercury' || id === 'mars' ? planetTexture : null}
          bumpScale={id === 'mercury' ? 0.045 : id === 'mars' ? 0.038 : 0.0}
          roughness={id === 'jupiter' || id === 'uranus' || id === 'neptune' ? 0.95 : 0.85}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Venus Dense Supercritical Cloud Atmosphere Layer */}
      {id === 'venus' && venusAtmosphereMap && (
        <mesh ref={cloudsRef} scale={1.022}>
          <sphereGeometry args={[radius, 128, 128]} />
          <meshStandardMaterial
            map={venusAtmosphereMap}
            transparent={true}
            opacity={0.92}
            blending={THREE.NormalBlending}
            roughness={1.0}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3. Smooth Rayleigh Atmospheric Limb Glow */}
      {atmosphereIntensity > 0 && (
        <mesh scale={1.042}>
          <sphereGeometry args={[radius, 64, 64]} />
          <shaderMaterial
            args={[PlanetAtmosphereShader]}
            uniforms={{
              uColor: { value: atmoColorObj },
              uIntensity: { value: atmosphereIntensity }
            }}
            transparent={true}
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
          <meshStandardMaterial
            color="#bfe8ff"
            transparent={true}
            opacity={0.4}
            blending={THREE.NormalBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.8}
          />
        </mesh>
      )}
    </group>
  );
}
