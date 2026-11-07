import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Jupiter 3.13° Axial Tilt
const JUPITER_AXIAL_TILT = (3.13 * Math.PI) / 180;

// -----------------------------------------------------------------------------
// Jupiter Gas Giant Atmospheric Zonal Shear Shader
// Features: Counter-rotating equatorial/tropical jet streams,
// Great Red Spot storm vortex, transiting Io shadow projection on cloud deck,
// Minnaert limb darkening, and thin sunlit limb scattering (zero outer halo shells).
// -----------------------------------------------------------------------------
const JupiterSurfaceShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldP = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldP.xyz;
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
    varying vec3 vWorldPos;
    varying vec3 vViewPosition;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunDirection;
    uniform float uTime;
    uniform vec3 uIoWorldPos;
    uniform float uIoRadius;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      // Zonal Shear Velocity Profile:
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

      // Io Shadow Projection onto Jupiter's cloud deck
      vec3 dIo = uIoWorldPos - vWorldPos;
      float distAlongSun = dot(dIo, sunDir);
      float ioShadow = 1.0;
      if (distAlongSun > 0.0 && uIoRadius > 0.01) {
        vec3 dPerp = dIo - distAlongSun * sunDir;
        float shadowDist = length(dPerp);
        ioShadow = smoothstep(uIoRadius * 0.85, uIoRadius * 1.35, shadowDist);
      }

      // Physical Bounded Minnaert Atmospheric Scattering
      float cosI = max(0.0, dot(worldNormal, sunDir));
      float cosE = max(0.0, dot(normal, viewDir));
      float limbFalloff = pow(clamp(cosE, 0.0, 1.0), 0.35);
      float diffuse = pow(cosI, 0.92) * (limbFalloff * 0.75 + 0.25) * ioShadow;

      // Thin Sunlit-Only Atmospheric Limb Scatter (2-3% of radius, zero halo on nightside)
      float sunDot = dot(worldNormal, sunDir);
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float sunlitLimb = pow(rim, 5.5) * smoothstep(0.0, 0.35, sunDot);
      vec3 jovianLimb = vec3(0.95, 0.82, 0.55) * sunlitLimb * 0.55;

      vec3 finalColor = texColor * diffuse * 1.15 + jovianLimb;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function CinematicJupiter({
  position = [0, 0, 0],
  radius = 18.0,
  isPlaying = true,
  onClick
}) {
  const [jupiterMap, ioMap, europaMap, ganymedeMap, callistoMap] = useTexture([
    '/assets/planets/jupiter/jupiter.jpg',
    '/assets/planets/moons/io.jpg',
    '/assets/planets/moons/europa.jpg',
    '/assets/planets/ceres/ceres.jpg',
    '/assets/planets/moon/moon.jpg'
  ]);

  useEffect(() => {
    if (jupiterMap) {
      jupiterMap.wrapS = THREE.RepeatWrapping;
      jupiterMap.minFilter = THREE.LinearMipmapLinearFilter;
      jupiterMap.generateMipmaps = true;
    }
  }, [jupiterMap]);

  const jupiterRef = useRef();
  const shaderRef = useRef();
  const ioRef = useRef();
  const europaRef = useRef();
  const ganymedeRef = useRef();
  const callistoRef = useRef();
  const ioAngleRef = useRef(0.5);
  const europaAngleRef = useRef(2.1);
  const ganymedeAngleRef = useRef(3.8);
  const callistoAngleRef = useRef(5.2);

  const ioWorldPosRef = useRef(new THREE.Vector3());

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
      const worldPos = new THREE.Vector3();
      if (jupiterRef.current) {
        jupiterRef.current.getWorldPosition(worldPos);
      }
      const sunDir = worldPos.lengthSq() > 0.1
        ? new THREE.Vector3(0, 0, 0).sub(worldPos).normalize()
        : new THREE.Vector3(1, 0, 0);
      shaderRef.current.uniforms.uSunDirection.value.copy(sunDir);
      if (ioRef.current) {
        ioRef.current.getWorldPosition(ioWorldPosRef.current);
        shaderRef.current.uniforms.uIoWorldPos.value.copy(ioWorldPosRef.current);
      }
    }

    if (isPlaying) {
      if (jupiterRef.current) {
        // Rapid 9.92-hour Jovian rotation
        jupiterRef.current.rotation.y += delta * 0.20;
      }
      ioAngleRef.current += delta * 0.42;
      europaAngleRef.current += delta * 0.21;
      ganymedeAngleRef.current += delta * 0.105;
      callistoAngleRef.current += delta * 0.045;
    }

    // Io Orbit (1.77 days)
    if (ioRef.current) {
      const ioDist = radius * 2.2;
      ioRef.current.position.set(
        Math.cos(ioAngleRef.current) * ioDist,
        0,
        Math.sin(ioAngleRef.current) * ioDist
      );
      ioRef.current.rotation.y = -ioAngleRef.current;
    }

    // Europa Orbit (3.55 days)
    if (europaRef.current) {
      const euDist = radius * 3.4;
      europaRef.current.position.set(
        Math.cos(europaAngleRef.current) * euDist,
        0.2,
        Math.sin(europaAngleRef.current) * euDist
      );
      europaRef.current.rotation.y = -europaAngleRef.current;
    }

    // Ganymede Orbit (7.15 days)
    if (ganymedeRef.current) {
      const ganDist = radius * 4.8;
      ganymedeRef.current.position.set(
        Math.cos(ganymedeAngleRef.current) * ganDist,
        -0.15,
        Math.sin(ganymedeAngleRef.current) * ganDist
      );
      ganymedeRef.current.rotation.y = -ganymedeAngleRef.current;
    }

    // Callisto Orbit (16.69 days)
    if (callistoRef.current) {
      const calDist = radius * 6.4;
      callistoRef.current.position.set(
        Math.cos(callistoAngleRef.current) * calDist,
        0.3,
        Math.sin(callistoAngleRef.current) * calDist
      );
      callistoRef.current.rotation.y = -callistoAngleRef.current;
    }
  });

  const ioRadiusVal = radius * 0.065;

  return (
    <group position={position} rotation={[0, 0, JUPITER_AXIAL_TILT]} onClick={onClick}>
      {/* Oblate Gas Giant Body - Solid, Opaque, Zero Outer Halos */}
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
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: jupiterMap },
            uSunDirection: { value: computedSunDir },
            uTime: { value: 0 },
            uIoWorldPos: { value: new THREE.Vector3() },
            uIoRadius: { value: ioRadiusVal }
          }}
        />
      </mesh>

      {/* 1. Io (Volcanic Sulfur Moon) */}
      <mesh ref={ioRef} castShadow receiveShadow>
        <sphereGeometry args={[ioRadiusVal, 32, 32]} />
        <meshStandardMaterial
          map={ioMap}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Europa (Subsurface Ice Ocean Moon) */}
      <mesh ref={europaRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.055, 32, 32]} />
        <meshStandardMaterial
          map={europaMap}
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>

      {/* 3. Ganymede (Largest Moon in Solar System) */}
      <mesh ref={ganymedeRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.076, 32, 32]} />
        <meshStandardMaterial
          map={ganymedeMap}
          roughness={0.7}
          metalness={0.05}
          color="#cfd3d8"
        />
      </mesh>

      {/* 4. Callisto (Ancient Heavily Cratered Moon) */}
      <mesh ref={callistoRef} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.068, 32, 32]} />
        <meshStandardMaterial
          map={callistoMap}
          roughness={0.85}
          metalness={0.0}
          color="#8c8278"
        />
      </mesh>
    </group>
  );
}
