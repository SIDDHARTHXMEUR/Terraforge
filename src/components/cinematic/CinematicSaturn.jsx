import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Saturn 26.73° Astronomical Axial Tilt
const SATURN_AXIAL_TILT = (26.73 * Math.PI) / 180;

// -----------------------------------------------------------------------------
// 1. Saturn Atmosphere Shader with Ring Shadow Projection
// -----------------------------------------------------------------------------
const SaturnSurfaceShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec3 vLocalPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vLocalPosition = position;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec3 vLocalPosition;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunDirection;
    uniform float uRadius;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Physical Bounded Minnaert Limb Darkening for Gas Giant Atmospheres
      float cosI = max(0.0, dot(worldNormal, sunDir));
      float cosE = max(0.0, dot(normal, viewDir));
      float limbFalloff = pow(clamp(cosE, 0.0, 1.0), 0.35);
      float diffuse = pow(cosI, 0.95) * (limbFalloff * 0.75 + 0.25);

      // Subtle warm golden/butterscotch cloud banding
      vec3 saturnGold = vec3(0.96, 0.88, 0.68);
      vec3 baseCloud = mix(texColor, saturnGold, 0.25);

      // -----------------------------------------------------------------------
      // Ring-on-Planet Shadow Projection
      // Check if light ray towards Sun intersects Saturn's ring plane (y = 0)
      // -----------------------------------------------------------------------
      float shadowFactor = 1.0;
      // Ray from vLocalPosition towards sunDir: P(t) = vLocalPosition + t * sunDirLocal
      // Ring plane is y = 0, so t = -vLocalPosition.y / sunDir.y
      if (abs(sunDir.y) > 0.001) {
        float t = -vLocalPosition.y / sunDir.y;
        if (t > 0.0) {
          vec3 ringHit = vLocalPosition + sunDir * t;
          float hitDist = length(vec2(ringHit.x, ringHit.z));
          float rInner = uRadius * 1.35;
          float rOuter = uRadius * 2.85;
          if (hitDist >= rInner && hitDist <= rOuter) {
            // Check if hitting the Cassini Division gap (~ 1.95 - 2.02 R)
            float normR = (hitDist - rInner) / (rOuter - rInner);
            bool isCassiniGap = normR > 0.42 && normR < 0.48;
            if (!isCassiniGap) {
              shadowFactor = 0.22; // Deep shadow of main rings
            }
          }
        }
      }

      // Terminator and diffuse shading
      float sunDot = dot(worldNormal, sunDir);
      float dayFactor = smoothstep(-0.15, 0.25, sunDot);

      // Atmospheric Limb Glow
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float limbScatter = pow(rim, 3.6) * (dayFactor * 0.7 + 0.3);
      vec3 atmoLimb = vec3(0.98, 0.86, 0.58) * limbScatter * 1.4;

      vec3 finalColor = baseCloud * diffuse * shadowFactor * 1.15 + atmoLimb;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// -----------------------------------------------------------------------------
// 2. Saturn Cassini Division Rings with Planet-on-Ring Shadow
// -----------------------------------------------------------------------------
const SaturnRingsShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec3 vLocalPosition;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    varying vec3 vLocalPosition;

    uniform sampler2D uRingMap;
    uniform vec3 uSunDirection;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;

    void main() {
      // Sample radial ring texture
      vec4 ringTex = texture2D(uRingMap, vUv);

      // -----------------------------------------------------------------------
      // Planet-on-Ring Shadow Projection
      // The iconic dark shadow Saturn casts across its rings behind the planet
      // -----------------------------------------------------------------------
      vec3 toSun = normalize(uSunDirection);
      vec3 ringToPlanet = vWorldPosition - uPlanetCenter;

      // Project onto sun ray direction: if behind planet (dot < 0), test distance to shadow cylinder
      float sunProj = dot(ringToPlanet, toSun);
      float shadow = 1.0;

      if (sunProj < 0.0) {
        // Distance perpendicular to shadow ray
        vec3 perp = ringToPlanet - toSun * sunProj;
        float distToAxis = length(perp);
        if (distToAxis < uPlanetRadius * 1.02) {
          float penumbra = smoothstep(uPlanetRadius * 0.96, uPlanetRadius * 1.02, distToAxis);
          shadow = mix(0.04, 1.0, penumbra);
        }
      }

      // Backlit forward-scattering (Cassini high phase angle translucent glow)
      vec3 viewDir = normalize(vViewPosition);
      float forwardFactor = pow(max(0.0, dot(viewDir, toSun)), 4.0);
      vec3 forwardGlow = vec3(1.0, 0.92, 0.72) * forwardFactor * 1.2;

      // Ring illumination: double-sided scattering with transparency and forward glow
      vec3 ringColor = (ringTex.rgb * vec3(1.0, 0.95, 0.84) + forwardGlow) * shadow * 1.5;
      float alpha = ringTex.a * 0.92;

      if (alpha < 0.02) discard;

      gl_FragColor = vec4(ringColor, alpha);
    }
  `
};

export function CinematicSaturn({
  position = [0, 0, 0],
  radius = 4.0,
  isPlaying = true,
  onClick
}) {
  const [saturnMap, ringMap] = useTexture([
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png'
  ]);

  const saturnBodyRef = useRef();
  const surfaceShaderRef = useRef();
  const ringShaderRef = useRef();

  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  // High-density custom Ring Geometry with radial 1D UV mapping
  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.35;
    const outerRadius = radius * 2.85;
    const thetaSegments = 192;
    const phiSegments = 48;

    const geo = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u = (dist - innerRadius) / (outerRadius - innerRadius);
      uvs.setXY(i, u, 0.5);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);

  const planetCenterVec = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((_, delta) => {
    if (isPlaying && saturnBodyRef.current) {
      saturnBodyRef.current.rotation.y += delta * 0.16;
    }
    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
    if (ringShaderRef.current) {
      ringShaderRef.current.uniforms.uSunDirection.value = computedSunDir;
      ringShaderRef.current.uniforms.uPlanetCenter.value.set(...position);
    }
  });

  return (
    <group position={position} rotation={[0, 0, SATURN_AXIAL_TILT]} onClick={onClick}>
      {/* 1. Saturn Oblate Gas Giant Atmosphere Body (f = 0.098 flattening) */}
      <mesh
        ref={saturnBodyRef}
        scale={[1.0, 0.902, 1.0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={surfaceShaderRef}
          args={[SaturnSurfaceShader]}
          uniforms={{
            uAlbedo: { value: saturnMap },
            uSunDirection: { value: computedSunDir },
            uRadius: { value: radius }
          }}
        />
      </mesh>

      {/* 2. Saturn Cassini Division Ring System with Planet Shadow Projection */}
      <mesh
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <shaderMaterial
          ref={ringShaderRef}
          args={[SaturnRingsShader]}
          uniforms={{
            uRingMap: { value: ringMap },
            uSunDirection: { value: computedSunDir },
            uPlanetCenter: { value: planetCenterVec },
            uPlanetRadius: { value: radius }
          }}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
