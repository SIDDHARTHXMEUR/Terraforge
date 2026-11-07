import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth 23.44° Astronomical Axial Tilt
const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;
const MOON_INCLINATION = (5.14 * Math.PI) / 180;

// 1. Earth Surface Multi-Layer GLSL Shader
// Features: NASA 2K Blue/Black Marble textures, physical terminator with twilight band,
// land/ocean specular glint, cloud shadow projection, and night city illumination.
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
      float bump = texture2D(uBumpMap, vUv).r;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      // 2. Day/Night Lighting & Terminator Roll-off
      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.20, 0.22, sunDot);
      float diffuse = max(0.0, sunDot * 0.95 + 0.05);

      // 3. Subtle Cloud Shadow Projection onto ground
      vec2 shadowUv = vUv + vec2(sunDir.x, sunDir.z) * 0.008;
      float cloudShadow = 1.0 - texture2D(uCloudsMap, shadowUv).r * 0.35;

      vec3 surfaceDay = albedo * diffuse * cloudShadow;

      // 4. Twilight Rayleigh Sunset Band along Terminator
      float twilightFactor = smoothstep(0.22, 0.0, abs(sunDot)) * 0.4;
      vec3 twilightColor = vec3(0.95, 0.38, 0.12) * twilightFactor;

      // 5. Ocean Specular Sun Glint (Only on water, masked by land and clouds)
      vec3 halfVec = normalize(sunDir + viewDir);
      float specAngle = max(0.0, dot(normal, halfVec));
      float cloudVal = texture2D(uCloudsMap, vUv).r;
      float oceanGlint = pow(specAngle, 48.0) * (1.0 - landFactor) * dayFactor * (1.0 - cloudVal * 0.85);
      vec3 glintColor = vec3(1.0, 0.95, 0.85) * oceanGlint * 2.5;

      // 6. NASA Black Marble Night Lights (Active ONLY on dark side)
      float nightFactor = smoothstep(0.12, -0.22, sunDot);
      vec3 litNight = nightLights * nightFactor * 1.8;

      // 7. Atmospheric Rayleigh Limb Scattering
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float rayleighIntensity = pow(rim, 3.2) * max(0.1, sunDot * 0.7 + 0.3);
      vec3 atmosphereScatter = vec3(0.18, 0.55, 1.0) * rayleighIntensity * 1.6;

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

    void main() {
      #include <logdepthbuf_fragment>

      vec4 cloudTex = texture2D(uCloudsMap, vUv);
      if (cloudTex.r < 0.04) discard;

      vec3 sunDir = normalize(uSunDirection);
      vec3 worldNormal = normalize(vWorldNormal);

      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.15, 0.25, sunDot);

      // Lit clouds on daylight side, dark translucent clouds on night side
      vec3 cloudColor = vec3(1.0, 1.0, 1.0) * (dayFactor * 0.95 + 0.05);
      float alpha = cloudTex.r * (dayFactor * 0.75 + 0.20);

      gl_FragColor = vec4(cloudColor, alpha * 0.92);
    }
  `
};

// 3. Smooth Atmospheric Outer Rayleigh Limb Halo Shader
const EarthAtmosphereHaloShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    void main() {
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

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    uniform vec3 uSunDirection;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);

      float rim = 1.0 - clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
      float glow = pow(rim, 3.6);

      // Only glow on sunlit limb
      float sunFactor = smoothstep(-0.2, 0.35, dot(worldNormal, normalize(uSunDirection)));

      vec3 atmoColor = mix(vec3(0.15, 0.45, 1.0), vec3(0.4, 0.75, 1.0), rim);
      gl_FragColor = vec4(atmoColor * glow * 1.5 * sunFactor, glow * 0.8 * sunFactor);
    }
  `
};

export function CinematicEarth({
  position = [0, 0, 0],
  radius = 2.0,
  isPlaying = true,
  axialTilt = EARTH_AXIAL_TILT,
  sunDirection,
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
  const haloShaderRef = useRef();

  // Compute accurate sunlight vector arriving at Earth
  const computedSunDir = useMemo(() => {
    if (sunDirection) return sunDirection;
    const earthPos = new THREE.Vector3(...position);
    if (earthPos.lengthSq() > 1.0) {
      // In solar system: vector from Earth toward Sun at [0, 0, 0]
      return new THREE.Vector3(0, 0, 0).sub(earthPos).normalize();
    }
    // In standalone inspection: standard key sunlight [1, 0.45, 1]
    return new THREE.Vector3(1, 0.45, 1).normalize();
  }, [position, sunDirection]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uTime.value = elapsed;
      surfaceShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
    if (cloudsShaderRef.current) {
      cloudsShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
    if (haloShaderRef.current) {
      haloShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }

    if (isPlaying) {
      // Earth axial rotation (23.93 hours)
      if (earthBodyRef.current) {
        earthBodyRef.current.rotation.y += delta * 0.12;
      }
      // Differential atmospheric cloud drift (+25% faster than terrain)
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * 0.148;
      }
      // Lunar Keplerian orbit (27.3 Earth days per lunar revolution)
      moonOrbitAngleRef.current += delta * (0.12 / 27.3) * 6.0;
    }

    // Moon Position & Tidal Locking
    const moonDist = radius * 5.8;
    const mAngle = moonOrbitAngleRef.current;
    if (moonRef.current) {
      moonRef.current.position.set(
        Math.cos(mAngle) * moonDist,
        Math.sin(mAngle * 0.5) * 0.4,
        Math.sin(mAngle) * moonDist
      );
      // Tidal lock: Same lunar face continuously faces Earth
      moonRef.current.rotation.y = -mAngle + Math.PI / 2;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Earth tilted group with 23.44° astronomical axial tilt on Z */}
      <group ref={earthGroupRef} rotation={[0, 0, axialTilt]}>
        {/* 1. Main Planet Surface - Solid & Opaque */}
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
        </mesh>

        {/* 2. Realistic Dynamic Cloud Layer with Terminator Shading */}
        <mesh ref={cloudsRef} scale={1.018} renderOrder={5}>
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial
            ref={cloudsShaderRef}
            args={[EarthCloudsShader]}
            uniforms={{
              uCloudsMap: { value: cloudsMap },
              uSunDirection: { value: computedSunDir }
            }}
            transparent={true}
            blending={THREE.NormalBlending}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>

        {/* 3. Smooth Atmospheric Outer Rayleigh Limb Halo */}
        <mesh scale={1.045} renderOrder={10}>
          <sphereGeometry args={[radius, 64, 64]} />
          <shaderMaterial
            ref={haloShaderRef}
            args={[EarthAtmosphereHaloShader]}
            transparent={true}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
            depthTest={true}
            uniforms={{
              uSunDirection: { value: computedSunDir }
            }}
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
