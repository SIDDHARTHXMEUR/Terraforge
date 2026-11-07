import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Venus Supercritical Atmosphere & Cloud Shaders
// Features: Dense CO2 + H2SO4 cloud deck, sulfur streak absorption,
// atmospheric super-rotation, diffuse twilight wrapping past terminator,
// and thick pale-gold Rayleigh atmospheric scattering.
// -----------------------------------------------------------------------------
const VenusCloudDeckShader = {
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

    uniform sampler2D uSurfaceMap;
    uniform sampler2D uAtmosphereMap;
    uniform vec3 uSunDirection;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      // Cloud UV drift along equatorial jet streams
      vec2 cloudUv = vUv + vec2(uTime * 0.008, 0.0);
      vec3 clouds1 = texture2D(uAtmosphereMap, cloudUv).rgb;
      vec3 clouds2 = texture2D(uSurfaceMap, vUv).rgb;

      // Blend cloud layers into creamy sulfuric acid atmosphere
      vec3 venusCream = vec3(0.92, 0.86, 0.74);
      vec3 baseCloud = mix(clouds2, clouds1, 0.60) * venusCream;

      // 1. Intense Atmospheric Multiple Scattering (Twilight wrap)
      // Venus's 92-bar atmosphere scatters light deep past the terminator (sunDot ~ -0.28)
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = smoothstep(-0.35, 0.40, sunDot);

      vec3 dayIllumination = baseCloud * (diffuse * 1.05 + 0.05);

      // 2. Thick Atmospheric Limb Scattering
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float limbScatter = pow(rim, 3.2) * (diffuse * 0.7 + 0.3);
      vec3 limbColor = vec3(0.96, 0.82, 0.55) * limbScatter * 1.2;

      // 3. Dense Nightside Infrared Heat Glow (Venus nightside glows faintly in IR / dark bronze)
      float nightFactor = smoothstep(0.1, -0.4, sunDot);
      vec3 nightGlow = vec3(0.015, 0.008, 0.004) * nightFactor;

      gl_FragColor = vec4(dayIllumination + limbColor + nightGlow, 1.0);
    }
  `
};

const VenusAtmosphereHaloShader = {
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
      vec3 sunDir = normalize(uSunDirection);

      float rim = 1.0 - clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
      float glow = pow(rim, 3.4);

      // Multiple scattering extends around limb, but strongly forward-focused
      float sunDot = dot(worldNormal, sunDir);
      float sunFactor = smoothstep(-0.35, 0.30, sunDot);

      float sunAlignment = max(0.0, dot(-normal, sunDir));
      float forwardScatter = pow(sunAlignment, 2.0) * 0.8 + 0.2;

      vec3 atmoColor = vec3(1.0, 0.84, 0.52);
      gl_FragColor = vec4(atmoColor * glow * 1.6 * forwardScatter * sunFactor, glow * 0.45 * sunFactor);
    }
  `
};

export function CinematicVenus({
  position = [0, 0, 0],
  radius = 1.8,
  axialTilt = (177.3 * Math.PI) / 180, // Retrograde axial tilt
  isPlaying = true,
  onClick
}) {
  const [surfaceMap, atmosphereMap] = useTexture([
    '/assets/planets/venus/venus_surface.jpg',
    '/assets/planets/venus/venus_atmosphere.jpg'
  ]);

  const bodyRef = useRef();
  const deckShaderRef = useRef();
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

    if (deckShaderRef.current) {
      deckShaderRef.current.uniforms.uTime.value = elapsed;
      deckShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
    if (haloShaderRef.current) {
      haloShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }

    if (isPlaying && bodyRef.current) {
      // Retrograde rotation (243 Earth days)
      bodyRef.current.rotation.y -= delta * 0.02;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Supercritical Dense Cloud Deck - Solid & Opaque */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={deckShaderRef}
          args={[VenusCloudDeckShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uSurfaceMap: { value: surfaceMap },
            uAtmosphereMap: { value: atmosphereMap },
            uSunDirection: { value: computedSunDir },
            uTime: { value: 0 }
          }}
        />
      </mesh>

      {/* 2. Thick Golden Atmospheric Halo */}
      <mesh scale={1.04} renderOrder={10}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          ref={haloShaderRef}
          args={[VenusAtmosphereHaloShader]}
          uniforms={{
            uSunDirection: { value: computedSunDir }
          }}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={true}
        />
      </mesh>
    </group>
  );
}
