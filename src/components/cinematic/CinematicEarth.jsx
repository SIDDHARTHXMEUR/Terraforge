import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// STAGE 6: Retire in-scene Earth tile descent and 3D-tiles layer behind a disabled flag
const ENABLE_IN_SCENE_3D_TILES = false;

// Earth 23.44° Astronomical Axial Tilt
const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;
const MOON_INCLINATION = (5.14 * Math.PI) / 180;

// 1. Earth Surface Multi-Layer GLSL Shader
// Features: NASA 2K Blue/Black Marble textures, subtle twilight gradient along terminator,
// ocean specular glint, cloud shadows, Black Marble night city lights,
// and thin sunlit atmospheric limb scattering (zero outer halo shells).
const EarthSurfaceShader = {
  uniforms: {
    uAlbedo: { value: null },
    uLandmask: { value: null },
    uBumpMap: { value: null },
    uNightLights: { value: null },
    uCloudsMap: { value: null },
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uTime: { value: 0 },
    uTempAnomaly: { value: 0.0 },
    uSeaLevelDelta: { value: 0.0 },
    uCityLightsFactor: { value: 1.0 },
    uCloudCover: { value: 1.0 }
  },
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = viewMatrix * worldPos;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    uniform sampler2D uAlbedo;
    uniform sampler2D uLandmask;
    uniform sampler2D uBumpMap;
    uniform sampler2D uNightLights;
    uniform sampler2D uCloudsMap;
    uniform vec3 uSunPosition;
    uniform float uTime;
    uniform float uTempAnomaly;
    uniform float uSeaLevelDelta;
    uniform float uCityLightsFactor;
    uniform float uCloudCover;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      // 1. Texture Samples
      vec3 earthBase = texture2D(uAlbedo, vUv).rgb;
      float landFactor = texture2D(uLandmask, vUv).r; // 1.0 = Land, 0.0 = Ocean
      float bumpVal = texture2D(uBumpMap, vUv).r;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;
      float cloudVal = texture2D(uCloudsMap, vUv).r * uCloudCover;

      float topoDetail = dot(earthBase, vec3(0.299, 0.587, 0.114));
      float lat = abs(vUv.y - 0.5) * 2.0;

      // 2. Procedural Dynamic Sea Level Flooding & Continental Shelf Regression
      if (uSeaLevelDelta > 0.5) {
        // Sea level rise: low coastal elevations flood into radiant turquoise shallow water
        float floodProgress = clamp(uSeaLevelDelta / 80.0, 0.0, 1.0);
        float floodThreshold = 0.015 + floodProgress * 0.28;
        float isFlooded = (1.0 - smoothstep(floodThreshold * 0.45, floodThreshold, bumpVal)) * landFactor;
        vec3 floodWater = mix(vec3(0.04, 0.42, 0.65), vec3(0.08, 0.62, 0.78), 1.0 - bumpVal);
        earthBase = mix(earthBase, floodWater, isFlooded * 0.92);
        landFactor = mix(landFactor, 0.0, isFlooded * 0.92);
      } else if (uSeaLevelDelta < -0.5) {
        // Sea level drop: continental shelves emerge as dry land bridges / sandbanks
        float dropProgress = clamp(-uSeaLevelDelta / 120.0, 0.0, 1.0);
        float shelfThreshold = 0.015 + dropProgress * 0.24;
        float isShelf = (1.0 - smoothstep(shelfThreshold * 0.45, shelfThreshold, 1.0 - bumpVal)) * (1.0 - landFactor);
        vec3 shelfSand = mix(vec3(0.65, 0.58, 0.44), vec3(0.48, 0.42, 0.32), topoDetail);
        earthBase = mix(earthBase, shelfSand, isShelf * 0.90);
        landFactor = mix(landFactor, 1.0, isShelf * 0.90);
      }

      // 3. Dynamic Procedural Temperature Color Ramps (Vivid Transformations)
      vec3 targetBaseColor = earthBase;
      float specMultiplier = 1.0;
      vec3 targetNightLights = nightLights * 1.5;
      vec3 activeLimbColor = vec3(0.20, 0.58, 1.0);
      float extraIceCoverage = 0.0;

      if (uTempAnomaly < -0.05) {
        // Glaciation / Snowball Earth Ramps (-30°C)
        float tIce = clamp(-uTempAnomaly / 30.0, 0.0, 1.0);

        // Glacial Snow Land with preserved topographical mountain ridges
        vec3 iceLand = mix(vec3(0.85, 0.93, 0.98), vec3(1.0, 1.0, 1.0), topoDetail * 0.7 + bumpVal * 0.3);
        // Frozen Ocean Shelf with deep arctic blue crevasses
        vec3 iceOcean = mix(vec3(0.06, 0.35, 0.65), vec3(0.38, 0.85, 0.98), bumpVal * 0.6);
        vec3 iceBase = mix(iceOcean, iceLand, landFactor);

        // Procedural Polar Frost Cap Expansion toward equator
        float polarFrostMask = smoothstep(0.95 - tIce * 0.88, 1.0 - tIce * 0.58, lat + (1.0 - landFactor) * 0.1);
        iceBase = mix(iceBase, vec3(0.96, 0.98, 1.00), polarFrostMask * tIce);
        extraIceCoverage = polarFrostMask * tIce;

        targetBaseColor = mix(earthBase, iceBase, tIce);

        // Boost specular glint on frozen ice sheets
        specMultiplier = 1.0 + tIce * 1.8;

        // Dynamic Aurora Cyan Night Lights
        vec3 iceNight = nightLights * vec3(0.2, 0.9, 1.0) * 3.0;
        targetNightLights = mix(nightLights * 1.5, iceNight, tIce);

        // Crisp Arctic Cyan Atmospheric Limb Scattering
        activeLimbColor = mix(vec3(0.20, 0.58, 1.0), vec3(0.20, 0.88, 1.0), tIce);

      } else if (uTempAnomaly > 0.05) {
        // Hothouse / Desertification / Scorched World Ramps (+50°C)
        float tWarm = clamp(uTempAnomaly / 40.0, 0.0, 1.0);

        // Saharan Terracotta Land with desert canyon ridges
        vec3 desertLand = mix(vec3(0.88, 0.35, 0.08), vec3(1.0, 0.70, 0.25), topoDetail * 0.8);
        // Evaporated Ocean Basaltic Basin
        vec3 desertOcean = mix(vec3(0.10, 0.04, 0.01), vec3(0.32, 0.15, 0.05), bumpVal * 0.7);
        vec3 desertBase = mix(desertOcean, desertLand, landFactor);

        targetBaseColor = mix(earthBase, desertBase, tWarm);

        // Fade specular glint as surface oceans dry into basalt and dust
        specMultiplier = max(0.05, 1.0 - tWarm * 0.95);

        // Volcanic Lava / Amber Night Lights
        vec3 emberNight = mix(nightLights * vec3(1.0, 0.25, 0.05) * 3.2, vec3(0.9, 0.2, 0.0), (1.0 - landFactor) * 0.25);
        targetNightLights = mix(nightLights * 1.5, emberNight, tWarm);

        // Fiery Amber Atmospheric Solar Scattering
        activeLimbColor = mix(vec3(0.20, 0.58, 1.0), vec3(1.0, 0.55, 0.15), tWarm);
      }

      // 4. Day/Night Sunlight Lighting
      float NdotL = dot(N, L);
      float diffuse = max(0.0, NdotL);

      // 5. Cloud Shadow Projection onto ground
      vec2 shadowUv = vUv + vec2(L.x, L.z) * 0.005;
      float cloudShadow = 1.0 - clamp(texture2D(uCloudsMap, shadowUv).r * uCloudCover * 0.35, 0.0, 0.85);

      vec3 surfaceDay = targetBaseColor * diffuse * cloudShadow;

      // 6. Physically based twilight gradient strictly on sun-facing side and terminator
      float twilightFactor = (1.0 - smoothstep(0.00, 0.06, NdotL)) * smoothstep(0.00, 0.03, NdotL);
      vec3 twilightColor = vec3(0.85, 0.45, 0.22) * twilightFactor * 0.25;

      // 7. Ocean & Ice Specular Sun Glint
      vec3 H = normalize(L + V);
      float NdotH = max(0.0, dot(N, H));
      float oceanMask = (1.0 - landFactor) * (1.0 - cloudVal * 0.85);
      float specTerm = pow(NdotH, 48.0) * smoothstep(0.0, 0.15, NdotL) * (oceanMask + extraIceCoverage * 0.8);
      vec3 glintColor = vec3(1.0, 0.98, 0.92) * clamp(specTerm * 0.75 * specMultiplier, 0.0, 1.0);

      // 8. NASA Black Marble Night Lights (Strictly on dark hemisphere, modulated by human footprint)
      float nightFactor = 1.0 - smoothstep(-0.15, 0.02, NdotL);
      float effectiveCityLights = clamp(uCityLightsFactor, 0.0, 3.0);
      vec3 litNight = targetNightLights * nightFactor * effectiveCityLights;

      // 9. Ultra-thin Atmospheric Rayleigh Limb Scattering strictly on SUNLIT side
      float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float sunlitScatter = pow(rim, 8.0) * smoothstep(0.0, 0.25, NdotL);
      vec3 atmosphereScatter = activeLimbColor * sunlitScatter * 0.65;

      // 10. Dark textured night ambient at 0.015
      vec3 nightSide = targetBaseColor * 0.015;

      // Combine layers
      vec3 finalColor = surfaceDay + twilightColor + glintColor + litNight + atmosphereScatter + nightSide;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// 2. Dynamic Weather Clouds GLSL Shader
const EarthCloudsShader = {
  uniforms: {
    uCloudsMap: { value: null },
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uCloudAlpha: { value: 1.0 },
    uCloudCover: { value: 1.0 }
  },
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    uniform sampler2D uCloudsMap;
    uniform vec3 uSunPosition;
    uniform float uCloudAlpha;
    uniform float uCloudCover;

    void main() {
      #include <logdepthbuf_fragment>

      vec4 cloudTex = texture2D(uCloudsMap, vUv);
      if (cloudTex.r < 0.04) discard;

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);

      float NdotL = dot(N, L);
      float dayFactor = max(0.0, NdotL);

      // Lit clouds on daylight side, dark translucent clouds on night side
      vec3 cloudColor = vec3(1.0, 1.0, 1.0) * (dayFactor * 0.95 + 0.05);
      float alpha = cloudTex.r * (dayFactor * 0.75 + 0.15) * uCloudAlpha * uCloudCover;

      gl_FragColor = vec4(cloudColor, alpha * 0.90);
    }
  `
};

import { EarthSurfaceTileEngine } from './EarthSurfaceTileEngine';
import { useEarthSurfaceStore } from '../../state/useEarthSurfaceStore';
import { useEarthClimateStore } from '../../state/useEarthClimateStore';

export function CinematicEarth({
  position = [0, 0, 0],
  radius = 3.5,
  isPlaying = true,
  axialTilt = EARTH_AXIAL_TILT,
  sunPosition = [0, 0, 0],
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
  const { tempAnomaly, seaLevelDelta, cityLightsFactor, cloudCover } = useEarthClimateStore();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const climate = useEarthClimateStore.getState();

    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uTime.value = elapsed;
      surfaceShaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
      surfaceShaderRef.current.uniforms.uTempAnomaly.value = climate.tempAnomaly;
      surfaceShaderRef.current.uniforms.uSeaLevelDelta.value = climate.seaLevelDelta;
      surfaceShaderRef.current.uniforms.uCityLightsFactor.value = climate.cityLightsFactor;
      surfaceShaderRef.current.uniforms.uCloudCover.value = climate.cloudCover;
    }
    if (cloudsRef.current) {
      cloudsRef.current.visible = !isSurfaceMode || altitudeKm > 35.0;
    }
    if (cloudsShaderRef.current) {
      cloudsShaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
      // Fade clouds opacity smoothly when camera descends into surface mode
      let cloudAlpha = 1.0;
      if (isSurfaceMode) {
        cloudAlpha = THREE.MathUtils.clamp((altitudeKm - 35.0) / 400.0, 0.0, 1.0);
      }
      cloudsShaderRef.current.uniforms.uCloudAlpha.value = cloudAlpha;
      cloudsShaderRef.current.uniforms.uCloudCover.value = climate.cloudCover;
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
              uSunPosition: { value: sunPosVec },
              uTime: { value: 0 },
              uTempAnomaly: { value: tempAnomaly },
              uSeaLevelDelta: { value: seaLevelDelta },
              uCityLightsFactor: { value: cityLightsFactor },
              uCloudCover: { value: cloudCover }
            }}
          />
          {/* Real Satellite & 3D Tile Surface Engine (Disabled behind flag for Stage 6 MapLibre transition) */}
          {ENABLE_IN_SCENE_3D_TILES && (
            <EarthSurfaceTileEngine
              radius={radius}
              sunDirection={sunPosVec}
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
              uSunPosition: { value: sunPosVec },
              uCloudAlpha: { value: 1.0 },
              uCloudCover: { value: 1.0 }
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
