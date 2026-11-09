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
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying vec3 vLocalPos;

    void main() {
      vUv = uv;
      vLocalPos = normalize(position);
      vec4 worldP = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldP.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = viewMatrix * worldP;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying vec3 vLocalPos;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunPosition;
    uniform float uTime;
    uniform vec3 uIoWorldPos;
    uniform float uIoRadius;

    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPos);
      vec3 V = normalize(cameraPosition - vWorldPos);

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

      // 3D Procedural atmospheric banding & eddy micro-contrast (k <= 0.12, zero mean)
      float nBand = snoise(vec3(vLocalPos.x * 12.0, vLocalPos.y * 42.0, vLocalPos.z * 12.0));
      float nEddy = snoise(vec3(vLocalPos.x * 28.0, vLocalPos.y * 64.0, vLocalPos.z * 28.0)) * 0.5;
      float micro = (nBand + nEddy) * 0.67;
      float grazingFade = smoothstep(0.05, 0.35, dot(N, V));
      float k = 0.08 * grazingFade;
      texColor = texColor * (1.0 + micro * k);

      // Io Shadow Projection onto Jupiter's cloud deck
      vec3 dIo = uIoWorldPos - vWorldPos;
      float distAlongSun = dot(dIo, L);
      float ioShadow = 1.0;
      if (distAlongSun > 0.0 && uIoRadius > 0.01) {
        vec3 dPerp = dIo - distAlongSun * L;
        float shadowDist = length(dPerp);
        ioShadow = smoothstep(uIoRadius * 0.85, uIoRadius * 1.35, shadowDist);
      }

      // Physical Bounded Minnaert Atmospheric Scattering strictly from Sun
      float NdotL = dot(N, L);
      float diffuse = max(0.0, NdotL);
      float cosE = clamp(dot(N, V), 0.0, 1.0);
      float limbDarkening = pow(cosE, 0.25) * 0.70 + 0.30;
      float direct = diffuse * limbDarkening * ioShadow;

      // Thin Sunlit-Only Atmospheric Limb Scatter (zero halo on nightside)
      float rim = 1.0 - cosE;
      float sunlitLimb = pow(rim, 5.5) * smoothstep(0.0, 0.25, NdotL);
      vec3 jovianLimb = vec3(0.95, 0.82, 0.55) * sunlitLimb * 0.45;

      // Dark nightside ambient at 0.015 (dark but textured)
      vec3 nightSide = texColor * 0.015;

      vec3 saturatedColor = mix(texColor, texColor * vec3(1.10, 0.96, 0.86), 0.30);
      vec3 finalColor = saturatedColor * (direct * 1.35) + jovianLimb + nightSide;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function CinematicJupiter({
  position = [0, 0, 0],
  radius = 18.0,
  isPlaying = true,
  sunPosition = [0, 0, 0],
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
      jupiterMap.magFilter = THREE.LinearFilter;
      jupiterMap.generateMipmaps = true;
      jupiterMap.anisotropy = 16;
      jupiterMap.needsUpdate = true;
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
  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      shaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
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
            uSunPosition: { value: sunPosVec },
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
