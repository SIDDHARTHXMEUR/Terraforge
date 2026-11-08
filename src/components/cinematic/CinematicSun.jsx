import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: PHOTOREALISTIC NASA SDO AIA 304 Å THERMONUCLEAR SUN
// Visual Target: Exact NASA Solar Dynamics Observatory SDO 304 Å Chromosphere
// Architecture:
// 1. Incandescent orange-amber / golden photosphere with high-contrast boiling convective cells.
// 2. High-resolution equirectangular SDO albedo with live multi-scale plasma turbulence.
// 3. Searing white-hot magnetic active regions & plages with realistic optical cross diffraction.
// 4. True 3D Spherical Chromosphere & Prominence Shell (BackSide ray-traced volume).
//    Zero flat billboards, zero perspective mismatch, zero rings, zero outline bands.
// 5. Dynamic auto-exposure keeping core plasma searing and luminous.
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
    varying vec3 vFlareViewPos;

    uniform float uRadius;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;

      // Primary active flare location in local space matching NASA reference photograph
      vec3 flareLocal = normalize(vec3(-0.060, -0.214, 0.975)) * uRadius;
      vec4 flareMv = modelViewMatrix * vec4(flareLocal, 1.0);
      vFlareViewPos = -flareMv.xyz;

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
    varying vec3 vFlareViewPos;

    uniform sampler2D uSdoTexture;
    uniform float uTime;
    uniform float uRadius;

    // Simplex Noise Math for fluid plasma turbulence
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

    // 2D Voronoi Cellular Convection
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

      // 1. Differential Solar Rotation (25 days at equator, 35 days at poles)
      float latRad = asin(clamp(normLocal.y, -1.0, 1.0));
      float diffSpeed = 0.020 * (1.0 - 0.22 * sin(latRad) * sin(latRad));
      vec2 rotatedUv = vec2(fract(vUv.x + uTime * diffSpeed), vUv.y);

      // 2. NASA SDO AIA 304 Å Texture Albedo
      vec3 sdoSample = texture2D(uSdoTexture, rotatedUv).rgb;
      float texLum = dot(sdoSample, vec3(0.32, 0.58, 0.10));

      // 3. High-Frequency Live Convective Plasma Boiling
      vec3 boilPos = normLocal * 18.0 + vec3(uTime * 0.04, 0.0, uTime * 0.03);
      vec2 boilWarp = vec2(
        snoise(boilPos),
        snoise(boilPos + vec3(19.2, 37.4, 53.8))
      ) * 0.0028;

      // Dense granulation grid: 480 x 240 cells (~1% solar radius scale)
      vec2 granUv = (rotatedUv + boilWarp) * vec2(480.0, 240.0);
      vec2 vor = voronoi2D(granUv);

      float cellKernel = exp(-vor.x * 2.8);
      float laneFactor = smoothstep(0.01, 0.26, vor.y - vor.x);
      float convection = cellKernel * (0.65 + 0.35 * laneFactor);

      // Micro-scale plasma turbulence
      float microTurb = snoise(normLocal * 85.0 + vec3(uTime * 0.06, 0.0, 0.0)) * 0.08;
      convection += microTurb;

      // Supergranulation: secondary larger convective currents
      float superGran = snoise(normLocal * 22.0 + vec3(uTime * 0.02, 0.0, 0.0)) * 0.10 + 1.0;

      // 4. Photometrically Calibrated NASA SDO 304 Å Plasma Radiance Palette
      // Directly matching measured reference RGB: [255, 133, 43] center, [227, 65, 11] limb, [255, 255, 255] flare
      float granMod = mix(0.85, 1.25, convection) * superGran;
      float baseLum = clamp(texLum * granMod, 0.0, 1.5);

      vec3 colValleys = vec3(0.78, 0.20, 0.018);      // Deep dark vermilion intergranular valleys
      vec3 colOrange  = vec3(1.00, 0.49, 0.13);       // Incandescent fiery orange-amber plasma body
      vec3 colGold    = vec3(1.00, 0.70, 0.22);       // Radiant golden convective peaks
      vec3 colPlage   = vec3(1.00, 0.90, 0.52);       // Luminous magnetic plage complexes
      vec3 colFlare   = vec3(1.00, 1.00, 0.98) * 2.8; // Searing white-hot flare cores

      vec3 plasma;
      if (baseLum < 0.32) {
        plasma = mix(colValleys, colOrange, baseLum / 0.32);
      } else if (baseLum < 0.62) {
        plasma = mix(colOrange, colGold, (baseLum - 0.32) / 0.30);
      } else if (baseLum < 0.85) {
        plasma = mix(colGold, colPlage, (baseLum - 0.62) / 0.23);
      } else {
        plasma = mix(colPlage, colFlare, clamp((baseLum - 0.85) / 0.25, 0.0, 1.0));
      }

      // 5. Camera-Space Razor-Sharp 4-Point Optical Diffraction Cross Flare
      // Aligned with telescope optical axis, tightly localized to central flare
      vec3 flareCenter = normalize(vec3(-0.060, -0.214, 0.975));
      float distToFlare = length(normLocal - flareCenter);
      if (distToFlare < 0.22) {
        vec2 dV = (vViewPosition.xy - vFlareViewPos.xy) / uRadius;
        
        // 45-degree cross diffraction spikes ('X' pattern matching NASA SDO telescope spider)
        float cosA = 0.7071;
        float sinA = 0.7071;
        vec2 rotDV = vec2(dV.x * cosA - dV.y * sinA, dV.x * sinA + dV.y * cosA);
        
        float spikeX = exp(-abs(rotDV.y) * 260.0) * exp(-abs(rotDV.x) * 20.0);
        float spikeY = exp(-abs(rotDV.x) * 260.0) * exp(-abs(rotDV.y) * 20.0);
        
        float dR = length(dV);
        float bloom = exp(-dR * 34.0) * 1.6 + exp(-dR * 110.0) * 3.2;
        float cross = (spikeX + spikeY) * 1.9 + bloom;
        float mask = smoothstep(0.22, 0.02, distToFlare);
        plasma += vec3(1.0, 0.98, 0.92) * cross * mask;
      }

      // Secondary Active Region Plage on Upper-Right (1:30 o'clock)
      vec3 flare2Center = normalize(vec3(0.440, 0.452, 0.776));
      float dist2 = length(normLocal - flare2Center);
      if (dist2 < 0.22) {
        float bloom2 = exp(-dist2 * 24.0) * 2.4;
        plasma += vec3(1.0, 0.94, 0.72) * bloom2 * smoothstep(0.22, 0.02, dist2);
      }

      // Tertiary Active Region Plage on Upper-Left (10:30 o'clock)
      vec3 flare3Center = normalize(vec3(-0.550, 0.440, 0.710));
      float dist3 = length(normLocal - flare3Center);
      if (dist3 < 0.22) {
        float bloom3 = exp(-dist3 * 24.0) * 2.2;
        plasma += vec3(1.0, 0.92, 0.68) * bloom3 * smoothstep(0.22, 0.02, dist3);
      }

      // Quaternary Active Region on Western Limb (9:00 o'clock)
      vec3 flare4Center = normalize(vec3(-0.933, 0.245, 0.265));
      float dist4 = length(normLocal - flare4Center);
      if (dist4 < 0.18) {
        float bloom4 = exp(-dist4 * 26.0) * 2.0;
        plasma += vec3(1.0, 0.90, 0.65) * bloom4 * smoothstep(0.18, 0.02, dist4);
      }

      // Quinary Active Region on Lower-Right (4:00 o'clock)
      vec3 flare5Center = normalize(vec3(0.488, -0.238, 0.840));
      float dist5 = length(normLocal - flare5Center);
      if (dist5 < 0.18) {
        float bloom5 = exp(-dist5 * 26.0) * 1.8;
        plasma += vec3(1.0, 0.92, 0.65) * bloom5 * smoothstep(0.18, 0.02, dist5);
      }

      // Senary Active Region on Lower-Left (7:30 o'clock)
      vec3 flare6Center = normalize(vec3(-0.540, -0.280, 0.794));
      float dist6 = length(normLocal - flare6Center);
      if (dist6 < 0.16) {
        float bloom6 = exp(-dist6 * 28.0) * 1.6;
        plasma += vec3(1.0, 0.90, 0.62) * bloom6 * smoothstep(0.16, 0.02, dist6);
      }

      // 6. SDO Chromosphere Physically Monotonic Limb Darkening
      // Smoothly steepens into deep vermilion at the limb edge matching SDO 304 Å photograph [227, 65, 11]
      float mu = clamp(dot(normal, viewDir), 0.0, 1.0);
      vec3 limbVermilion = vec3(0.89, 0.26, 0.045);
      vec3 finalPhotosphere = mix(plasma * limbVermilion, plasma, pow(mu, 0.45));

      // Subtle edge softening at extreme grazing angle (mu < 0.05)
      if (mu < 0.05) {
        finalPhotosphere *= smoothstep(0.0, 0.05, mu) * 0.25 + 0.75;
      }

      // Radiant output
      gl_FragColor = vec4(finalPhotosphere * 1.02, 1.0);
    }
  `
};

// =============================================================================
// True 3D Spherical Atmosphere & Prominence Volume Shader
// Rendered on a 3D sphere mesh (radius * 1.25) with THREE.BackSide.
// Analyzes camera ray in view space to render physically exact atmospheric glow
// and prominence loops extending beyond the limb into empty space.
// Zero flat billboards, zero perspective mismatch, zero rings, zero outline bands.
// =============================================================================
const AtmosphereShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vViewPos;
    varying vec3 vCenterViewPos;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPos = mvPosition.xyz;
      vec4 centerMv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vCenterViewPos = centerMv.xyz;

      gl_Position = projectionMatrix * mvPosition;
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec3 vViewPos;
    varying vec3 vCenterViewPos;

    uniform float uRadius;
    uniform float uTime;

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

    void main() {
      #include <logdepthbuf_fragment>

      // Camera ray in view space
      vec3 rayDir = normalize(vViewPos);
      float tClosest = dot(vCenterViewPos, rayDir);
      if (tClosest <= 0.0) discard;

      vec3 pClosest = rayDir * tClosest;
      vec3 dVec = pClosest - vCenterViewPos;
      float dClosest = length(dVec);
      float r = dClosest / uRadius;

      // Discard strictly inside the solid photosphere horizon
      if (r < 1.000 || r > 1.25) discard;

      float theta = atan(dVec.y, dVec.x);

      // 1. Monotonic SDO 304 Å Coronal Atmospheric Glow (Zero yellow outline, pure burning ruby-vermilion)
      float t = (r - 1.000) / (1.25 - 1.000);
      float glowFalloff = exp(-t * 5.5) * (1.0 - t) * (1.0 - t);

      vec3 deepVermilion = vec3(0.94, 0.28, 0.035);
      vec3 darkRuby = vec3(0.60, 0.09, 0.006);
      vec3 glowCol = mix(darkRuby, deepVermilion, pow(1.0 - t, 2.0));
      vec3 finalAtmosphere = glowCol * glowFalloff * 0.95;

      // 2. Delicate Limb Prominences & Loop Filaments (within 1.000 to 1.15 radii)
      if (r <= 1.15) {
        // Micro-spicules on the limb edge (thousands of fine plasma jets)
        float spiculeNoise = snoise(vec3(cos(theta) * 160.0, sin(theta) * 160.0, uTime * 0.18));
        float spiculeH = 1.0 + 0.024 * max(0.0, spiculeNoise);
        float spicule = exp(-(r - 1.0) * 85.0) * smoothstep(spiculeH, 1.0, r);

        // Prominence Loop 1 (10 o'clock arch, theta ~ 2.51 rad)
        float arch1Ang = (theta - 2.51) / 0.26;
        float arch1 = 0.0;
        if (abs(arch1Ang) < 1.0) {
          float arch1H = 1.0 + 0.065 * sqrt(1.0 - arch1Ang * arch1Ang);
          float fil1 = 0.6 + 0.4 * sin(r * 280.0 + theta * 30.0 + uTime * 2.0);
          arch1 = exp(-abs(r - arch1H) * 70.0) * fil1 * (1.0 - arch1Ang * arch1Ang);
        }

        // Prominence Loop 2 (Western limb flare eruption at 9:30 o'clock, theta ~ 2.88 rad)
        float arch2Ang = (theta - 2.88) / 0.24;
        float arch2 = 0.0;
        if (abs(arch2Ang) < 1.0) {
          float arch2H = 1.0 + 0.072 * sqrt(1.0 - arch2Ang * arch2Ang);
          float fil2 = 0.6 + 0.4 * sin(r * 260.0 - theta * 25.0 + uTime * 2.2);
          arch2 = exp(-abs(r - arch2H) * 65.0) * fil2 * (1.0 - arch2Ang * arch2Ang);
        }

        // Prominence Loop 3 (Upper-East arch at 1:30 o'clock, theta ~ 1.15 rad)
        float arch3Ang = (theta - 1.15) / 0.22;
        float arch3 = 0.0;
        if (abs(arch3Ang) < 1.0) {
          float arch3H = 1.0 + 0.052 * sqrt(1.0 - arch3Ang * arch3Ang);
          float fil3 = 0.6 + 0.4 * sin(r * 300.0 + theta * 35.0 - uTime * 1.8);
          arch3 = exp(-abs(r - arch3H) * 72.0) * fil3 * (1.0 - arch3Ang * arch3Ang);
        }

        // Prominence Loop 4 (Lower-East arch at 4:30 o'clock, theta ~ -0.68 rad)
        float arch4Ang = (theta + 0.68) / 0.24;
        float arch4 = 0.0;
        if (abs(arch4Ang) < 1.0) {
          float arch4H = 1.0 + 0.050 * sqrt(1.0 - arch4Ang * arch4Ang);
          float fil4 = 0.6 + 0.4 * sin(r * 270.0 - theta * 28.0 + uTime * 1.6);
          arch4 = exp(-abs(r - arch4H) * 75.0) * fil4 * (1.0 - arch4Ang * arch4Ang);
        }

        // Prominence Loop 5 (Lower-West arch at 7:30 o'clock, theta ~ -2.20 rad)
        float arch5Ang = (theta + 2.20) / 0.22;
        float arch5 = 0.0;
        if (abs(arch5Ang) < 1.0) {
          float arch5H = 1.0 + 0.048 * sqrt(1.0 - arch5Ang * arch5Ang);
          arch5 = exp(-abs(r - arch5H) * 78.0) * (1.0 - arch5Ang * arch5Ang);
        }

        // North and South Polar Crown Spicule Fountains (theta ~ 1.57 and -1.57)
        float northCrown = exp(-pow((theta - 1.57) / 0.35, 2.0)) * exp(-(r - 1.0) * 60.0) * 0.4;
        float southCrown = exp(-pow((theta + 1.57) / 0.35, 2.0)) * exp(-(r - 1.0) * 60.0) * 0.4;

        float totalProm = spicule * 0.85 + arch1 * 1.8 + arch2 * 2.2 + arch3 * 1.5 + arch4 * 1.4 + arch5 * 1.4 + northCrown + southCrown;
        float edgeFade = smoothstep(1.15, 1.01, r);
        totalProm *= edgeFade;

        vec3 promCol = vec3(0.95, 0.28, 0.02);
        finalAtmosphere += promCol * totalProm * 0.85;
      }

      float totalAlpha = clamp(glowFalloff, 0.0, 1.0);
      gl_FragColor = vec4(finalAtmosphere, totalAlpha);
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
  const atmoShaderRef = useRef();

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
    if (atmoShaderRef.current) {
      atmoShaderRef.current.uniforms.uTime.value = elapsed;
    }

    // Auto-exposure: maintain radiant, incandescent brilliance in solar closeup
    if (typeof window !== 'undefined' && window.__isLivePrologueActive) {
      return;
    }

    const camDist = camera.position.distanceTo(new THREE.Vector3(...position));
    const normalizedDist = Math.max(0.0, Math.min(1.0, (camDist - radius * 1.3) / (radius * 6.0)));
    // Close up exposure ~1.02, overview ~1.15
    const targetExposure = 1.02 + normalizedDist * 0.13;
    state.gl.toneMappingExposure = targetExposure;
  });

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

      {/* 2. True 3D Spherical Atmosphere & Prominence Volume (BackSide Ray-traced) */}
      <mesh renderOrder={2}>
        <sphereGeometry args={[radius * 1.25, 64, 64]} />
        <shaderMaterial
          ref={atmoShaderRef}
          args={[AtmosphereShader]}
          side={THREE.BackSide}
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
