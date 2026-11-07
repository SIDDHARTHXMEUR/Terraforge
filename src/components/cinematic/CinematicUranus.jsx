import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Uranus Sideways Ice Giant Atmosphere Shader
// Features: 97.77° axial tilt, deep methane red-light absorption,
// subtle zonal bands, vertical ice rings with real-time planet shadow,
// and thin sunlit limb scattering (zero outer halo shells).
// -----------------------------------------------------------------------------
const UranusAtmosphereShader = {
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

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Authentic Voyager 2 / Hubble cyan-aquamarine methane coloration
      vec3 uranusCyan = vec3(0.52, 0.84, 0.92);
      vec3 baseColor = mix(texColor, uranusCyan, 0.35);

      // Subtle zonal atmospheric bands
      float latBand = sin(vUv.y * 38.0) * 0.025;
      baseColor += vec3(latBand * 0.5, latBand, latBand * 0.8);

      // Day / Night illumination
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = smoothstep(-0.15, 0.35, sunDot);

      // Thin Sunlit-Only Atmospheric Scattering (2-3% of radius, zero halo on nightside)
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float sunlitLimb = pow(rim, 5.5) * smoothstep(0.0, 0.35, sunDot);
      vec3 limbColor = vec3(0.55, 0.85, 0.95) * sunlitLimb * 0.55;

      vec3 surface = baseColor * (diffuse * 1.05 + 0.02) + limbColor;
      gl_FragColor = vec4(surface, 1.0);
    }
  `
};

// Dedicated Uranus Ring Shader with Planet-on-Ring Shadow Projection
const UranusRingShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    uniform vec3 uSunDirection;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;

    void main() {
      #include <logdepthbuf_fragment>

      float r = length(vUv - vec2(0.5)) * 2.0;
      if (r < 0.60 || r > 0.98) discard;

      float band = sin(r * 45.0) * 0.5 + 0.5;
      float alpha = (0.2 + band * 0.3) * smoothstep(0.60, 0.68, r) * smoothstep(0.98, 0.90, r);

      vec3 ringColor = vec3(0.65, 0.90, 0.96);

      // Planet shadow on rings
      vec3 toSun = normalize(uSunDirection);
      vec3 ringToPlanet = vWorldPosition - uPlanetCenter;
      float sunProj = dot(ringToPlanet, toSun);
      if (sunProj < 0.0) {
        vec3 perp = ringToPlanet - toSun * sunProj;
        if (length(perp) < uPlanetRadius * 1.02) {
          alpha *= 0.15;
        }
      }

      gl_FragColor = vec4(ringColor, alpha * 0.45);
    }
  `
};

export function CinematicUranus({
  position = [0, 0, 0],
  radius = 2.8,
  axialTilt = (97.77 * Math.PI) / 180, // Sideways rolling tilt
  isPlaying = true,
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/uranus/uranus.jpg');
  const bodyRef = useRef();
  const shaderRef = useRef();
  const ringShaderRef = useRef();

  const planetCenterVec = useMemo(() => new THREE.Vector3(...position), [position]);

  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.55;
    const outerRadius = radius * 2.25;
    return new THREE.RingGeometry(innerRadius, outerRadius, 128);
  }, [radius]);

  useFrame((_, delta) => {
    if (isPlaying && bodyRef.current) {
      // 17.24-hour retrograde rotation
      bodyRef.current.rotation.y -= delta * 0.09;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
    if (ringShaderRef.current) {
      ringShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
      ringShaderRef.current.uniforms.uPlanetCenter.value.set(...position);
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Uranus Methane Ice Giant Body - Solid, Opaque, Zero Outer Halos */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[UranusAtmosphereShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunDirection: { value: computedSunDir }
          }}
        />
      </mesh>

      {/* 2. Faint Vertical Ice Rings with Dedicated Shader & Shadow */}
      <mesh
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow
        receiveShadow
      >
        <shaderMaterial
          ref={ringShaderRef}
          args={[UranusRingShader]}
          uniforms={{
            uSunDirection: { value: computedSunDir },
            uPlanetCenter: { value: planetCenterVec },
            uPlanetRadius: { value: radius }
          }}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={true}
        />
      </mesh>
    </group>
  );
}
