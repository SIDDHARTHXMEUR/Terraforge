import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: PHOTOREALISTIC PROCEDURAL SUN
// Reference: NASA Solar Dynamics Observatory (SDO/HMI Continuum) / Swedish 1m
// Features:
// 1. Layered Worley/Voronoi granulation (1-2% R) with domain-warped convective boil.
// 2. Bright intergranular lanes & low-contrast supergranulation network.
// 3. 4 Sunspot active groups (dark umbra + striated penumbra) in +/- 30° latitude belts.
// 4. Bright faculae plages prominent toward the limb.
// 5. Differential rotation (25d equator / 35d poles) with 7.25° axial tilt.
// 6. Wavelength-dependent limb darkening: Blue drops faster than Red, shifting #FFF4E0 center to #E0752A limb.
// 7. Additive inverse-square corona reaching zero before edge (no dark halos, no outline ring).
// 8. Thin pinkish-red H-alpha chromosphere fringe (656.3 nm).
// 9. Camera auto-exposure stopping down so the core never clips into flat white.
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

    uniform float uTime;
    uniform float uRadius;

    // -------------------------------------------------------------------------
    // 3D Simplex & Worley/Voronoi Math
    // -------------------------------------------------------------------------
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

    // 2D 9-sample Voronoi for high-performance cellular granulation
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

    // Sunspot helper: evaluates dark umbra, penumbral striations, and faculae plages
    float evaluateSunspot(vec3 normPos, vec3 spotCenter, float rUmbra, float rPenumbra, out float outFaculae) {
      float cosDist = dot(normPos, spotCenter);
      float angDist = acos(clamp(cosDist, -1.0, 1.0));

      outFaculae = 0.0;

      // Outer faculae plage zone (bright magnetic halo outside penumbra)
      if (angDist > rPenumbra * 0.9 && angDist < rPenumbra * 2.2) {
        float plageMask = smoothstep(rPenumbra * 2.2, rPenumbra * 1.3, angDist)
                        * smoothstep(rPenumbra * 0.85, rPenumbra * 1.1, angDist);
        float plageNoise = snoise(normPos * 36.0) * 0.5 + 0.5;
        outFaculae = plageMask * plageNoise;
      }

      if (angDist >= rPenumbra) return 1.0;

      // Inside Umbra
      if (angDist <= rUmbra) {
        float umbraGrad = smoothstep(0.0, rUmbra, angDist);
        // Cool dark umbra (temperature ~4000 K vs 5772 K photosphere)
        return mix(0.18, 0.28, umbraGrad);
      }

      // Inside Penumbra: filamentary radially striated structure
      float penumbraT = (angDist - rUmbra) / (rPenumbra - rUmbra);
      // Magnetic fibrils radially aligned toward umbra
      vec3 localDir = normalize(normPos - spotCenter);
      float fibrilAngle = atan(localDir.y, localDir.x);
      float striation = sin(fibrilAngle * 38.0 + snoise(normPos * 25.0) * 3.5) * 0.12;
      float penumbraLuminance = mix(0.32, 0.88, penumbraT) + striation;
      return clamp(penumbraLuminance, 0.25, 0.95);
    }

    void main() {
      #include <logdepthbuf_fragment>

      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      vec3 normLocal = normalize(vLocalPosition);

      // -----------------------------------------------------------------------
      // 1. Differential Rotation (Equator ~25d, Poles ~35d)
      // -----------------------------------------------------------------------
      float sinLat = normLocal.y; // sin(latitude)
      float diffRate = (1.0 - 0.28 * sinLat * sinLat);
      float rotTime = uTime * 0.012 * diffRate;

      // Rotated UV coordinates
      vec2 rotatedUv = vUv;
      rotatedUv.x = fract(rotatedUv.x + rotTime);

      // Subtle micro-warp for organic cell shapes (kept tiny to prevent stretching)
      vec3 warpCoord = normLocal * 4.5 + vec3(0.0, uTime * 0.005, 0.0);
      vec2 warp = vec2(
        snoise(warpCoord),
        snoise(warpCoord + vec3(4.3, 1.7, 2.9))
      ) * 0.007;

      // -----------------------------------------------------------------------
      // 2. Photosphere Granulation (Voronoi Cells ~1-2% of R, 220x110 cells)
      // -----------------------------------------------------------------------
      vec2 granUv = (rotatedUv + warp) * vec2(220.0, 110.0);
      vec2 granVor = voronoi2D(granUv);

      // Cell core has a convex parabolic profile (brightest in center)
      float cellDist = granVor.x;
      float granuleCore = sqrt(clamp(1.0 - cellDist * 2.2, 0.0, 1.0));

      // Dark, narrow intergranular channels where cooler plasma sinks
      float laneDist = granVor.y - granVor.x;
      float intergranularLane = smoothstep(0.02, 0.16, laneDist);

      // Slow convective simmering modulation
      float simmer = sin(uTime * 0.10 + snoise(normLocal * 15.0) * 6.28) * 0.05;
      float granulation = mix(0.82, 1.06, granuleCore * intergranularLane) + simmer;

      // -----------------------------------------------------------------------
      // 3. Supergranulation (Macro Convective Network, 8x larger)
      // -----------------------------------------------------------------------
      vec2 superUv = (rotatedUv + warp * 0.5) * vec2(24.0, 12.0);
      vec2 superVor = voronoi2D(superUv);
      float supergran = smoothstep(0.65, 0.0, superVor.x) * 0.08 - 0.04;
      granulation += supergran;

      // -----------------------------------------------------------------------
      // 4. Sunspots & Limb Faculae (Active +/- 10° to 30° Latitude Belts)
      // -----------------------------------------------------------------------
      float spotFactor = 1.0;
      float faculaePlages = 0.0;
      float f1, f2, f3, f4;

      // Group 1: Northern Bipolar Group (lat +18°, lon 45°)
      vec3 spot1 = normalize(vec3(cos(0.78) * cos(0.31), sin(0.31), sin(0.78) * cos(0.31)));
      spotFactor *= evaluateSunspot(normLocal, spot1, 0.022, 0.065, f1);
      faculaePlages += f1;

      // Group 2: Northern Single Spot (lat +24°, lon 170°)
      vec3 spot2 = normalize(vec3(cos(2.96) * cos(0.42), sin(0.42), sin(2.96) * cos(0.42)));
      spotFactor *= evaluateSunspot(normLocal, spot2, 0.018, 0.052, f2);
      faculaePlages += f2;

      // Group 3: Southern Complex Group (lat -16°, lon 110°)
      vec3 spot3 = normalize(vec3(cos(1.92) * cos(-0.28), sin(-0.28), sin(1.92) * cos(-0.28)));
      spotFactor *= evaluateSunspot(normLocal, spot3, 0.028, 0.082, f3);
      faculaePlages += f3;

      // Group 4: Southern Small Spot (lat -22°, lon 280°)
      vec3 spot4 = normalize(vec3(cos(4.88) * cos(-0.38), sin(-0.38), sin(4.88) * cos(-0.38)));
      spotFactor *= evaluateSunspot(normLocal, spot4, 0.014, 0.040, f4);
      faculaePlages += f4;

      // -----------------------------------------------------------------------
      // 5. Wavelength-Dependent Physical Limb Darkening
      // Real solar physics: I_lambda(mu) = 1 - u(1 - mu) - v(1 - mu)^2
      // Blue light drops significantly faster than Red, shifting #FFF4E0 to #E0752A
      // -----------------------------------------------------------------------
      float mu = clamp(dot(normal, viewDir), 0.0, 1.0);
      float oneMinusMu = 1.0 - mu;

      // Coefficients: Blue drops steepest (0.75), Green (0.60), Red (0.44)
      vec3 uCoeff = vec3(0.44, 0.60, 0.75);
      vec3 vCoeff = vec3(0.18, 0.20, 0.22);
      vec3 limbDarkening = vec3(1.0) - uCoeff * oneMinusMu - vCoeff * oneMinusMu * oneMinusMu;

      // Standard Continuum Colors:
      // Center: Warm white-gold #FFF4E0 (Blackbody ~5772 K)
      // Limb: Deep radiant amber-orange #E0752A
      vec3 centerColor = vec3(1.000, 0.957, 0.878); // #FFF4E0
      vec3 limbColor   = vec3(0.878, 0.459, 0.165); // #E0752A

      // Blend base chromaticity from center to limb
      vec3 basePhotosphere = mix(limbColor, centerColor, pow(mu, 0.75));

      // Apply wavelength-dependent intensity falloff
      vec3 solarRadiance = basePhotosphere * limbDarkening * granulation;

      // Faculae plages: contrast rises dramatically near the limb due to opacity geometry
      float limbFaculaeMultiplier = pow(1.0 - mu, 1.5);
      float totalFaculae = faculaePlages * (0.15 + 0.55 * limbFaculaeMultiplier);
      solarRadiance += vec3(1.0, 0.92, 0.75) * totalFaculae;

      // Apply sunspots
      solarRadiance *= spotFactor;

      // Center sits just below clipping (calibrated emissive HDR output)
      // NO outline rings, NO fresnel shell, NO hard rim.
      gl_FragColor = vec4(solarRadiance * 1.15, 1.0);
    }
  `
};

// =============================================================================
// Corona Shader (Soft Atmospheric Glow, Zero Bright Rings, Zero Dark Halos)
// Additive monotonic radial falloff (~inverse-square) that reaches exactly 0.0 at edge.
// =============================================================================
const CoronaShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    void main() {
      vUv = uv;
      // Billboard facing camera
      vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 cameraUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      vec3 worldPos = position.x * cameraRight + position.y * cameraUp;
      gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    uniform float uTime;

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

    void main() {
      #include <logdepthbuf_fragment>

      // Coordinate in billboard from -1.0 to +1.0
      vec2 coord = (vUv - vec2(0.5)) * 2.0;
      float dist = length(coord); // 1.0 is edge of quad

      // Quad covers 2.4x solar radius (limb is at dist = 1.0 / 2.4 = 0.4167)
      float limbDist = 1.0 / 2.4;
      if (dist < limbDist * 0.99) {
        // Behind photosphere sphere
        discard;
      }

      // Normalized radial distance where 1.0 = solar limb, 2.4 = quad edge
      float r = dist / limbDist;
      if (r >= 2.3) discard;

      // Smooth cutoff factor that strictly reaches 0.000 at r = 2.25
      float edgeFade = 1.0 - smoothstep(1.0, 2.25, r);
      edgeFade = edgeFade * edgeFade;

      // 1. Thin Pinkish-Red H-Alpha Chromosphere Fringe (656.3 nm, #FF3B6C)
      // Only visible in the first 1.5% at the immediate limb
      float chromoMask = smoothstep(1.018, 1.001, r) * smoothstep(0.995, 1.002, r);
      vec3 hAlphaPink = vec3(1.000, 0.231, 0.424);

      // 2. Additive Monotonic Radial Falloff (~Inverse-Square, NO SINGULARITY, NO BRIGHT RING)
      // Seamlessly continues the limb luminance (~0.30) smoothly down to 0.0
      float radialFalloff = exp(-(r - 1.0) * 3.8) * 0.28 * edgeFade;

      // 3. Faint Equatorial Streamers (7.25° solar equatorial alignment)
      float angle = atan(coord.y, coord.x);
      float streamerAlignment = pow(abs(cos(angle - 0.126)), 2.8);
      float streamerNoise = snoise(vec3(r * 2.5, angle * 3.0, uTime * 0.012)) * 0.5 + 0.5;
      float equatorialStreamers = streamerAlignment * streamerNoise * smoothstep(2.1, 1.05, r) * 0.05 * edgeFade;

      // Corona color gradient: warm golden-amber transitioning to soft deep space
      vec3 innerCoronaColor = vec3(1.00, 0.88, 0.55);
      vec3 outerCoronaColor = vec3(0.95, 0.55, 0.18);
      vec3 coronaColor = mix(innerCoronaColor, outerCoronaColor, smoothstep(1.0, 1.8, r));

      vec3 totalCorona = coronaColor * (radialFalloff + equatorialStreamers) + hAlphaPink * chromoMask * 0.25;
      float totalAlpha = clamp(radialFalloff + equatorialStreamers + chromoMask * 0.25, 0.0, 1.0);

      gl_FragColor = vec4(totalCorona, totalAlpha);
    }
  `
};

// =============================================================================
// Anamorphic Halation Streak Shader (Restrained Cinematic Flare)
// =============================================================================
const AnamorphicStreakShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 cameraUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      vec3 worldPos = position.x * cameraRight + position.y * cameraUp;
      gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      vec2 p = (vUv - vec2(0.5)) * 2.0;
      float dx = abs(p.x);
      float dy = abs(p.y);

      // Horizontal streak profile: very faint and restrained
      float streak = exp(-dy * 32.0) * exp(-dx * 2.2) * 0.018;
      // Core tight halation
      float halation = exp(-length(p) * 5.0) * 0.025;

      vec3 streakColor = vec3(1.0, 0.94, 0.82);
      gl_FragColor = vec4(streakColor * (streak + halation), streak + halation);
    }
  `
};

export function CinematicSun({ radius = 12.0, onClick }) {
  const { gl, camera } = useThree();
  const sunMeshRef = useRef();
  const surfaceShaderRef = useRef();
  const coronaShaderRef = useRef();

  // Solar Axial Tilt: 7.25 degrees relative to ecliptic plane
  const SOLAR_AXIAL_TILT = (7.25 * Math.PI) / 180;

  // Frame Loop: differential animation, simmer time, and dynamic auto-exposure
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uTime.value = elapsed;
    }
    if (coronaShaderRef.current) {
      coronaShaderRef.current.uniforms.uTime.value = elapsed;
    }

    if (sunMeshRef.current) {
      // Base sidereal equatorial rotation (~25 days)
      sunMeshRef.current.rotation.y = elapsed * 0.008;
    }

    // -------------------------------------------------------------------------
    // Camera Auto-Exposure Adaptation (Key to Cinematic Solar Realism)
    // When the camera approaches the Sun (filling > 30% of viewport), stop down
    // exposure so granulation and sunspot details never clip into flat white.
    // When distant (overview), ramp exposure back to 1.15 so Sun shines brilliantly.
    // -------------------------------------------------------------------------
    const distToSun = camera.position.length();
    // Clamp distance between close inspection (16) and overview (160)
    const t = THREE.MathUtils.clamp((distToSun - 18.0) / (160.0 - 18.0), 0.0, 1.0);
    // Exponential curve for natural iris adaptation
    const targetExposure = THREE.MathUtils.lerp(0.52, 1.15, Math.pow(t, 0.55));
    gl.toneMappingExposure = THREE.MathUtils.lerp(gl.toneMappingExposure, targetExposure, 0.08);
  });

  // Dedicated Billboards
  const coronaQuadSize = radius * 4.8; // 2.4x radius in diameter
  const streakWidth = radius * 8.5;
  const streakHeight = radius * 1.5;

  return (
    <group position={[0, 0, 0]}>
      {/* --------------------------------------------------------------------- */}
      {/* 1. Core Primary Solar Point Light (~5772 K, physical inverse-square) */}
      {/* --------------------------------------------------------------------- */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2.8}
        distance={10000}
        decay={0}
        color="#fff4e0"
      />

      {/* Deep-space ambient fill from starlight (0.05) */}
      <ambientLight intensity={0.05} color="#0a101e" />

      {/* --------------------------------------------------------------------- */}
      {/* 2. Photosphere Sphere (7.25° Axial Tilt, Voronoi Granulation, Sunspots)*/}
      {/* --------------------------------------------------------------------- */}
      <mesh
        ref={sunMeshRef}
        rotation={[0, 0, SOLAR_AXIAL_TILT]}
        castShadow={false}
        receiveShadow={false}
        onClick={onClick}
        cursor="pointer"
      >
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={surfaceShaderRef}
          args={[PhotosphereShader]}
          uniforms={{
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
          depthTest={true}
          depthWrite={true}
        />
      </mesh>

      {/* --------------------------------------------------------------------- */}
      {/* 3. Additive Inverse-Square Corona with Chromosphere & Streamers       */}
      {/* --------------------------------------------------------------------- */}
      <mesh>
        <planeGeometry args={[coronaQuadSize, coronaQuadSize]} />
        <shaderMaterial
          ref={coronaShaderRef}
          args={[CoronaShader]}
          uniforms={{
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* --------------------------------------------------------------------- */}
      {/* 4. Subtle Lens Halation & Restrained Anamorphic Horizontal Streak    */}
      {/* --------------------------------------------------------------------- */}
      <mesh>
        <planeGeometry args={[streakWidth, streakHeight]} />
        <shaderMaterial
          args={[AnamorphicStreakShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
