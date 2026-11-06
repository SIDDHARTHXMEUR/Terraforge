import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

// Atmospheric Limb Fresnel GLSL Shader
const AtmosphereGlowShader = {
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
      float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.2);
      gl_FragColor = vec4(uColor, fresnel * uIntensity);
    }
  `
};

// Earth Custom Multi-Texture GLSL Material Shader
const EarthShader = {
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
    uniform float uTemperature; // 0.0=Cryo Ice (-60°C), 0.5=Earth (+15°C), 1.0=Scorched (+60°C)
    uniform float uAtmosphereIntensity;
    uniform vec3 uSunPosition;
    uniform vec3 uPlanetPosition;
    uniform float uTime;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);

      vec3 sunDir = normalize(uSunPosition - uPlanetPosition);

      // 1. Textures
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;
      float land = texture2D(uLandmask, vUv).r;
      float bump = texture2D(uBumpMap, vUv).r;
      vec3 night = texture2D(uNightLights, vUv).rgb;

      float topoDetail = dot(albedo, vec3(0.299, 0.587, 0.114));
      float poleDist = abs(vUv.y - 0.5) * 2.0;

      // 2. Climate temperature color ramps
      vec3 iceLand = mix(vec3(0.85, 0.93, 0.98), vec3(1.0), topoDetail * 0.7 + bump * 0.3);
      vec3 iceOcean = mix(vec3(0.06, 0.35, 0.65), vec3(0.38, 0.85, 0.98), bump * 0.6);
      vec3 iceBase = mix(iceOcean, iceLand, land);

      float tIce = max(0.0, (0.5 - uTemperature) / 0.5);
      float polarFrost = smoothstep(0.95 - tIce * 0.90, 1.0 - tIce * 0.65, poleDist + (1.0 - land) * 0.1);
      iceBase = mix(iceBase, vec3(0.96, 0.98, 1.0), polarFrost * tIce);

      vec3 desertLand = mix(vec3(0.88, 0.32, 0.05), vec3(1.0, 0.68, 0.22), topoDetail * 0.8);
      vec3 desertOcean = mix(vec3(0.12, 0.04, 0.01), vec3(0.35, 0.15, 0.05), bump * 0.7);
      vec3 desertBase = mix(desertOcean, desertLand, land);

      vec3 baseSurface;
      if (uTemperature <= 0.5) {
        baseSurface = mix(iceBase, albedo, uTemperature / 0.5);
      } else {
        baseSurface = mix(albedo, desertBase, (uTemperature - 0.5) / 0.5);
      }

      // 3. Solar Day/Night Terminator
      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.20, 0.25, sunDot);
      float diffuse = max(0.06, sunDot * 0.94 + 0.06);

      // 4. Night City Lights
      vec3 nightColor = night * 2.2 * (1.0 - dayFactor);

      // 5. Specular Ocean Glint
      vec3 halfVec = normalize(sunDir + viewDir);
      float spec = pow(max(0.0, dot(normal, halfVec)), 28.0) * (1.0 - land) * dayFactor;
      vec3 specularColor = vec3(1.0, 0.95, 0.8) * spec * 1.2;

      // 6. Atmospheric Limb Glow
      float limb = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.2) * dayFactor;
      vec3 atmoGlow = vec3(0.0, 0.75, 1.0) * limb * uAtmosphereIntensity * 0.35;

      vec3 finalColor = (baseSurface * diffuse) + nightColor + specularColor + atmoGlow;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function PlanetBody({
  config,
  position = [0, 0, 0],
  radius = 1,
  isSelected = false,
  isHovered = false,
  onClick,
  isPlaying = true,
  simTime = 1,
  showLabel = true,
  sim = { temp: 15, atmosphereIntensity: 1.0, cloudCoverage: 0.6, rotationSpeed: 0.5 }
}) {
  const planetGroupRef = useRef();
  const sphereRef = useRef();
  const cloudsRef = useRef();
  const ringRef = useRef();
  const earthShaderRef = useRef();

  // Determine textures to load based on planet type
  const isEarth = config.id === 'earth';
  const hasRing = Boolean(config.hasRings && config.ringTexture);

  // Load planet surface texture
  const textureMap = useTexture(config.texture);

  // Load Earth texture pack if planet is Earth
  const earthTextures = useTexture(
    isEarth
      ? [
          '/assets/planets/earth/earth_albedo.jpg',
          '/assets/planets/earth/earth_bump.jpg',
          '/assets/planets/earth/earth_clouds.png',
          '/assets/planets/earth/earth_landmask.png',
          '/assets/planets/earth/earth_nightlights.jpg'
        ]
      : ['/textures/sun/sun_surface.jpg'] // Fallback placeholder
  );

  // Load Saturn ring texture if applicable
  const ringTexture = useTexture(hasRing ? config.ringTexture : '/textures/sun/sun_surface.jpg');

  // Earth temperature uniform mapping: -60°C -> 0.0, +15°C -> 0.5, +60°C -> 1.0
  const uTemperature = useMemo(() => {
    const t = sim?.temp !== undefined ? sim.temp : 15;
    if (t <= 15) {
      return Math.max(0.0, Math.min(0.5, ((t + 60) / 75) * 0.5));
    } else {
      return Math.min(1.0, 0.5 + ((t - 15) / 45) * 0.5);
    }
  }, [sim?.temp]);

  // Sun direction & position uniforms
  const sunPosition = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const planetPosVec = useMemo(() => new THREE.Vector3(...position), [position]);

  const earthUniforms = useMemo(() => {
    if (!isEarth) return {};
    return {
      uAlbedo: { value: earthTextures[0] },
      uBumpMap: { value: earthTextures[1] },
      uLandmask: { value: earthTextures[3] },
      uNightLights: { value: earthTextures[4] },
      uTemperature: { value: uTemperature },
      uAtmosphereIntensity: { value: sim?.atmosphereIntensity || 1.0 },
      uSunPosition: { value: sunPosition },
      uPlanetPosition: { value: planetPosVec },
      uTime: { value: 0 }
    };
  }, [isEarth, earthTextures, uTemperature, sim?.atmosphereIntensity, sunPosition, planetPosVec]);

  // Atmosphere Glow Color
  const atmoColor = useMemo(() => new THREE.Color(config.atmosphereColor || '#38bdf8'), [config.atmosphereColor]);

  // Frame loop for planetary self-rotation and cloud rotation
  useFrame((_, delta) => {
    if (!isPlaying) return;

    const baseSpin = delta * 0.3 * (config.rotationPeriodHours ? (24 / Math.abs(config.rotationPeriodHours)) : 1.0);

    if (sphereRef.current) {
      // Rotation direction (retrograde if rotationPeriodHours < 0 like Venus or Uranus)
      const sign = config.rotationPeriodHours && config.rotationPeriodHours < 0 ? -1 : 1;
      sphereRef.current.rotation.y += baseSpin * sign;
    }

    if (cloudsRef.current) {
      // Clouds rotate slightly faster than the planetary crust
      cloudsRef.current.rotation.y += baseSpin * 1.25;
    }

    if (earthShaderRef.current) {
      earthShaderRef.current.uniforms.uTime.value += delta;
      earthShaderRef.current.uniforms.uTemperature.value = uTemperature;
      earthShaderRef.current.uniforms.uAtmosphereIntensity.value = sim?.atmosphereIntensity || 1.0;
      earthShaderRef.current.uniforms.uPlanetPosition.value.set(...position);
    }
  });

  const axialTiltRad = useMemo(() => {
    return ((config.axialTiltDeg || 0) * Math.PI) / 180;
  }, [config.axialTiltDeg]);

  return (
    <group position={position} onClick={onClick}>
      {/* Selection / Focus Indicator Ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.35, radius * 1.45, 64]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Planetary Body with Astronomical Axial Tilt */}
      <group rotation={[axialTiltRad, 0, 0]}>
        {/* Core Sphere */}
        {isEarth ? (
          <mesh ref={sphereRef}>
            <sphereGeometry args={[radius, 64, 64]} />
            <shaderMaterial
              ref={earthShaderRef}
              vertexShader={EarthShader.vertexShader}
              fragmentShader={EarthShader.fragmentShader}
              uniforms={earthUniforms}
            />
          </mesh>
        ) : (
          <mesh ref={sphereRef}>
            <sphereGeometry args={[radius, 64, 64]} />
            <meshStandardMaterial
              map={textureMap}
              roughness={0.7}
              metalness={0.05}
              color="#ffffff"
            />
          </mesh>
        )}

        {/* Earth Clouds Layer */}
        {isEarth && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[radius * 1.018, 64, 64]} />
            <meshStandardMaterial
              map={earthTextures[2]}
              transparent
              opacity={Math.min(1.0, (sim?.cloudCoverage || 0.6) * 1.1)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Atmospheric Limb Glow for Atmosphere-bearing worlds */}
        {config.atmosphereIntensity > 0.1 && (
          <mesh>
            <sphereGeometry args={[radius * 1.035, 64, 64]} />
            <shaderMaterial
              vertexShader={AtmosphereGlowShader.vertexShader}
              fragmentShader={AtmosphereGlowShader.fragmentShader}
              uniforms={{
                uColor: { value: atmoColor },
                uIntensity: { value: config.atmosphereIntensity * 0.45 }
              }}
              transparent
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Planetary Ring System (Saturn & Uranus) */}
        {hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                radius * (config.ringInnerRadius / config.cinematicRadius || 1.3),
                radius * (config.ringOuterRadius / config.cinematicRadius || 2.4),
                128
              ]}
            />
            <meshStandardMaterial
              map={ringTexture}
              transparent
              opacity={0.88}
              side={THREE.DoubleSide}
              roughness={0.5}
            />
          </mesh>
        )}
      </group>

      {/* 3D HTML Billboard Label */}
      {showLabel && (
        <Html
          position={[0, radius + 1.2, 0]}
          center
          distanceFactor={60}
          className="pointer-events-none select-none"
        >
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 border border-white/20 backdrop-blur-sm text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: config.fallbackColor || '#38bdf8' }}
            />
            <span className="font-bold tracking-wider uppercase">{config.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

