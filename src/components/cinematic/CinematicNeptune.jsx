import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Neptune Supersonic Storm Giant Shader
// Features: Deep cobalt-blue coloration, high-altitude white methane cirrus streaks
// ("The Scooter"), Great Dark Spot cyclonic storm depression, supersonic
// differential zonal drift (>2,100 km/h), and intense azure Rayleigh limb glow.
// -----------------------------------------------------------------------------
const NeptuneAtmosphereShader = {
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
    uniform vec3 uSunDirection;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Authentic Deep Cobalt-Blue Neptune Palette (richer & darker than Uranus)
      vec3 deepNeptuneBlue = vec3(0.08, 0.22, 0.65);
      vec3 baseColor = mix(texColor, deepNeptuneBlue, 0.55);

      // 1. High-Altitude Methane Cirrus Cloud Streaks ("The Scooter" & horizontal storm wisps)
      vec2 cirrusUv1 = vec2(vUv.x * 6.0 + uTime * 0.025, vUv.y * 42.0);
      float cirrusNoise = sin(cirrusUv1.x) * cos(cirrusUv1.y);
      float latWisp = smoothstep(0.2, 0.8, abs(vUv.y - 0.5));
      float cirrusMask = smoothstep(0.82, 0.98, cirrusNoise) * latWisp;

      // 2. The Great Dark Spot (cyclonic storm depression in southern hemisphere)
      vec2 spotCenter = vec2(0.55 + sin(uTime * 0.005) * 0.05, 0.38);
      float spotDist = length((vUv - spotCenter) * vec2(1.8, 1.0));
      float darkSpot = smoothstep(0.04, 0.12, spotDist);
      baseColor *= mix(0.72, 1.0, darkSpot);

      // Add delicate white methane ice cirrus
      vec3 whiteCirrus = vec3(0.88, 0.94, 1.0);
      baseColor = mix(baseColor, whiteCirrus, cirrusMask * 0.55);

      // Day / Night illumination
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = smoothstep(-0.18, 0.32, sunDot);

      // Deep Azure Rayleigh Limb Scattering
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float limbScatter = pow(rim, 3.4) * (diffuse * 0.8 + 0.2);
      vec3 azureLimb = vec3(0.22, 0.50, 0.95) * limbScatter * 1.3;

      vec3 surface = baseColor * (diffuse * 1.08 + 0.03) + azureLimb;
      gl_FragColor = vec4(surface, 1.0);
    }
  `
};

const NeptuneHaloShader = {
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

      vec3 deepAzure = vec3(0.22, 0.48, 1.0);
      gl_FragColor = vec4(deepAzure * glow * 1.5 * sunFactor, glow * 0.35 * sunFactor);
    }
  `
};

export function CinematicNeptune({
  position = [0, 0, 0],
  radius = 2.7,
  axialTilt = (28.32 * Math.PI) / 180,
  isPlaying = true,
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/neptune/neptune.jpg');
  const bodyRef = useRef();
  const shaderRef = useRef();
  const haloShaderRef = useRef();

  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      shaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
    if (haloShaderRef.current) {
      haloShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }

    if (isPlaying && bodyRef.current) {
      // 16.11-hour Jovian-speed rotation
      bodyRef.current.rotation.y += delta * 0.10;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Neptune Supersonic Storm Atmosphere Body - Solid & Opaque */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[NeptuneAtmosphereShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunDirection: { value: computedSunDir },
            uTime: { value: 0 }
          }}
        />
      </mesh>

      {/* 2. Rich Deep Azure Atmospheric Rayleigh Limb Halo */}
      <mesh scale={1.036} renderOrder={10}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          ref={haloShaderRef}
          args={[NeptuneHaloShader]}
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
  );
}
