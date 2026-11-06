import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth 23.44° Astronomical Axial Tilt
const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;
const MOON_INCLINATION = (5.14 * Math.PI) / 180;

// Earth Multi-Texture GLSL Shader (Version 1 Enhanced with Photographic Realism)
const EarthGLSLShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    uniform sampler2D uAlbedo;
    uniform sampler2D uLandmask;
    uniform sampler2D uBumpMap;
    uniform sampler2D uNightLights;
    uniform vec3 uSunPosition;
    uniform float uTime;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);

      vec3 sunDir = normalize(uSunPosition - vWorldPosition);

      // 1. Textures
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;
      float landFactor = texture2D(uLandmask, vUv).r; // 1.0 = Land, 0.0 = Ocean
      float bumpVal = texture2D(uBumpMap, vUv).r;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      // 2. Day/Night lighting with physical terminator roll-off
      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.18, 0.22, sunDot);
      float diffuse = max(0.0, sunDot);

      // Deep, vibrant photorealistic ocean and continents
      vec3 surfaceDay = albedo * (diffuse * 0.95 + 0.05);

      // 3. Ocean Specular Sun Glint (Only on oceans, water roughness pow(36))
      vec3 halfVec = normalize(sunDir + viewDir);
      float specAngle = max(0.0, dot(normal, halfVec));
      float oceanGlint = pow(specAngle, 42.0) * (1.0 - landFactor) * dayFactor;
      vec3 glintColor = vec3(1.0, 0.96, 0.85) * oceanGlint * 2.2;

      // 4. Night Lights on Dark Hemisphere
      float nightFactor = smoothstep(0.12, -0.22, sunDot);
      vec3 litNight = nightLights * nightFactor * 1.6;

      // 5. Rayleigh Blue Atmospheric Limb Scattering
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float rayleighIntensity = pow(rim, 3.4) * max(0.1, sunDot * 0.6 + 0.4);
      vec3 atmosphereScatter = vec3(0.12, 0.48, 1.0) * rayleighIntensity * 1.8;

      vec3 finalColor = surfaceDay + glintColor + litNight + atmosphereScatter;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function CinematicEarth({
  position = [0, 0, 0],
  radius = 1.8,
  isPlaying = true,
  axialTilt = EARTH_AXIAL_TILT
}) {
  const [albedoMap, bumpMap, cloudsMap, landmaskMap, nightlightsMap, moonAlbedo, moonBump] = useTexture([
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/earth/earth_bump.jpg',
    '/assets/planets/earth/earth_clouds.png',
    '/assets/planets/earth/earth_landmask.png',
    '/assets/planets/earth/earth_nightlights.jpg',
    '/assets/planets/moon/moon.jpg',
    '/textures/moon/moon_bump.jpg'
  ]);

  const earthGroupRef = useRef();
  const earthBodyRef = useRef();
  const cloudsRef = useRef();
  const moonRef = useRef();
  const moonOrbitAngleRef = useRef(0);
  const shaderRef = useRef();

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
    }

    if (isPlaying) {
      // Earth rotation
      if (earthBodyRef.current) {
        earthBodyRef.current.rotation.y += delta * 0.12;
      }
      // Dynamic cloud drift slightly faster than planet rotation
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * 0.145;
      }
      // Moon Keplerian orbit: 27.3 Earth days per orbit
      moonOrbitAngleRef.current += delta * (0.12 / 27.3) * 6.0;
    }

    // Moon Tidal Lock and Position
    const moonDist = radius * 5.8;
    const mAngle = moonOrbitAngleRef.current;
    if (moonRef.current) {
      moonRef.current.position.set(
        Math.cos(mAngle) * moonDist,
        Math.sin(mAngle * 0.5) * 0.4,
        Math.sin(mAngle) * moonDist
      );
      // Tidal locking: same face continuously directed towards Earth
      moonRef.current.rotation.y = -mAngle + Math.PI / 2;
    }
  });

  return (
    <group position={position}>
      {/* Earth tilted group with 23.44° axial tilt */}
      <group ref={earthGroupRef} rotation={[axialTilt, 0, 0]}>
        {/* 1. Main Planet Surface */}
        <mesh ref={earthBodyRef} castShadow receiveShadow>
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial
            ref={shaderRef}
            args={[EarthGLSLShader]}
            uniforms={{
              uAlbedo: { value: albedoMap },
              uLandmask: { value: landmaskMap },
              uBumpMap: { value: bumpMap },
              uNightLights: { value: nightlightsMap },
              uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
              uTime: { value: 0 }
            }}
          />
        </mesh>

        {/* 2. Realistic Dynamic Cloud Layer with Soft Self-Shadowing */}
        <mesh ref={cloudsRef} scale={1.018}>
          <sphereGeometry args={[radius, 96, 96]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.88}
            blending={THREE.NormalBlending}
            roughness={1.0}
            depthWrite={false}
          />
        </mesh>

        {/* 3. Outer Atmospheric Halo Glow */}
        <mesh scale={1.07}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial
            color="#2277ff"
            transparent={true}
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 4. Realistically Scaled Earth's Moon (27.3% Earth Radius) */}
      <group rotation={[MOON_INCLINATION, 0, 0]}>
        <mesh ref={moonRef} castShadow receiveShadow>
          <sphereGeometry args={[radius * 0.273, 64, 64]} />
          <meshStandardMaterial
            map={moonAlbedo}
            bumpMap={moonBump}
            bumpScale={0.035}
            roughness={0.92}
            metalness={0.02}
          />
        </mesh>
      </group>
    </group>
  );
}
