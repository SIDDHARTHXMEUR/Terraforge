import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CinematicEarth } from '../cinematic/CinematicEarth';

// Version 1 Earth Shader (Exact recovery from tag v1.0 Planet.jsx)
const V1PlanetShader = {
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
    uniform vec3 uSunDirection;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);

      vec3 albedoColor = texture2D(uAlbedo, vUv).rgb;
      float landFactor = texture2D(uLandmask, vUv).r;
      float bumpVal = texture2D(uBumpMap, vUv).r;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      float sunDot = dot(worldNormal, uSunDirection);
      float dayFactor = smoothstep(-0.25, 0.25, sunDot);
      float diffuse = max(0.20, sunDot * 0.80 + 0.20);

      vec3 litDay = albedoColor * diffuse;

      vec3 halfVector = normalize(uSunDirection + viewDir);
      float specAngle = max(0.0, dot(normal, halfVector));
      float specGlint = pow(specAngle, 32.0) * dayFactor * (1.0 - landFactor);
      vec3 specColor = vec3(1.0, 0.95, 0.85) * max(0.0, specGlint) * 1.5;

      float nightFactor = smoothstep(0.15, -0.25, sunDot);
      vec3 litNight = nightLights * nightFactor * 1.8;

      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float atmosphereIntensity = pow(rim, 3.0);
      vec3 atmosphereGlow = vec3(0.0, 0.95, 1.0) * atmosphereIntensity * 1.25;

      gl_FragColor = vec4(litDay + specColor + litNight + atmosphereGlow, 1.0);
    }
  `
};

export function Version1Earth({ radius = 2.0 }) {
  const [albedoMap, bumpMap, cloudsMap, landmaskMap, nightlightsMap] = useTexture([
    '/textures/earth/earth_albedo.jpg',
    '/textures/earth/earth_bump.jpg',
    '/textures/earth/earth_clouds.png',
    '/textures/earth/earth_landmask.png',
    '/textures/earth/earth_nightlights.jpg'
  ]);

  const earthRef = useRef();
  const cloudsRef = useRef();
  const sunDirection = useMemo(() => new THREE.Vector3(1, 0.45, 1).normalize(), []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.12;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.148;
  });

  return (
    <group rotation={[(23.44 * Math.PI) / 180, 0, 0]}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          args={[V1PlanetShader]}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uLandmask: { value: landmaskMap },
            uBumpMap: { value: bumpMap },
            uNightLights: { value: nightlightsMap },
            uSunDirection: { value: sunDirection }
          }}
        />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.02, 96, 96]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.88}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function EarthBaselineComparator({ mode = 'enhanced' }) {
  return (
    <>
      <directionalLight position={[10, 4.5, 10]} intensity={4.5} color="#ffffff" />
      <ambientLight intensity={0.04} color="#050814" />
      {mode === 'version1' ? (
        <Version1Earth radius={2.0} />
      ) : (
        <CinematicEarth position={[0, 0, 0]} radius={2.0} />
      )}
    </>
  );
}

