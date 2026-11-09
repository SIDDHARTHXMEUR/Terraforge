import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DISPLAY_RADII, DISPLAY_ORBIT_RADII } from '../../data/displayScale';

// Exact neon color per planet in all modes and at all distances
export const ORBIT_COLORS = {
  mercury: '#8CE8FF',
  venus: '#FFE5A3',
  earth: '#5BB8FF',
  mars: '#FF6B4A',
  asteroids: '#E0D8B0',
  ceres: '#E0D8B0',
  jupiter: '#FFB347',
  saturn: '#FAD48E',
  uranus: '#7DE8DA',
  neptune: '#4D8BFF'
};

const BODIES_LIST = ['mercury', 'venus', 'earth', 'mars', 'asteroids', 'jupiter', 'saturn', 'uranus', 'neptune'];

const ScreenSpaceOrbitShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    attribute float aSide;
    attribute vec3 aTangent;

    uniform vec2 uResolution;
    uniform float uLineWidth;
    uniform float uGlowWidth;

    varying float vDistPx;
    varying vec3 vWorldPos;

    void main() {
      vWorldPos = position;
      vec4 clipCenter = projectionMatrix * viewMatrix * vec4(position, 1.0);
      vec4 clipNext = projectionMatrix * viewMatrix * vec4(position + aTangent, 1.0);

      vec2 ndcCenter = clipCenter.xy / clipCenter.w;
      vec2 ndcNext = clipNext.xy / clipNext.w;

      vec2 screenDir = (ndcNext - ndcCenter) * uResolution;
      float dirLen = length(screenDir);
      vec2 screenDirNorm = dirLen > 0.0001 ? screenDir / dirLen : vec2(1.0, 0.0);
      vec2 screenNormal = vec2(-screenDirNorm.y, screenDirNorm.x);

      float totalHalfWidthPx = (uLineWidth + uGlowWidth * 2.0) * 0.5;
      vec2 ndcOffset = (screenNormal * (aSide * totalHalfWidthPx) / uResolution) * 2.0;

      gl_Position = vec4(clipCenter.xy + ndcOffset * clipCenter.w, clipCenter.z, clipCenter.w);
      vDistPx = aSide * totalHalfWidthPx;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying float vDistPx;
    varying vec3 vWorldPos;

    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uLineWidth;
    uniform float uGlowOpacity;
    uniform vec3 uFocusedPos;
    uniform float uFocusedRadius;
    uniform bool uIsFocusedOrbit;

    uniform vec3 uBodyPositions[9];
    uniform float uBodyRadii[9];

    void main() {
      #include <logdepthbuf_fragment>

      float d = abs(vDistPx);
      float halfLine = uLineWidth * 0.5;

      // 1. Center stroke with smoothstep sub-pixel antialiasing (1.25 px)
      float strokeAlpha = 1.0 - smoothstep(halfLine - 0.45, halfLine + 0.45, d);

      // 2. Faint 1px 12% glow in overview only, drops to zero in close-up
      float glowAlpha = 0.0;
      if (uGlowOpacity > 0.001) {
        glowAlpha = (1.0 - smoothstep(halfLine, halfLine + 1.25, d)) * uGlowOpacity;
      }
      float totalAlpha = max(strokeAlpha, glowAlpha) * uOpacity;

      // 3. The focused planet's OWN orbit line fades out within 6x radius
      if (uIsFocusedOrbit && uFocusedRadius > 0.01) {
        float distToFocused = length(vWorldPos - uFocusedPos);
        // Strictly 0.0 inside 2.5x radius (clearing Saturn rings at ~2.3x), smooth fade to 6x
        float focusedFade = smoothstep(uFocusedRadius * 2.5, uFocusedRadius * 6.0, distToFocused);
        totalAlpha *= focusedFade;
      }

      // 4. Any orbit line passing within 3x of ANY body fades to zero (never cuts across body)
      for (int i = 0; i < 9; i++) {
        if (uBodyRadii[i] > 0.01) {
          float dist = length(vWorldPos - uBodyPositions[i]);
          float bodyFade = smoothstep(uBodyRadii[i] * 1.0, uBodyRadii[i] * 3.0, dist);
          totalAlpha *= bodyFade;
        }
      }

      if (totalAlpha < 0.005) discard;

      // Exact color with zero color shifts, zero desaturation, zero distance tint
      gl_FragColor = vec4(uColor, totalAlpha);
    }
  `
};

function createScreenSpaceOrbitGeometry(radius) {
  const segments = 512;
  const positions = [];
  const tangents = [];
  const sides = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const x = cosT * radius;
    const z = sinT * radius;

    // Tangent vector
    const tx = -sinT;
    const tz = cosT;

    // Inner vertex (aSide = -1.0)
    positions.push(x, 0, z);
    tangents.push(tx, 0, tz);
    sides.push(-1.0);

    // Outer vertex (aSide = +1.0)
    positions.push(x, 0, z);
    tangents.push(tx, 0, tz);
    sides.push(1.0);

    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('aTangent', new THREE.Float32BufferAttribute(tangents, 3));
  geom.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
  geom.setIndex(indices);
  return geom;
}

function SingleScreenOrbitLine({
  radius,
  bodyKey,
  color,
  selectedBody,
  bodyPositions,
  fadeAlphaRef
}) {
  const { size, camera } = useThree();
  const materialRef = useRef();

  const geometry = useMemo(() => {
    return createScreenSpaceOrbitGeometry(radius);
  }, [radius]);

  const colorVec = useMemo(() => new THREE.Color(color), [color]);
  const defaultVec3 = useMemo(() => new THREE.Vector3(9999, 9999, 9999), []);

  useFrame(() => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    const fade = fadeAlphaRef ? fadeAlphaRef.current : 1.0;

    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uColor.value.copy(colorVec);

    const isSelected = selectedBody === bodyKey;
    mat.uniforms.uIsFocusedOrbit.value = isSelected;

    // Camera distance to this orbit: glow is 0.12 in overview, 0.0 in close-up (< 4x radius)
    const camDist = camera.position.length();
    const isOverview = !selectedBody || selectedBody === 'overview';
    const isCloseUp = camDist < radius * 4.0;
    mat.uniforms.uGlowOpacity.value = (isOverview && !isCloseUp) ? 0.12 : 0.0;
    mat.uniforms.uOpacity.value = 0.85 * fade;

    // Focused body position & radius
    if (selectedBody && selectedBody !== 'overview' && bodyPositions[selectedBody]) {
      const bPos = bodyPositions[selectedBody];
      mat.uniforms.uFocusedPos.value.set(bPos[0], bPos[1], bPos[2]);
      mat.uniforms.uFocusedRadius.value = DISPLAY_RADII[selectedBody] || 2.0;
    } else {
      mat.uniforms.uFocusedPos.value.copy(defaultVec3);
      mat.uniforms.uFocusedRadius.value = 0.0;
    }

    // Set all body positions for 3x radius cut-out
    BODIES_LIST.forEach((bKey, idx) => {
      if (bodyPositions && bodyPositions[bKey]) {
        const bp = bodyPositions[bKey];
        mat.uniforms.uBodyPositions.value[idx].set(bp[0], bp[1], bp[2]);
        mat.uniforms.uBodyRadii.value[idx] = DISPLAY_RADII[bKey] || 2.0;
      }
    });
  });

  return (
    <mesh geometry={geometry} renderOrder={7}>
      <shaderMaterial
        ref={materialRef}
        args={[ScreenSpaceOrbitShader]}
        side={THREE.DoubleSide}
        transparent={true}
        depthTest={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
        uniforms={{
          uResolution: { value: new THREE.Vector2(1920, 1080) },
          uLineWidth: { value: 1.25 }, // Screen-space 1.25px width
          uGlowWidth: { value: 1.0 },  // 1px glow
          uColor: { value: colorVec },
          uOpacity: { value: 0.85 },
          uGlowOpacity: { value: 0.12 },
          uFocusedPos: { value: new THREE.Vector3(9999, 9999, 9999) },
          uFocusedRadius: { value: 0.0 },
          uIsFocusedOrbit: { value: false },
          uBodyPositions: {
            value: Array.from({ length: 9 }, () => new THREE.Vector3(9999, 9999, 9999))
          },
          uBodyRadii: {
            value: new Float32Array(9)
          }
        }}
      />
    </mesh>
  );
}

export function OrbitGuides({
  radii = DISPLAY_ORBIT_RADII,
  visible = true,
  selectedBody = 'overview',
  bodyPositions = {}
}) {
  const groupRef = useRef();
  const fadeAlphaRef = useRef(visible ? 1.0 : 0.0);

  useFrame((_, delta) => {
    let targetAlpha = visible ? 1.0 : 0.0;
    if (selectedBody === 'sun') targetAlpha = 0.0;

    const fadeRate = 12.0;
    if (targetAlpha === 0.0) {
      fadeAlphaRef.current = Math.max(0.0, fadeAlphaRef.current - delta * fadeRate);
    } else {
      fadeAlphaRef.current = Math.min(targetAlpha, fadeAlphaRef.current + delta * fadeRate);
    }

    if (groupRef.current) {
      groupRef.current.visible = fadeAlphaRef.current > 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <SingleScreenOrbitLine radius={radii.mercury} bodyKey="mercury" color={ORBIT_COLORS.mercury} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.venus} bodyKey="venus" color={ORBIT_COLORS.venus} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.earth} bodyKey="earth" color={ORBIT_COLORS.earth} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.mars} bodyKey="mars" color={ORBIT_COLORS.mars} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.asteroidsInner} bodyKey="asteroids" color={ORBIT_COLORS.asteroids} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.jupiter} bodyKey="jupiter" color={ORBIT_COLORS.jupiter} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.saturn} bodyKey="saturn" color={ORBIT_COLORS.saturn} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.uranus} bodyKey="uranus" color={ORBIT_COLORS.uranus} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
      <SingleScreenOrbitLine radius={radii.neptune} bodyKey="neptune" color={ORBIT_COLORS.neptune} selectedBody={selectedBody} bodyPositions={bodyPositions} fadeAlphaRef={fadeAlphaRef} />
    </group>
  );
}
