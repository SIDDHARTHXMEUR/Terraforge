import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Convective Solar Plasma Shader with Limb Darkening & Granulation
const SunSurfaceShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform sampler2D uSunTexture;
    uniform float uTime;

    // Fast 2D simplex-style noise for convective plasma granulation
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Multi-frequency turbulent plasma granulation
      vec2 uvNoise = vUv * 16.0;
      float n1 = snoise(uvNoise + vec2(uTime * 0.05, uTime * 0.03));
      float n2 = snoise(uvNoise * 2.5 - vec2(uTime * 0.08, uTime * 0.06)) * 0.5;
      float granulation = (n1 + n2) * 0.5 + 0.5;

      // Base Photosphere texture sample
      vec3 texColor = texture2D(uSunTexture, vUv + vec2(n1 * 0.015, n2 * 0.015)).rgb;

      // Solar Color Gradient: Deep core white-gold -> convective amber -> fiery orange-red limb
      vec3 coreColor = vec3(1.0, 0.98, 0.88);
      vec3 midColor = vec3(1.0, 0.65, 0.15);
      vec3 edgeColor = vec3(0.95, 0.25, 0.05);

      vec3 plasmaColor = mix(edgeColor, midColor, granulation);
      plasmaColor = mix(plasmaColor, coreColor, pow(granulation, 2.5) * 0.8);
      plasmaColor *= (texColor * 1.5 + 0.5);

      // Eddington Solar Limb Darkening: I(mu) = I_0 * (1 - u*(1 - cos(theta)))
      float cosTheta = max(0.0, dot(normal, viewDir));
      float limbDarkening = 0.45 + 0.55 * pow(cosTheta, 0.65);

      // Intense Solar Limb Flare Rim
      float rimFlare = pow(1.0 - cosTheta, 3.5) * 2.2;
      vec3 rimColor = vec3(1.0, 0.45, 0.1) * rimFlare;

      vec3 finalColor = (plasmaColor * limbDarkening * 1.8) + rimColor;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function CinematicSun({ radius = 12.0, onClick, isSelected = false }) {
  const sunTexture = useTexture('/textures/sun/sun_surface.jpg');
  const shaderRef = useRef();
  const coronaRef = useRef();

  useFrame((_, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z += delta * 0.02;
    }
  });

  const uniforms = useMemo(() => ({
    uSunTexture: { value: sunTexture },
    uTime: { value: 0 }
  }), [sunTexture]);

  return (
    <group position={[0, 0, 0]} onClick={onClick}>
      {/* Central Omnidirectional Solar Radiance PointLight */}
      <pointLight
        position={[0, 0, 0]}
        intensity={5.0}
        distance={2500}
        decay={0.02}
        color="#fffaf0"
      />

      {/* Ambient Deep Space Baseline */}
      <ambientLight intensity={0.12} color="#1e293b" />

      {/* Main Photosphere with Dynamic Granulation Shader */}
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={SunSurfaceShader.vertexShader}
          fragmentShader={SunSurfaceShader.fragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Inner Coronal Glow Atmosphere */}
      <mesh>
        <sphereGeometry args={[radius * 1.06, 64, 64]} />
        <meshBasicMaterial
          color="#ff7700"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Expansive Coronal Halo */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[radius * 1.25, 64, 64]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Distant Solar Prominence Halo */}
      <mesh>
        <sphereGeometry args={[radius * 1.6, 48, 48]} />
        <meshBasicMaterial
          color="#ff3300"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
