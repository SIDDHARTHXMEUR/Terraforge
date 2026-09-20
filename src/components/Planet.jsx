import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth's Real Astronomical Axial Tilt: 23.44 degrees (0.4091 rad)
const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;

// Custom ShaderMaterial with Repurposed Atmosphere Limb Tint & Topography Preservation
const PlanetShader = {
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
    uniform vec3 uSunDirection;
    uniform float uTime;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);

      // 1. Sample texture maps
      vec3 albedoColor = texture2D(uAlbedo, vUv).rgb;
      float landFactor = texture2D(uLandmask, vUv).r; // 1.0 = land, 0.0 = ocean
      float bumpVal = texture2D(uBumpMap, vUv).r;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      // Extract topographical detail intensity from albedo luminance
      float topographyDetail = dot(albedoColor, vec3(0.299, 0.587, 0.114));

      // Pole latitude factor: 0.0 at equator, 1.0 at poles
      float poleDistance = abs(vUv.y - 0.5) * 2.0;

      // 2. Earth Base Color
      vec3 earthBase = albedoColor;

      // 3. Ice World Ramps (-60°C, uTemperature = 0.0)
      // Glacial Snow Land with preserved mountain ridges
      vec3 iceLand = mix(vec3(0.85, 0.93, 0.98), vec3(1.0, 1.0, 1.0), topographyDetail * 0.7 + bumpVal * 0.3);
      // Frozen Ocean Shelf with deep glacial ice crevices
      vec3 iceOcean = mix(vec3(0.06, 0.35, 0.65), vec3(0.38, 0.85, 0.98), bumpVal * 0.6);
      vec3 iceBase = mix(iceOcean, iceLand, landFactor);

      // Procedural Polar Frost Cap Expansion
      float tIce = max(0.0, (0.5 - uTemperature) / 0.5); // 0.0 at Earth, 1.0 at Ice
      float polarFrostMask = smoothstep(0.95 - tIce * 0.90, 1.0 - tIce * 0.65, poleDistance + (1.0 - landFactor) * 0.1);
      iceBase = mix(iceBase, vec3(0.96, 0.98, 1.00), polarFrostMask * tIce);

      // 4. Desert / Scorched World Ramps (+60°C, uTemperature = 1.0)
      // Saharan Terracotta Land with canyon ridges
      vec3 desertLand = mix(vec3(0.88, 0.32, 0.05), vec3(1.0, 0.68, 0.22), topographyDetail * 0.8);
      // Evaporated Ocean Basaltic Basin
      vec3 desertOcean = mix(vec3(0.12, 0.04, 0.01), vec3(0.35, 0.15, 0.05), bumpVal * 0.7);
      vec3 desertBase = mix(desertOcean, desertLand, landFactor);

      // 5. Interpolate Target Surface Color based on uTemperature
      vec3 targetBaseColor;
      if (uTemperature <= 0.5) {
        float t = uTemperature / 0.5;
        targetBaseColor = mix(iceBase, earthBase, t);
      } else {
        float t = (uTemperature - 0.5) / 0.5;
        targetBaseColor = mix(earthBase, desertBase, t);
      }

      // 6. Directional Sunlight & Day/Night Terminator
      float sunDot = dot(worldNormal, uSunDirection);
      float dayFactor = smoothstep(-0.25, 0.25, sunDot);
      float diffuse = max(0.20, sunDot * 0.80 + 0.20);

      vec3 litDay = targetBaseColor * diffuse;

      // 7. Ocean/Ice Specular Glint (Asymmetric: Boosts toward Ice, Fades toward Desert)
      float specMultiplier;
      if (uTemperature <= 0.5) {
        // Boost specular glint on frozen ice/snow sheets
        specMultiplier = 1.0 + (0.5 - uTemperature) * 1.6;
      } else {
        // Fade specular glint to near zero on dry desert sand
        specMultiplier = max(0.0, 1.0 - (uTemperature - 0.5) * 2.0);
      }

      // Procedural Noise Sparkle Shimmer on Ice
      float noiseSparkle = fract(sin(dot(vUv * 480.0 + vec2(uTime * 1.2), vec2(12.9898, 78.233))) * 43758.5453);
      float iceSparkle = smoothstep(0.82, 0.98, noiseSparkle) * max(0.0, (0.35 - uTemperature) / 0.35);

      vec3 halfVector = normalize(uSunDirection + viewDir);
      float specAngle = max(0.0, dot(normal, halfVector));
      float specGlint = pow(specAngle, 32.0) * dayFactor * specMultiplier * (1.0 + iceSparkle * 2.5);
      vec3 specColor = vec3(1.0, 0.95, 0.85) * max(0.0, specGlint) * 1.5;

      // 8. Dynamic Night Emissive Lights (Aurora Cyan on Ice, Warm Cities on Earth, Volcanic Lava Red on Desert)
      vec3 iceNight = nightLights * vec3(0.2, 0.9, 1.0) * 2.8;
      vec3 earthNight = nightLights * 2.2;
      vec3 desertNight = mix(nightLights * vec3(1.0, 0.22, 0.05) * 3.2, vec3(0.9, 0.2, 0.0), (1.0 - landFactor) * 0.25);

      vec3 litNight;
      if (uTemperature <= 0.5) {
        float t = uTemperature / 0.5;
        litNight = mix(iceNight, earthNight, t);
      } else {
        float t = (uTemperature - 0.5) / 0.5;
        litNight = mix(earthNight, desertNight, t);
      }
      litNight *= (1.0 - dayFactor);

      // 9. Adaptive Atmospheric Limb Tint (Cyan for Ice, Blue for Earth, Fiery Amber for Desert)
      vec3 iceLimbColor = vec3(0.2, 0.85, 1.0);
      vec3 earthLimbColor = vec3(0.0, 0.85, 1.0);
      vec3 desertLimbColor = vec3(1.0, 0.55, 0.15);

      vec3 activeLimbColor;
      if (uTemperature <= 0.5) {
        activeLimbColor = mix(iceLimbColor, earthLimbColor, uTemperature / 0.5);
      } else {
        activeLimbColor = mix(earthLimbColor, desertLimbColor, (uTemperature - 0.5) / 0.5);
      }

      float limbFactor = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.5) * dayFactor;
      vec3 atmosphereTint = activeLimbColor * limbFactor * uAtmosphereIntensity * 0.25;

      vec3 finalColor = mix(litNight, litDay + specColor, dayFactor) + atmosphereTint;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

function PlanetMesh({ transform, sim, showOrbits }) {
  const planetRef = useRef();
  const cloudsRef = useRef();
  const shaderRef = useRef();

  // Load Earth Texture Pack
  const [albedoMap, bumpMap, cloudsMap, landmaskMap, nightlightsMap] = useTexture([
    '/textures/earth/earth_albedo.jpg',
    '/textures/earth/earth_bump.jpg',
    '/textures/earth/earth_clouds.png',
    '/textures/earth/earth_landmask.png',
    '/textures/earth/earth_nightlights.jpg'
  ]);

  // Sun direction vector matching Sun position
  const sunDirection = useMemo(() => new THREE.Vector3(1, 0.45, 1).normalize(), []);

  // Compute uTemperature uniform
  const uTemperature = useMemo(() => {
    const temp = sim.temp;
    if (temp <= 15) {
      return Math.max(0.0, Math.min(0.5, (temp + 60) / 75 * 0.5));
    } else {
      return Math.min(1.0, 0.5 + (temp - 15) / 45 * 0.5);
    }
  }, [sim.temp]);

  // Climate-driven cloud density and sandstorm haze tinting
  const { cloudOpacity, cloudColor } = useMemo(() => {
    const baseCoverage = Math.max(0, Math.min(1, sim.cloudCoverage));
    if (uTemperature <= 0.5) {
      const t = uTemperature / 0.5;
      return {
        cloudOpacity: Math.min(1.0, baseCoverage * (1.3 - t * 0.3)),
        cloudColor: '#ffffff'
      };
    } else {
      const t = (uTemperature - 0.5) / 0.5;
      return {
        cloudOpacity: baseCoverage * (1.0 - t * 0.55),
        cloudColor: t > 0.3 ? '#fdba74' : '#ffffff'
      };
    }
  }, [sim.cloudCoverage, uTemperature]);

  // Earth Revolution Orbit Points around Sun (Distance = 83.9 units passing through origin [0,0,0])
  const earthOrbitPoints = useMemo(() => {
    const points = [];
    const sunCenter = new THREE.Vector3(56.5, 25.4, 56.5);
    const dist = sunCenter.length(); // ~83.9 units
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        sunCenter.x + Math.cos(theta) * dist,
        0,
        sunCenter.z + Math.sin(theta) * dist
      ));
    }
    return points;
  }, []);

  // Continuous animation loop
  useFrame((_, delta) => {
    // Dynamic GPU Uniform Sync & Sun Direction recalculation
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTemperature.value = uTemperature;
      shaderRef.current.uniforms.uAtmosphereIntensity.value = sim.atmosphereIntensity;
      shaderRef.current.uniforms.uTime.value += delta;

      // Recalculate normalized direction from Earth position to Sun position
      const sunPos = new THREE.Vector3(56.5, 25.4, 56.5);
      const earthPos = new THREE.Vector3(
        !transform.composite ? transform.posX : 0,
        !transform.composite ? transform.posY : 0,
        !transform.composite ? transform.posZ : 0
      );
      const dirToSun = sunPos.clone().sub(earthPos).normalize();
      shaderRef.current.uniforms.uSunDirection.value.copy(dirToSun);
    }

    if (!sim.isPlaying) return;
    const baseSpeed = sim.rotationSpeed * delta * 0.4;

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += baseSpeed * 1.35;
    }

    if (planetRef.current) {
      if (!transform.composite) {
        planetRef.current.rotation.y += baseSpeed;
      }
    }
  });

  // Composite Matrix calculation incorporating Earth's 23.44° axial tilt: M = T * R * S
  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    const t = new THREE.Matrix4().makeTranslation(transform.posX, transform.posY, transform.posZ);
    // Combine user transform rotation + 23.44° axial tilt on Z axis
    const rx = new THREE.Matrix4().makeRotationX(transform.rotX);
    const ry = new THREE.Matrix4().makeRotationY(transform.rotY);
    const rz = new THREE.Matrix4().makeRotationZ(transform.rotZ + EARTH_AXIAL_TILT);
    const r = new THREE.Matrix4().multiplyMatrices(rz, ry).multiply(rx);
    const s = new THREE.Matrix4().makeScale(transform.scaleX, transform.scaleY, transform.scaleZ);
    m.multiplyMatrices(t, r).multiply(s);
    return m;
  }, [
    transform.posX, transform.posY, transform.posZ,
    transform.rotX, transform.rotY, transform.rotZ,
    transform.scaleX, transform.scaleY, transform.scaleZ
  ]);

  return (
    <group>
      {/* Earth Planet Sphere Group with 23.44° Axial Tilt */}
      <group
        matrixAutoUpdate={transform.composite}
        matrix={transform.composite ? matrix : undefined}
        position={!transform.composite ? [transform.posX, transform.posY, transform.posZ] : [0, 0, 0]}
        rotation={!transform.composite ? [transform.rotX, transform.rotY, transform.rotZ + EARTH_AXIAL_TILT] : [0, 0, 0]}
        scale={!transform.composite ? [transform.scaleX, transform.scaleY, transform.scaleZ] : [1, 1, 1]}
      >
        {/* 1. Main Planet Mesh */}
        {/* SYLLABUS: Topic 4 - 3D Surface Representation (Parametric Sphere Geometry 96x96) */}
        {/* SYLLABUS: Topic 9 - Programmable Shaders (Custom GLSL ShaderMaterial driven by uTemperature) */}
        <mesh ref={planetRef} castShadow receiveShadow>
          <sphereGeometry args={[1.5, 96, 96]} />
          <shaderMaterial
            ref={shaderRef}
            args={[PlanetShader]}
            uniforms={{
              uAlbedo: { value: albedoMap },
              uLandmask: { value: landmaskMap },
              uBumpMap: { value: bumpMap },
              uNightLights: { value: nightlightsMap },
              uTemperature: { value: uTemperature },
              uAtmosphereIntensity: { value: sim.atmosphereIntensity },
              uSunDirection: { value: sunDirection },
              uTime: { value: 0 }
            }}
          />
        </mesh>

        {/* 2. Cloud Sphere */}
        {/* SYLLABUS: Topic 7 - Visible-Surface Detection (Z-Buffer Depth Testing with depthWrite={false}) */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.53, 96, 96]} />
          <meshStandardMaterial
            map={cloudsMap}
            color={cloudColor}
            transparent={true}
            opacity={cloudOpacity}
            blending={THREE.NormalBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 3. Tilted 23.44° Earth Rotation Axis Line Overlay (Poles) */}
        {(transform.showAxes || showOrbits) && (
          <line>
            <bufferGeometry
              attach="geometry"
              attributes={{
                position: new THREE.BufferAttribute(new Float32Array([0, -3.5, 0, 0, 3.5, 0]), 3)
              }}
            />
            <lineBasicMaterial attach="material" color="#00f2fe" opacity={0.9} transparent linewidth={2} />
          </line>
        )}

        {/* Coordinate Axes Helper */}
        {transform.showAxes && (
          <axesHelper args={[2.5]} />
        )}
      </group>

      {/* 4. Earth Revolution Path Ring Overlay around Sun */}
      {showOrbits && (
        <line>
          <bufferGeometry
            attach="geometry"
            setFromPoints={earthOrbitPoints}
          />
          <lineBasicMaterial attach="material" color="#ffaa00" opacity={0.75} transparent linewidth={2} />
        </line>
      )}
    </group>
  );
}

export function Planet({ transform, sim, showOrbits }) {
  return (
    <React.Suspense fallback={null}>
      <PlanetMesh transform={transform} sim={sim} showOrbits={showOrbits} />
    </React.Suspense>
  );
}
