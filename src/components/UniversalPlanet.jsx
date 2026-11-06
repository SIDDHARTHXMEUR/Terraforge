import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLANETS_DATA } from '../data/planetsData';

// Generalized GLSL Atmospheric Limb Glow & Banding Shader for Terrestrial & Gas Giants
const CelestialBodyShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    uniform vec3 uBaseColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uAtmosphereColor;
    uniform float uAtmosphereIntensity;
    uniform vec3 uSunDirection;
    uniform float uBandingFrequency;
    uniform float uTime;
    uniform int uBodyType; // 0=Terrestrial/Rocky, 1=Gas Giant banded, 2=Ice Giant

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);

      // Base planetary color synthesis
      vec3 surfaceColor = uBaseColor;

      if (uBodyType == 1) {
        // Gas Giant Zonal Cloud Banding (Jupiter & Saturn)
        float lat = vUv.y * 3.14159;
        float band1 = sin(vUv.y * uBandingFrequency * 2.0 + sin(vUv.x * 12.0) * 0.15);
        float band2 = cos(vUv.y * uBandingFrequency * 4.0 + uTime * 0.05);
        float turbulence = sin(vUv.x * 24.0 + vUv.y * 18.0) * 0.08;
        float mixFactor = clamp((band1 * 0.6 + band2 * 0.3 + turbulence + 1.0) * 0.5, 0.0, 1.0);
        surfaceColor = mix(uBaseColor, uSecondaryColor, mixFactor);

        // Jupiter Great Red Spot feature approximation (around latitude 22°S)
        if (uBandingFrequency > 18.0) {
          float spotU = abs(fract(vUv.x + 0.3) - 0.5) * 8.0;
          float spotV = abs(vUv.y - 0.38) * 16.0;
          if (spotU * spotU + spotV * spotV < 1.0) {
            surfaceColor = mix(surfaceColor, vec3(0.85, 0.22, 0.12), 0.75);
          }
        }
      } else if (uBodyType == 2) {
        // Ice Giant Smooth Atmospheric Gradient (Uranus & Neptune)
        float poleGradient = pow(abs(vUv.y - 0.5) * 2.0, 1.8);
        surfaceColor = mix(uBaseColor, uSecondaryColor, poleGradient * 0.4);
      } else {
        // Terrestrial subtle crater/mineral procedural variation
        float mineralVariation = sin(vUv.x * 40.0) * cos(vUv.y * 40.0) * 0.06;
        surfaceColor = clamp(uBaseColor + vec3(mineralVariation), 0.0, 1.0);
      }

      // Directional solar illumination with smooth terminator
      float sunDot = dot(worldNormal, uSunDirection);
      float dayFactor = smoothstep(-0.20, 0.25, sunDot);
      float diffuse = max(0.08, sunDot * 0.90 + 0.10);

      // Atmospheric limb Fresnel glow
      float limbFactor = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.2);
      vec3 atmosphereGlow = uAtmosphereColor * limbFactor * uAtmosphereIntensity * (dayFactor * 0.8 + 0.2);

      vec3 finalColor = (surfaceColor * diffuse) + atmosphereGlow;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function UniversalPlanetMesh({
  planetId,
  position = [0, 0, 0],
  scale = 1,
  simTime = 1,
  isPlaying = true,
  onClick,
  isSelected = false
}) {
  const meshRef = useRef();
  const ringsRef = useRef();
  const shaderRef = useRef();

  const planetInfo = PLANETS_DATA[planetId] || PLANETS_DATA.mars;

  const bodyType = useMemo(() => {
    if (['jupiter', 'saturn'].includes(planetId)) return 1;
    if (['uranus', 'neptune'].includes(planetId)) return 2;
    return 0; // Terrestrial
  }, [planetId]);

  const { baseColor, secondaryColor, atmosphereColor } = useMemo(() => {
    const base = new THREE.Color(planetInfo.surfaceColor);
    const secondary = new THREE.Color(planetInfo.fallbackColor);
    const atmo = new THREE.Color(planetInfo.atmosphereColor);
    return { baseColor: base, secondaryColor: secondary, atmosphereColor: atmo };
  }, [planetInfo]);

  const sunDirection = useMemo(() => new THREE.Vector3(1, 0.45, 1).normalize(), []);

  const uniforms = useMemo(() => ({
    uBaseColor: { value: baseColor },
    uSecondaryColor: { value: secondaryColor },
    uAtmosphereColor: { value: atmosphereColor },
    uAtmosphereIntensity: { value: planetInfo.atmosphereIntensity || 0.8 },
    uSunDirection: { value: sunDirection },
    uBandingFrequency: { value: planetId === 'jupiter' ? 22.0 : 16.0 },
    uTime: { value: 0 },
    uBodyType: { value: bodyType }
  }), [baseColor, secondaryColor, atmosphereColor, planetInfo, sunDirection, planetId, bodyType]);

  useFrame((_, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
    }

    if (!isPlaying) return;

    // Rotate planet around its axial tilt
    if (meshRef.current) {
      const rotDelta = delta * 0.4 * (planetInfo.rotationSpeedRelative || 1.0);
      meshRef.current.rotation.y += rotDelta;
    }
  });

  const axialTiltRad = useMemo(() => {
    return ((planetInfo.axialTiltDeg || 0) * Math.PI) / 180;
  }, [planetInfo.axialTiltDeg]);

  return (
    <group position={position} onClick={onClick}>
      {/* Selection highlight reticle */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[scale * 1.35, scale * 1.45, 64]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Tilted Planetary Body */}
      <group rotation={[axialTiltRad, 0, 0]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[scale, 64, 64]} />
          <shaderMaterial
            ref={shaderRef}
            vertexShader={CelestialBodyShader.vertexShader}
            fragmentShader={CelestialBodyShader.fragmentShader}
            uniforms={uniforms}
          />
        </mesh>

        {/* Planetary Ring System (Saturn & Uranus) */}
        {planetInfo.hasRings && (
          <mesh ref={ringsRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                scale * (planetInfo.ringInnerRadius || 1.8),
                scale * (planetInfo.ringOuterRadius || 3.2),
                128
              ]}
            />
            <meshStandardMaterial
              color={planetInfo.ringColor || '#eab308'}
              transparent
              opacity={planetInfo.ringOpacity || 0.75}
              side={THREE.DoubleSide}
              roughness={0.6}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
