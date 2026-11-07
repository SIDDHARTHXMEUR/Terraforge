import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Jupiter 3.13° Axial Tilt
const JUPITER_AXIAL_TILT = (3.13 * Math.PI) / 180;

// -----------------------------------------------------------------------------
// Jupiter Gas Giant Atmospheric Zonal Shear Shader
// Features: Alternating counter-rotating equatorial/tropical jet streams,
// micro-turbulent cyclonic vortices, Great Red Spot storm whorl,
// Minnaert gas giant limb darkening, and amber/cream atmospheric Rayleigh rim.
// -----------------------------------------------------------------------------
const JupiterSurfaceShader = {
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
    uniform vec3 uSunDirection;
    uniform float uTime;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      // Zonal Shear Velocity Profile:
      // Alternating bands along latitude (vUv.y) have opposing velocities
      float lat = (vUv.y - 0.5) * 3.14159;
      float jetSpeed = sin(lat * 8.0) * 0.0035;
      vec2 shearedUv = vec2(vUv.x + jetSpeed * uTime, vUv.y);

      // Great Red Spot Vortex Turbulence (Lat ~ -22°, Long ~ 0.58)
      vec2 grsCenter = vec2(0.58, 0.38);
      vec2 delta = shearedUv - grsCenter;
      float distGrs = length(delta * vec2(1.6, 1.0));
      if (distGrs < 0.075) {
        float angle = atan(delta.y, delta.x);
        float spin = uTime * 0.018 * (1.0 - distGrs / 0.075);
        shearedUv = grsCenter + vec2(cos(angle + spin), sin(angle + spin)) * length(delta);
      }

      vec3 texColor = texture2D(uAlbedo, shearedUv).rgb;

      // Physical Bounded Minnaert Atmospheric Scattering
      float cosI = max(0.0, dot(worldNormal, sunDir));
      float cosE = max(0.0, dot(normal, viewDir));
      float limbFalloff = pow(clamp(cosE, 0.0, 1.0), 0.35);
      float diffuse = pow(cosI, 0.92) * (limbFalloff * 0.75 + 0.25);

      // Day / Night illumination
      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.16, 0.28, sunDot);

      // Amber/Cream Atmospheric Limb Scattering
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float limbScatter = pow(rim, 3.4) * (dayFactor * 0.75 + 0.25);
      vec3 jovianLimb = vec3(0.95, 0.82, 0.55) * limbScatter * 1.2;

      vec3 finalColor = texColor * diffuse * 1.15 + jovianLimb;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const JupiterHaloShader = {
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
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float rim = 1.0 - clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
      float glow = pow(rim, 3.6);
      vec3 atmoColor = vec3(0.92, 0.75, 0.45);
      gl_FragColor = vec4(atmoColor * glow * 1.4, glow * 0.25);
    }
  `
};

export function CinematicJupiter({
  position = [0, 0, 0],
  radius = 5.2,
  isPlaying = true,
  onClick
}) {
  const [jupiterMap, ioMap, europaMap] = useTexture([
    '/assets/planets/jupiter/jupiter.jpg',
    '/assets/planets/moons/io.jpg',
    '/assets/planets/moons/europa.jpg'
  ]);

  const jupiterRef = useRef();
  const shaderRef = useRef();
  const ioRef = useRef();
  const europaRef = useRef();
  const ioAngleRef = useRef(0.5);
  const europaAngleRef = useRef(2.1);

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

    if (isPlaying) {
      if (jupiterRef.current) {
        // Rapid 9.92-hour Jovian rotation
        jupiterRef.current.rotation.y += delta * 0.20;
      }
      ioAngleRef.current += delta * 0.42;
      europaAngleRef.current += delta * 0.21;
    }

    // Io Orbit (421,700 km, volcanic sulfur moon)
    if (ioRef.current) {
      const ioDist = radius * 2.2;
      ioRef.current.position.set(
        Math.cos(ioAngleRef.current) * ioDist,
        0,
        Math.sin(ioAngleRef.current) * ioDist
      );
      ioRef.current.rotation.y = -ioAngleRef.current;
    }

    // Europa Orbit (670,900 km, ice ocean moon)
    if (europaRef.current) {
      const euDist = radius * 3.4;
      europaRef.current.position.set(
        Math.cos(europaAngleRef.current) * euDist,
        0.2,
        Math.sin(europaAngleRef.current) * euDist
      );
      europaRef.current.rotation.y = -europaAngleRef.current;
    }
  });

  return (
    <group position={position} rotation={[0, 0, JUPITER_AXIAL_TILT]} onClick={onClick}>
      {/* 1. Oblate Gas Giant Body (flattening f = 0.065, scale [1, 0.935, 1]) */}
      <mesh
        ref={jupiterRef}
        scale={[1.0, 0.935, 1.0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[JupiterSurfaceShader]}
          uniforms={{
            uAlbedo: { value: jupiterMap },
            uSunDirection: { value: computedSunDir },
            uTime: { value: 0 }
          }}
        />
      </mesh>

      {/* 2. Amber/Cream Atmospheric Rayleigh Halo */}
      <mesh scale={[1.034, 0.967, 1.034]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          args={[JupiterHaloShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Io (Volcanic Sulfur Moon) */}
      <mesh ref={ioRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.065, 32, 32]} />
        <meshStandardMaterial
          map={ioMap}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* 4. Europa (Subsurface Ice Ocean Moon) */}
      <mesh ref={europaRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.055, 32, 32]} />
        <meshStandardMaterial
          map={europaMap}
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
}
