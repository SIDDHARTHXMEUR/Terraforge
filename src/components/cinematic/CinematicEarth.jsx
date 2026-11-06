import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth 23.44° Astronomical Axial Tilt
const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;

// Earth Multi-Texture GLSL Shader (Preserving and enhancing Version 1)
const EarthGLSLShader = {
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

    uniform sampler2D uAlbedo;
    uniform sampler2D uLandmask;
    uniform sampler2D uBumpMap;
    uniform sampler2D uNightLights;
    uniform float uTemperature; // 0.0 = Ice (-60°C), 0.5 = Earth (+15°C), 1.0 = Desert (+60°C)
    uniform float uAtmosphereIntensity;
    uniform vec3 uSunPosition;
    uniform vec3 uPlanetPosition;
    uniform float uTime;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);

      vec3 sunDir = normalize(uSunPosition - uPlanetPosition);

      // 1. Sample texture maps
      vec3 albedoColor = texture2D(uAlbedo, vUv).rgb;
      float landFactor = texture2D(uLandmask, vUv).r; // 1.0 = land, 0.0 = ocean
      float bumpVal = texture2D(uBumpMap, vUv).r;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      float topographyDetail = dot(albedoColor, vec3(0.299, 0.587, 0.114));
      float poleDistance = abs(vUv.y - 0.5) * 2.0;

      // 2. Earth Base Color
      vec3 earthBase = albedoColor;

      // 3. Ice World Ramps (-60°C, uTemperature = 0.0)
      vec3 iceLand = mix(vec3(0.85, 0.93, 0.98), vec3(1.0, 1.0, 1.0), topographyDetail * 0.7 + bumpVal * 0.3);
      vec3 iceOcean = mix(vec3(0.06, 0.35, 0.65), vec3(0.38, 0.85, 0.98), bumpVal * 0.6);
      vec3 iceBase = mix(iceOcean, iceLand, landFactor);

      float tIce = max(0.0, (0.5 - uTemperature) / 0.5);
      float polarFrostMask = smoothstep(0.95 - tIce * 0.90, 1.0 - tIce * 0.65, poleDistance + (1.0 - landFactor) * 0.1);
      iceBase = mix(iceBase, vec3(0.96, 0.98, 1.00), polarFrostMask * tIce);

      // 4. Desert World Ramps (+60°C, uTemperature = 1.0)
      vec3 desertLand = mix(vec3(0.88, 0.32, 0.05), vec3(1.0, 0.68, 0.22), topographyDetail * 0.8);
      vec3 desertOcean = mix(vec3(0.12, 0.04, 0.01), vec3(0.35, 0.15, 0.05), bumpVal * 0.7);
      vec3 desertBase = mix(desertOcean, desertLand, landFactor);

      // 5. Interpolate Surface Color
      vec3 targetBaseColor;
      if (uTemperature <= 0.5) {
        float t = uTemperature / 0.5;
        targetBaseColor = mix(iceBase, earthBase, t);
      } else {
        float t = (uTemperature - 0.5) / 0.5;
        targetBaseColor = mix(earthBase, desertBase, t);
      }

      // 6. Directional Sunlight & Day/Night Terminator
      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.22, 0.22, sunDot);
      float diffuse = max(0.05, sunDot * 0.95 + 0.05);

      vec3 litDay = targetBaseColor * diffuse;

      // 7. Ocean Specular Glint
      float specMultiplier = (uTemperature <= 0.5)
        ? 1.0 + (0.5 - uTemperature) * 1.6
        : max(0.0, 1.0 - (uTemperature - 0.5) * 2.0);

      vec3 halfVector = normalize(sunDir + viewDir);
      float specAngle = max(0.0, dot(normal, halfVector));
      float specGlint = pow(specAngle, 32.0) * dayFactor * specMultiplier * (1.0 - landFactor * 0.85);
      vec3 specColor = vec3(1.0, 0.95, 0.85) * max(0.0, specGlint) * 1.6;

      // 8. Dynamic Night City Lights
      vec3 litNight = nightLights * 2.5 * (1.0 - dayFactor);

      // 9. Atmospheric Rayleigh Blue Limb Tint
      float limbFactor = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.2) * (dayFactor * 0.8 + 0.2);
      vec3 atmosphereTint = vec3(0.0, 0.65, 1.0) * limbFactor * uAtmosphereIntensity * 0.35;

      vec3 finalColor = mix(litNight, litDay + specColor, dayFactor) + atmosphereTint;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function CinematicEarth({
  position = [0, 0, 0],
  radius = 2.2,
  isSelected = false,
  onClick,
  isPlaying = true,
  sim = { temp: 15, cloudCoverage: 0.6, atmosphereIntensity: 1.0, rotationSpeed: 0.5 }
}) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const shaderRef = useRef();
  const moonRef = useRef();
  const moonAngleRef = useRef(0);

  // Load Earth & Moon NASA texture maps
  const [albedoMap, bumpMap, cloudsMap, landmaskMap, nightlightsMap] = useTexture([
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/earth/earth_bump.jpg',
    '/assets/planets/earth/earth_clouds.png',
    '/assets/planets/earth/earth_landmask.png',
    '/assets/planets/earth/earth_nightlights.jpg'
  ]);

  const [moonAlbedo, moonBump] = useTexture([
    '/textures/moon/moon_albedo.jpg',
    '/textures/moon/moon_bump.jpg'
  ]);

  // Temperature uniform mapping
  const uTemperature = useMemo(() => {
    const t = sim?.temp !== undefined ? sim.temp : 15;
    if (t <= 15) {
      return Math.max(0.0, Math.min(0.5, ((t + 60) / 75) * 0.5));
    } else {
      return Math.min(1.0, 0.5 + ((t - 15) / 45) * 0.5);
    }
  }, [sim?.temp]);

  const uniforms = useMemo(() => ({
    uAlbedo: { value: albedoMap },
    uLandmask: { value: landmaskMap },
    uBumpMap: { value: bumpMap },
    uNightLights: { value: nightlightsMap },
    uTemperature: { value: uTemperature },
    uAtmosphereIntensity: { value: sim?.atmosphereIntensity || 1.0 },
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uPlanetPosition: { value: new THREE.Vector3(...position) },
    uTime: { value: 0 }
  }), [albedoMap, landmaskMap, bumpMap, nightlightsMap, uTemperature, sim?.atmosphereIntensity, position]);

  useFrame((_, delta) => {
    if (!isPlaying) return;

    const baseSpeed = delta * 0.4 * (sim?.rotationSpeed || 0.5);

    if (earthRef.current) {
      earthRef.current.rotation.y += baseSpeed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += baseSpeed * 1.3;
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
      shaderRef.current.uniforms.uTemperature.value = uTemperature;
      shaderRef.current.uniforms.uAtmosphereIntensity.value = sim?.atmosphereIntensity || 1.0;
      shaderRef.current.uniforms.uPlanetPosition.value.set(...position);
    }

    // Kinematic Moon orbit at 27.3:1 ratio
    moonAngleRef.current += baseSpeed / 27.3;
    if (moonRef.current) {
      const moonDist = radius * 2.8;
      moonRef.current.position.set(
        Math.cos(moonAngleRef.current) * moonDist,
        0,
        Math.sin(moonAngleRef.current) * moonDist
      );
      // Tidal locking
      moonRef.current.rotation.y = -moonAngleRef.current + Math.PI / 2;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Selection highlight (subtle unobtrusive ring) */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.3, radius * 1.38, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Earth Group with 23.44° Axial Tilt */}
      <group rotation={[EARTH_AXIAL_TILT, 0, 0]}>
        {/* Core Earth Surface */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[radius, 96, 96]} />
          <shaderMaterial
            ref={shaderRef}
            vertexShader={EarthGLSLShader.vertexShader}
            fragmentShader={EarthGLSLShader.fragmentShader}
            uniforms={uniforms}
          />
        </mesh>

        {/* Dynamic Cloud Sphere */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[radius * 1.018, 96, 96]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={Math.min(1.0, (sim?.cloudCoverage || 0.6) * 1.15)}
            blending={THREE.NormalBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Atmosphere Rayleigh Scattering Halo */}
        <mesh>
          <sphereGeometry args={[radius * 1.035, 64, 64]} />
          <meshBasicMaterial
            color="#00aaff"
            transparent
            opacity={0.16 * (sim?.atmosphereIntensity || 1.0)}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Moon Orbiting Earth */}
        <group rotation={[(5.14 * Math.PI) / 180, 0, 0]}>
          <mesh ref={moonRef}>
            <sphereGeometry args={[radius * 0.273, 64, 64]} />
            <meshStandardMaterial
              map={moonAlbedo}
              bumpMap={moonBump}
              bumpScale={0.03}
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
