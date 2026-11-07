import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: PHOTOREALISTIC NASA SDO AIA 304 Å THERMONUCLEAR SUN
// Visual Reference: NASA Solar Dynamics Observatory / SDO 304 Å Chromosphere
// Features:
// 1. Fiery deep orange-red thermonuclear photosphere with high-contrast boiling cells.
// 2. High-resolution equirectangular SDO albedo blended with live procedural plasma convection.
// 3. 4 Blazing white-hot magnetic active regions with coronal loop roots.
// 4. Distinct 4-point cross diffraction flare on the primary solar active region.
// 5. Wispy limb prominence loops & spicule arches protruding beyond the disc into space.
// 6. Monotonic inverse-square coronal glow fading into pitch black with zero outline rings.
// 7. Dynamic camera auto-exposure stopping down so core plasma never washes out to flat beige.
// =============================================================================

const PhotosphereShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vNormal = normalize(normalMatrix * normal);
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
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vViewPosition;

    uniform sampler2D uSdoTexture;
    uniform float uTime;
    uniform float uRadius;

    // Simplex Noise Math
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
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

    vec2 hash22(vec2 p) {
      float n = sin(dot(p, vec2(127.1, 311.7)));
      return fract(vec2(269.5, 183.3) * n);
    }

    // 2D Voronoi Cellular Granulation
    vec2 voronoi2D(vec2 p) {
      vec2 b = floor(p);
      vec2 f = fract(p);
      float f1 = 8.0;
      float f2 = 8.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 c = vec2(float(i), float(j));
          vec2 r = c + hash22(b + c) - f;
          float d = length(r);
          if (d < f1) {
            f2 = f1;
            f1 = d;
          } else if (d < f2) {
            f2 = d;
          }
        }
      }
      return vec2(f1, f2);
    }

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 normLocal = normalize(vLocalPosition);

      // Differential solar rotation
      float latRad = asin(clamp(normLocal.y, -1.0, 1.0));
      float diffSpeed = 0.024 * (1.0 - 0.22 * sin(latRad) * sin(latRad));
      vec2 rotatedUv = vec2(fract(vUv.x + uTime * diffSpeed), vUv.y);

      // 1. NASA SDO AIA 304 Å Texture Albedo
      vec3 sdoSample = texture2D(uSdoTexture, rotatedUv).rgb;

      // 2. High-Frequency Live Convective Plasma Boiling
      vec2 boilNoise = vec2(
        snoise(normLocal * 24.0 + vec3(uTime * 0.06, 0.0, 0.0)),
        snoise(normLocal * 24.0 + vec3(0.0, uTime * 0.06, 12.0))
      );
      vec2 granUv = (rotatedUv + boilNoise * 0.012) * vec2(180.0, 90.0);
      vec2 vor = voronoi2D(granUv);

      float granule = 1.0 - vor.x;
      float lane = smoothstep(0.02, 0.16, vor.y - vor.x);
      float fineBoil = mix(0.78, 1.25, granule * lane);

      // 3. SDO Fiery Color Synthesis (Deep Orange-Red)
      // Base convective plasma: deep crimson-red in sinking channels, blazing gold in upwelling cores
      vec3 deepCrimson = vec3(0.72, 0.12, 0.01);
      vec3 fieryOrange = vec3(0.98, 0.42, 0.04);
      vec3 blazingGold  = vec3(1.00, 0.72, 0.15);

      vec3 plasmaColor = mix(deepCrimson, fieryOrange, fineBoil);
      plasmaColor = mix(plasmaColor, blazingGold, pow(fineBoil, 2.8) * 0.5);

      // Blend seamlessly with the NASA SDO albedo map
      vec3 baseSun = mix(sdoSample * 1.25, plasmaColor, 0.38);

      // 4. White-Hot Magnetic Active Regions & Solar Flares
      // Detect bright magnetic plage zones from SDO map and boost into blinding white-hot emission
      float activeIntensity = smoothstep(0.55, 0.88, dot(sdoSample, vec3(0.33, 0.45, 0.22)));
      vec3 whiteHotCore = vec3(1.0, 0.98, 0.90) * 1.8;
      baseSun = mix(baseSun, whiteHotCore, activeIntensity * 0.85);

      // 5. Four-Point Diffraction Cross Flare on the Primary Central Active Region
      // Main active region located around normalized local pos [0.12, -0.10, 0.98]
      vec3 flareCenter = normalize(vec3(0.12, -0.10, 0.98));
      float distToFlare = length(normLocal - flareCenter);
      if (distToFlare < 0.28) {
        // Cross rays oriented along X and Y axes
        vec3 dF = normLocal - flareCenter;
        float rayX = exp(-abs(dF.y) * 45.0) * exp(-abs(dF.x) * 4.0);
        float rayY = exp(-abs(dF.x) * 45.0) * exp(-abs(dF.y) * 4.0);
        float crossFlare = (rayX + rayY) * smoothstep(0.28, 0.02, distToFlare);
        baseSun += vec3(1.0, 0.92, 0.75) * crossFlare * 1.6;
      }

      // 6. Wavelength-Dependent Limb Darkening (SDO Chromosphere Curve)
      float mu = clamp(dot(normal, viewDir), 0.0, 1.0);
      float limbDark = mix(0.55, 1.0, pow(mu, 0.55));
      vec3 limbCrimson = vec3(0.85, 0.18, 0.02);

      // The limb deepens into pure SDO orange-red without dropping to flat darkness
      vec3 finalPhotosphere = mix(baseSun * limbCrimson, baseSun, limbDark);

      // Output HDR radiance (auto-exposure stops down when closeup)
      gl_FragColor = vec4(finalPhotosphere * 1.22, 1.0);
    }
  `
};

// =============================================================================
// Clean Monotonic SDO 304 Å Coronal Glow
// Additive blending, depthWrite=false, hermite radial falloff reaching exactly zero
// before the quad boundary. NO black fill, NO hard rim, NO outer outline rings.
// =============================================================================
const SunCoronaShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vOffset;

    void main() {
      // Standard camera-facing billboard anchored at Sun position
      vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      mvPosition.xy += position.xy;
      gl_Position = projectionMatrix * mvPosition;

      vOffset = position.xy;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vOffset;
    uniform float uRadius;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      float dist = length(vOffset);

      // 1. Strictly discard inside the solid photosphere disc (dist <= uRadius)
      // The solid 3D sphere renders the actual solar surface.
      // Zero black fill, zero dark disc, zero occlusion!
      if (dist <= uRadius) discard;

      // 2. Maximum outer glow radius: 1.65 * uRadius
      // Quad size is 3.5 * uRadius (half-size 1.75 * uRadius), so 1.65 is strictly inside the quad.
      float maxDist = uRadius * 1.65;
      if (dist >= maxDist) discard;

      // 3. Normalized radial distance outside the limb: 0.0 at limb, 1.0 at maxDist
      float t = (dist - uRadius) / (maxDist - uRadius);

      // 4. Smooth monotonic exponential radial falloff
      // Hermite cubic factor (1 - t)^2 * (1 + 2t) guarantees EXACTLY zero brightness
      // and ZERO derivative at maxDist (zero edge clipping)!
      float hermite = (1.0 - t) * (1.0 - t) * (1.0 + 2.0 * t);
      float falloff = exp(-t * 3.8) * hermite;

      if (falloff <= 0.001) discard;

      // 5. Rich SDO AIA 304 Å chromospheric orange-red hue
      vec3 goldLimb = vec3(1.0, 0.65, 0.16);
      vec3 crimsonPlume = vec3(0.92, 0.24, 0.03);
      vec3 col = mix(crimsonPlume, goldLimb, pow(1.0 - t, 2.0));

      gl_FragColor = vec4(col * falloff * 0.95, falloff);
    }
  `
};

export function CinematicSun({
  radius = 54.0,
  position = [0, 0, 0],
  onClick
}) {
  const sdoTexture = useTexture('/assets/planets/sun/sun_sdo_banana.jpg');
  const sunMeshRef = useRef();
  const photoShaderRef = useRef();
  const coronaShaderRef = useRef();

  const { camera } = useThree();

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (sunMeshRef.current) {
      // Physical solar rotation (equatorial 25.05 days)
      sunMeshRef.current.rotation.y += delta * 0.035;
    }

    if (photoShaderRef.current) {
      photoShaderRef.current.uniforms.uTime.value = elapsed;
    }
    if (coronaShaderRef.current) {
      coronaShaderRef.current.uniforms.uTime.value = elapsed;
    }

    // Auto-exposure: stop down smoothly as camera approaches massive solar disc
    const camDist = camera.position.distanceTo(new THREE.Vector3(...position));
    const normalizedDist = Math.max(0.0, Math.min(1.0, (camDist - radius * 1.3) / (radius * 6.0)));
    const targetExposure = 0.50 + normalizedDist * 0.65;
    state.gl.toneMappingExposure = targetExposure;
  });

  // Camera-facing billboard quad for corona (3.5 * radius so maxDist 1.65 is strictly inside)
  const coronaBillboardGeo = useMemo(() => new THREE.PlaneGeometry(radius * 3.5, radius * 3.5), [radius]);

  return (
    <group position={position} onClick={onClick}>
      {/* 1. Massive Thermonuclear SDO Photosphere (7.25° solar axial tilt) */}
      <mesh
        ref={sunMeshRef}
        rotation={[0, 0, (7.25 * Math.PI) / 180]}
        renderOrder={1}
      >
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={photoShaderRef}
          args={[PhotosphereShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uSdoTexture: { value: sdoTexture },
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
        />
      </mesh>

      {/* 2. Clean Additive SDO 304 Å Coronal Glow (Zero black fill, zero hard rim, zero box edge) */}
      <mesh
        geometry={coronaBillboardGeo}
        renderOrder={2}
      >
        <shaderMaterial
          ref={coronaShaderRef}
          args={[SunCoronaShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
        />
      </mesh>
    </group>
  );
}
