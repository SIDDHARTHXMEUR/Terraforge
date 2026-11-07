import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Mars Iron-Oxide Surface Shader
// Features: 2K NASA Viking albedo, Olympus Mons & Valles Marineris relief,
// polar ice caps, and physically based thin sunlit dust scatter (zero outer halos).
// -----------------------------------------------------------------------------
const MarsSurfaceShader = {
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

      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // Polar Ice Caps
      float lat = abs(vUv.y - 0.5) * 2.0;
      float isPolarCap = smoothstep(0.85, 0.96, lat) * smoothstep(0.45, 0.75, length(albedo));

      // Day / Night illumination
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = max(0.0, sunDot);

      // Mars crisp terminator with subtle dusty twilight
      float twilight = smoothstep(0.08, -0.04, sunDot) * smoothstep(-0.08, 0.02, sunDot) * 0.12;
      vec3 twilightColor = vec3(0.85, 0.42, 0.18) * twilight;

      vec3 surfaceDay = albedo * (diffuse * 1.55 + 0.02) + twilightColor;

      // Polar caps
      if (isPolarCap > 0.01) {
        vec3 polarIce = vec3(0.95, 0.96, 1.0) * diffuse * 1.8;
        surfaceDay = mix(surfaceDay, polarIce, isPolarCap * 0.85);
      }

      // Thin Sunlit-Only Atmospheric Dust Scattering (2-3% of radius, zero halo on nightside)
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float sunlitLimb = pow(rim, 5.5) * smoothstep(0.0, 0.35, sunDot);
      vec3 limbColor = vec3(0.90, 0.52, 0.28) * sunlitLimb * 0.55;

      // Dark nightside: pure silhouette in space
      vec3 nightSide = albedo * 0.003;

      gl_FragColor = vec4(surfaceDay + limbColor + nightSide, 1.0);
    }
  `
};

export function CinematicMars({
  position = [0, 0, 0],
  radius = 1.3,
  axialTilt = (25.19 * Math.PI) / 180,
  isPlaying = true,
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/mars/mars.jpg');
  const marsBodyRef = useRef();
  const shaderRef = useRef();

  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  useFrame((_, delta) => {
    if (isPlaying && marsBodyRef.current) {
      // 24.62-hour Martian sol
      marsBodyRef.current.rotation.y += delta * 0.11;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      <mesh ref={marsBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[MarsSurfaceShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunDirection: { value: computedSunDir }
          }}
        />
      </mesh>
    </group>
  );
}
