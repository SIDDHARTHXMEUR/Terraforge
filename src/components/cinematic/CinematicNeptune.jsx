import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Neptune Supersonic Storm Giant Shader
// Features: Deep cobalt-blue coloration, high-altitude white methane cirrus streaks
// ("The Scooter"), Great Dark Spot cyclonic storm, supersonic differential drift,
// and thin sunlit azure limb scattering (zero outer halo shells).
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

      // Authentic Deep Cobalt-Blue Neptune Palette
      vec3 deepNeptuneBlue = vec3(0.08, 0.22, 0.65);
      vec3 baseColor = mix(texColor, deepNeptuneBlue, 0.55);

      // 1. High-Altitude Methane Cirrus Cloud Streaks ("The Scooter")
      vec2 cirrusUv1 = vec2(vUv.x * 6.0 + uTime * 0.025, vUv.y * 42.0);
      float cirrusNoise = sin(cirrusUv1.x) * cos(cirrusUv1.y);
      float latWisp = smoothstep(0.2, 0.8, abs(vUv.y - 0.5));
      float cirrusMask = smoothstep(0.82, 0.98, cirrusNoise) * latWisp;

      // 2. The Great Dark Spot
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

      // Thin Sunlit-Only Azure Limb Scattering (2-3% of radius, zero halo on nightside)
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float sunlitScatter = pow(rim, 5.5) * smoothstep(0.0, 0.35, sunDot);
      vec3 azureLimb = vec3(0.22, 0.50, 0.95) * sunlitScatter * 0.65;

      vec3 surface = baseColor * (diffuse * 1.08 + 0.02) + azureLimb;
      gl_FragColor = vec4(surface, 1.0);
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

    if (isPlaying && bodyRef.current) {
      // 16.11-hour Jovian-speed rotation
      bodyRef.current.rotation.y += delta * 0.10;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Neptune Supersonic Storm Atmosphere Body - Solid, Opaque, Zero Outer Halos */}
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
    </group>
  );
}
