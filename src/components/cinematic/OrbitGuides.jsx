import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DISPLAY_RADII, DISPLAY_ORBIT_RADII } from '../../data/displayScale';

// Restored vibrant neon color-coded palette for crisp, high-visibility celestial mechanics
const ORBIT_COLORS = {
  mercury: '#a1a1aa', // Slate silver
  venus: '#facc15',   // Warm amber gold
  earth: '#38bdf8',   // Luminous sky cyan
  mars: '#fb923c',    // Tangerine orange
  asteroids: '#a8a29e', // Asteroid dust subtle grey
  jupiter: '#fde047', // Jovian radiant yellow
  saturn: '#fef08a',  // Pale gold ringed
  uranus: '#67e8f9',  // Electric cyan ice
  neptune: '#818cf8'  // Deep azure-indigo
};


const BODY_RADII = {
  sun: DISPLAY_RADII.sun,
  mercury: DISPLAY_RADII.mercury,
  venus: DISPLAY_RADII.venus,
  earth: DISPLAY_RADII.earth,
  mars: DISPLAY_RADII.mars,
  asteroids: DISPLAY_RADII.ceres,
  jupiter: DISPLAY_RADII.jupiter,
  saturn: DISPLAY_RADII.saturn,
  uranus: DISPLAY_RADII.uranus,
  neptune: DISPLAY_RADII.neptune
};

const OrbitLineShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vWorldPos;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec3 vWorldPos;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform vec3 uTargetPos;
    uniform float uTargetRadius;
    uniform float uProgress;

    void main() {
      #include <logdepthbuf_fragment>

      float angleNorm = fract(atan(vWorldPos.z, vWorldPos.x) / 6.2831853 + 0.5);
      if (angleNorm > uProgress) discard;

      float distToTarget = length(vWorldPos - uTargetPos);
      float fade = 1.0;
      if (uTargetRadius > 0.05) {
        fade = smoothstep(uTargetRadius * 1.0, uTargetRadius * 3.0, distToTarget);
      }

      gl_FragColor = vec4(uColor, uOpacity * fade);
    }
  `
};

const OrbitRibbonShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldPos;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform vec3 uTargetPos;
    uniform float uTargetRadius;
    uniform float uProgress;

    void main() {
      #include <logdepthbuf_fragment>

      float angleNorm = fract(atan(vWorldPos.z, vWorldPos.x) / 6.2831853 + 0.5);
      if (angleNorm > uProgress) discard;

      float distToTarget = length(vWorldPos - uTargetPos);
      float fade = 1.0;
      if (uTargetRadius > 0.05) {
        fade = smoothstep(uTargetRadius * 1.0, uTargetRadius * 3.0, distToTarget);
      }

      // Soft parabolic cross-section across ribbon width (peaks at center line)
      float crossProfile = sin(vUv.y * 3.14159265);
      float alpha = uOpacity * crossProfile * fade;

      gl_FragColor = vec4(uColor, alpha);
    }
  `
};

function OrbitLine({
  radius,
  bodyKey = 'earth',
  color = '#38bdf8',
  baseOpacity = 0.32,
  fadeAlphaRef,
  bodyPositions,
  selectedBody
}) {
  const lineShaderRef = useRef();

  // Centerline line loop geometry (512 segments for razor-sharp smoothness)
  const lineGeometry = useMemo(() => {
    const points = [];
    const segments = 512;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  const colorVec = useMemo(() => new THREE.Color(color), [color]);
  const targetVec = useMemo(() => new THREE.Vector3(9999, 9999, 9999), []);

  useFrame(() => {
    const fade = fadeAlphaRef ? fadeAlphaRef.current : 1.0;
    const effectiveLineOpacity = baseOpacity * fade;

    const bPos = (selectedBody && selectedBody !== 'overview' && bodyPositions && bodyPositions[selectedBody])
      ? bodyPositions[selectedBody]
      : null;
    const bRadius = (selectedBody && selectedBody !== 'overview' && BODY_RADII[selectedBody])
      ? BODY_RADII[selectedBody]
      : 0;

    const tX = bPos ? bPos[0] : 9999;
    const tY = bPos ? bPos[1] : 9999;
    const tZ = bPos ? bPos[2] : 9999;

    const progress = (typeof window !== 'undefined' && window.__prologueOrbitProgress && window.__prologueOrbitProgress[bodyKey] !== undefined)
      ? window.__prologueOrbitProgress[bodyKey]
      : 1.0;

    if (lineShaderRef.current) {
      lineShaderRef.current.uniforms.uColor.value.set(color);
      lineShaderRef.current.uniforms.uOpacity.value = effectiveLineOpacity;
      lineShaderRef.current.uniforms.uTargetPos.value.set(tX, tY, tZ);
      lineShaderRef.current.uniforms.uTargetRadius.value = bRadius;
      lineShaderRef.current.uniforms.uProgress.value = progress;
    }
  });

  return (
    <group>
      {/* Crisp, thin orbital path (NormalBlending prevents white blowout and halo artifacts) */}
      <lineLoop
        geometry={lineGeometry}
        renderOrder={9}
      >
        <shaderMaterial
          ref={lineShaderRef}
          args={[OrbitLineShader]}
          transparent={true}
          blending={THREE.NormalBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uColor: { value: colorVec },
            uOpacity: { value: baseOpacity },
            uTargetPos: { value: targetVec },
            uTargetRadius: { value: 0 },
            uProgress: { value: 1.0 }
          }}
        />
      </lineLoop>
    </group>
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
  const { camera } = useThree();

  useFrame((_, delta) => {
    let targetAlpha = visible ? 1.0 : 0.0;

    // Immediately fade out orbits when viewing Sol so solar closeups are clean
    if (selectedBody === 'sun') {
      targetAlpha = 0.0;
    } else if (selectedBody && selectedBody !== 'overview' && bodyPositions[selectedBody]) {
      // Fade out orbits smoothly when camera is close to a planet
      const bPos = bodyPositions[selectedBody];
      const camDist = camera.position.distanceTo(new THREE.Vector3(...bPos));
      const bRadius = BODY_RADII[selectedBody] || 2.0;
      const closeFade = THREE.MathUtils.clamp((camDist - bRadius * 1.5) / (bRadius * 3.5), 0.0, 1.0);
      targetAlpha *= closeFade;
    }

    // Rapid linear fade ensures turning OFF or ON takes effect in <= 80ms (strict <100ms latency requirement)
    const fadeRate = 14.0; // 1 / 14s = ~71ms for full transition
    if (targetAlpha === 0.0) {
      fadeAlphaRef.current = Math.max(0.0, fadeAlphaRef.current - delta * fadeRate);
    } else {
      fadeAlphaRef.current = Math.min(targetAlpha, fadeAlphaRef.current + delta * fadeRate);
    }

    if (groupRef.current) {
      const isVis = fadeAlphaRef.current > 0.005;
      groupRef.current.visible = isVis;

      // DEV instrumentation: record toggle latency
      if (import.meta.env.DEV && typeof window !== 'undefined' && window.__lastToggleClick?.type === 'orbits') {
        const click = window.__lastToggleClick;
        if ((click.target && isVis) || (!click.target && !isVis)) {
          const latency = Math.round(performance.now() - click.time);
          if (window.__perfMetrics) window.__perfMetrics.toggleLatencies.orbits = latency;
          window.__lastToggleClick = null;
        }
      }
    }
  });

  const getOrbitProps = (bodyKey) => {
    const isSelected = selectedBody === bodyKey;
    const neonColor = ORBIT_COLORS[bodyKey] || '#FFFFFF';
    return {
      color: neonColor,
      baseOpacity: isSelected ? 0.95 : 0.50,
      ribbonOpacity: isSelected ? 0.65 : 0.22
    };
  };

  return (
    <group ref={groupRef}>
      <OrbitLine radius={radii.mercury} bodyKey="mercury" {...getOrbitProps('mercury')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.venus} bodyKey="venus" {...getOrbitProps('venus')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.earth} bodyKey="earth" {...getOrbitProps('earth')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.mars} bodyKey="mars" {...getOrbitProps('mars')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.asteroidsInner} bodyKey="asteroids" {...getOrbitProps('asteroids')} baseOpacity={0.28} ribbonOpacity={0.14} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.asteroidsOuter} bodyKey="asteroids" {...getOrbitProps('asteroids')} baseOpacity={0.28} ribbonOpacity={0.14} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.jupiter} bodyKey="jupiter" {...getOrbitProps('jupiter')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.saturn} bodyKey="saturn" {...getOrbitProps('saturn')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.uranus} bodyKey="uranus" {...getOrbitProps('uranus')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
      <OrbitLine radius={radii.neptune} bodyKey="neptune" {...getOrbitProps('neptune')} fadeAlphaRef={fadeAlphaRef} bodyPositions={bodyPositions} selectedBody={selectedBody} />
    </group>
  );
}
