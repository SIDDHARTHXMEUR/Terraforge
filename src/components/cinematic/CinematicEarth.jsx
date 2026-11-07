import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth 23.44° Astronomical Axial Tilt
const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;
const MOON_INCLINATION = (5.14 * Math.PI) / 180;

// 1. Earth Surface Multi-Layer GLSL Shader
// Features: NASA 2K Blue/Black Marble textures, subtle twilight gradient along terminator,
// ocean specular glint, cloud shadows, Black Marble night city lights,
// and thin sunlit atmospheric limb scattering (zero outer halo shells).
const EarthSurfaceShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

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

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    uniform sampler2D uAlbedo;
    uniform sampler2D uLandmask;
    uniform sampler2D uBumpMap;
    uniform sampler2D uNightLights;
    uniform sampler2D uCloudsMap;
    uniform vec3 uSunDirection;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 sunDir = normalize(uSunDirection);

      // 1. Texture Samples
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;
      float landFactor = texture2D(uLandmask, vUv).r; // 1.0 = Land, 0.0 = Ocean
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      // 2. Day/Night Lighting
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = max(0.0, sunDot * 0.96 + 0.04);

      // 3. Subtle Cloud Shadow Projection onto ground
      vec2 shadowUv = vUv + vec2(sunDir.x, sunDir.z) * 0.006;
      float cloudShadow = 1.0 - texture2D(uCloudsMap, shadowUv).r * 0.35;

      vec3 surfaceDay = albedo * diffuse * cloudShadow;

      // 4. Subtle, physically based twilight gradient along terminator (no thick orange smear)
      float twilightFactor = smoothstep(0.08, -0.04, sunDot) * smoothstep(-0.08, 0.02, sunDot);
      vec3 twilightColor = vec3(0.85, 0.45, 0.22) * twilightFactor * 0.32;

      // 5. Ocean Specular Sun Glint (Only on water, masked by land and clouds)
      vec3 halfVec = normalize(sunDir + viewDir);
      float specAngle = max(0.0, dot(normal, halfVec));
      float cloudVal = texture2D(uCloudsMap, vUv).r;
      float oceanGlint = pow(specAngle, 64.0) * (1.0 - landFactor) * smoothstep(-0.05, 0.2, sunDot) * (1.0 - cloudVal * 0.85);
      vec3 glintColor = vec3(1.0, 0.96, 0.88) * oceanGlint * 2.2;

      // 6. NASA Black Marble Night Lights (Strictly on dark hemisphere)
      float nightFactor = smoothstep(0.05, -0.18, sunDot);
      vec3 litNight = nightLights * nightFactor * 1.8;

      // 7. Ultra-thin Atmospheric Rayleigh Limb Scattering strictly on SUNLIT side (2-3% of radius, zero dark halo)
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float sunlitScatter = pow(rim, 5.5) * smoothstep(0.0, 0.35, sunDot);
      vec3 atmosphereScatter = vec3(0.20, 0.58, 1.0) * sunlitScatter * 0.75;

      // Combine layers
      vec3 finalColor = surfaceDay + twilightColor + glintColor + litNight + atmosphereScatter;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// 2. Dynamic Weather Clouds GLSL Shader
const EarthCloudsShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;

    uniform sampler2D uCloudsMap;
    uniform vec3 uSunDirection;
    uniform float uCloudAlpha;

    void main() {
      #include <logdepthbuf_fragment>

      vec4 cloudTex = texture2D(uCloudsMap, vUv);
      if (cloudTex.r < 0.04) discard;

      vec3 sunDir = normalize(uSunDirection);
      vec3 worldNormal = normalize(vWorldNormal);

      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.10, 0.25, sunDot);

      // Lit clouds on daylight side, dark translucent clouds on night side
      vec3 cloudColor = vec3(1.0, 1.0, 1.0) * (dayFactor * 0.95 + 0.05);
      float alpha = cloudTex.r * (dayFactor * 0.75 + 0.15) * uCloudAlpha;

      gl_FragColor = vec4(cloudColor, alpha * 0.90);
    }
  `
};

import { EarthSurfaceTileEngine } from './EarthSurfaceTileEngine';
import { useEarthSurfaceStore } from '../../state/useEarthSurfaceStore';

export function CinematicEarth({
  position = [0, 0, 0],
  radius = 3.5,
  isPlaying = true,
  axialTilt = EARTH_AXIAL_TILT,
  sunDirection,
  isSafeMode = false,
  onClick
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
  const surfaceShaderRef = useRef();
  const cloudsShaderRef = useRef();

  const { isSurfaceMode, altitudeKm } = useEarthSurfaceStore();

  const computedSunDir = useMemo(() => {
    if (sunDirection) return sunDirection;
    const earthPos = new THREE.Vector3(...position);
    if (earthPos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(earthPos).normalize();
    }
    return new THREE.Vector3(1, 0.45, 1).normalize();
  }, [position, sunDirection]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Dynamically update sunlight direction from current orbital position
    const earthPos = new THREE.Vector3(...position);
    const sunDir = earthPos.lengthSq() > 1.0
      ? new THREE.Vector3(0, 0, 0).sub(earthPos).normalize()
      : new THREE.Vector3(1, 0.45, 1).normalize();

    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uTime.value = elapsed;
      surfaceShaderRef.current.uniforms.uSunDirection.value = sunDir;
    }
    if (cloudsRef.current) {
      cloudsRef.current.visible = !isSurfaceMode || altitudeKm > 35.0;
    }
    if (cloudsShaderRef.current) {
      cloudsShaderRef.current.uniforms.uSunDirection.value = sunDir;
      // Fade clouds opacity smoothly when camera descends into surface mode
      let cloudAlpha = 1.0;
      if (isSurfaceMode) {
        cloudAlpha = THREE.MathUtils.clamp((altitudeKm - 35.0) / 400.0, 0.0, 1.0);
      }
      cloudsShaderRef.current.uniforms.uCloudAlpha.value = cloudAlpha;
    }

    if (typeof window !== 'undefined' && earthBodyRef.current) {
      window.__earthBodyMesh = earthBodyRef.current;
    }

    if (isPlaying) {
      // Earth axial rotation (23.93 hours)
      if (earthBodyRef.current) {
        earthBodyRef.current.rotation.y += delta * 0.12;
      }
      // Atmospheric cloud drift (+22% differential speed)
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * 0.146;
      }
      // Lunar revolution
      moonOrbitAngleRef.current += delta * (0.12 / 27.3) * 6.0;
    }

    // Moon Position & Tidal Locking
    const moonDist = radius * 3.8;
    const mAngle = moonOrbitAngleRef.current;
    if (moonRef.current) {
      moonRef.current.position.set(
        Math.cos(mAngle) * moonDist,
        Math.sin(mAngle * 0.5) * 0.4,
        Math.sin(mAngle) * moonDist
      );
      moonRef.current.rotation.y = -mAngle + Math.PI / 2;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Earth tilted group with 23.44° astronomical axial tilt on Z */}
      <group ref={earthGroupRef} rotation={[0, 0, axialTilt]}>
        {/* 1. Main Planet Surface - Solid, Opaque, Zero Outer Halos */}
        <mesh ref={earthBodyRef} castShadow receiveShadow>
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial
            ref={surfaceShaderRef}
            args={[EarthSurfaceShader]}
            transparent={false}
            depthWrite={true}
            depthTest={true}
            uniforms={{
              uAlbedo: { value: albedoMap },
              uLandmask: { value: landmaskMap },
              uBumpMap: { value: bumpMap },
              uNightLights: { value: nightlightsMap },
              uCloudsMap: { value: cloudsMap },
              uSunDirection: { value: computedSunDir },
              uTime: { value: 0 }
            }}
          />
          {/* Real Satellite & 3D Tile Surface Engine (Mounted in Earth Local Rotating Frame; disabled in Safe Mode) */}
          {!isSafeMode && (
            <EarthSurfaceTileEngine
              radius={radius}
              sunDirection={computedSunDir}
            />
          )}
        </mesh>

        {/* 2. Realistic Dynamic Cloud Layer with Terminator Shading */}
        <mesh ref={cloudsRef} scale={1.009} renderOrder={5}>
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial
            ref={cloudsShaderRef}
            args={[EarthCloudsShader]}
            uniforms={{
              uCloudsMap: { value: cloudsMap },
              uSunDirection: { value: computedSunDir },
              uCloudAlpha: { value: 1.0 }
            }}
            transparent={true}
            blending={THREE.NormalBlending}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </group>

      {/* 3. Realistically Scaled Earth's Moon (27.3% Earth Radius) */}
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
