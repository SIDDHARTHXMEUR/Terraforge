import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DISPLAY_RADII, DISPLAY_ORBIT_RADII } from '../../data/displayScale';

// Subtle, thin, near-monochrome warm-white styling (no rainbow colors)
const BASE_ORBIT_COLOR = '#FAF8F5';
const HIGHLIGHT_ORBIT_COLOR = '#FFFFFF';


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

    void main() {
      #include <logdepthbuf_fragment>

      float distToTarget = length(vWorldPos - uTargetPos);
      float fade = 1.0;
      if (uTargetRadius > 0.05) {
        fade = smoothstep(uTargetRadius * 1.0, uTargetRadius * 3.5, distToTarget);
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

    void main() {
      #include <logdepthbuf_fragment>

      float distToTarget = length(vWorldPos - uTargetPos);
      float fade = 1.0;
      if (uTargetRadius > 0.05) {
        fade = smoothstep(uTargetRadius * 1.0, uTargetRadius * 3.5, distToTarget);
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
  color = '#38bdf8',
  baseOpacity = 0.65,
  ribbonOpacity = 0.20,
  fadeAlphaRef,
  targetPos = [9999, 9999, 9999],
  targetRadius = 0
}) {
  const lineShaderRef = useRef();
  const ribbonShaderRef = useRef();

  // 1. Centerline line loop geometry (512 segments for razor-sharp smoothness)
  const lineGeometry = useMemo(() => {
    const points = [];
    const segments = 512;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  // 2. Physical 3D ring ribbon geometry (thin constant-width, 512 segments)
  const ribbonGeometry = useMemo(() => {
    const halfW = Math.max(0.12, radius * 0.0016);
    return new THREE.RingGeometry(radius - halfW, radius + halfW, 512);
  }, [radius]);

  const colorVec = useMemo(() => new THREE.Color(color), [color]);
  const targetVec = useMemo(() => new THREE.Vector3(...targetPos), [targetPos]);

  useFrame(() => {
    const fade = fadeAlphaRef ? fadeAlphaRef.current : 1.0;
    const effectiveLineOpacity = baseOpacity * fade;
    const effectiveRibbonOpacity = ribbonOpacity * fade;

    if (lineShaderRef.current) {
      lineShaderRef.current.uniforms.uColor.value.set(color);
      lineShaderRef.current.uniforms.uOpacity.value = effectiveLineOpacity;
      lineShaderRef.current.uniforms.uTargetPos.value.set(...targetPos);
      lineShaderRef.current.uniforms.uTargetRadius.value = targetRadius;
    }

    if (ribbonShaderRef.current) {
      ribbonShaderRef.current.uniforms.uColor.value.set(color);
      ribbonShaderRef.current.uniforms.uOpacity.value = effectiveRibbonOpacity;
      ribbonShaderRef.current.uniforms.uTargetPos.value.set(...targetPos);
      ribbonShaderRef.current.uniforms.uTargetRadius.value = targetRadius;
    }
  });

  return (
    <group>
      {/* 3D Luminous Ribbon for solid visibility at all zooms (DoubleSide) */}
      <mesh
        geometry={ribbonGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={8}
      >
        <shaderMaterial
          ref={ribbonShaderRef}
          args={[OrbitRibbonShader]}
          side={THREE.DoubleSide}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uColor: { value: colorVec },
            uOpacity: { value: ribbonOpacity },
            uTargetPos: { value: targetVec },
            uTargetRadius: { value: targetRadius }
          }}
        />
      </mesh>

      {/* Crisp Centerline */}
      <lineLoop
        geometry={lineGeometry}
        renderOrder={9}
      >
        <shaderMaterial
          ref={lineShaderRef}
          args={[OrbitLineShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uColor: { value: colorVec },
            uOpacity: { value: baseOpacity },
            uTargetPos: { value: targetVec },
            uTargetRadius: { value: targetRadius }
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

    fadeAlphaRef.current = THREE.MathUtils.damp(fadeAlphaRef.current, targetAlpha, 6.0, delta);

    if (groupRef.current) {
      groupRef.current.visible = fadeAlphaRef.current > 0.005;
    }
  });

  const currentTargetPos = (selectedBody && selectedBody !== 'overview' && bodyPositions[selectedBody])
    ? bodyPositions[selectedBody]
    : [9999, 9999, 9999];
  const currentTargetRadius = (selectedBody && selectedBody !== 'overview' && BODY_RADII[selectedBody])
    ? BODY_RADII[selectedBody]
    : 0;

  const getOrbitProps = (bodyKey) => {
    const isSelected = selectedBody === bodyKey;
    return {
      color: isSelected ? HIGHLIGHT_ORBIT_COLOR : BASE_ORBIT_COLOR,
      baseOpacity: isSelected ? 0.85 : 0.24,
      ribbonOpacity: isSelected ? 0.52 : 0.16
    };
  };

  return (
    <group ref={groupRef}>
      <OrbitLine radius={radii.mercury} {...getOrbitProps('mercury')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.venus} {...getOrbitProps('venus')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.earth} {...getOrbitProps('earth')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.mars} {...getOrbitProps('mars')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.asteroidsInner} {...getOrbitProps('asteroids')} baseOpacity={0.16} ribbonOpacity={0.10} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.asteroidsOuter} {...getOrbitProps('asteroids')} baseOpacity={0.16} ribbonOpacity={0.10} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.jupiter} {...getOrbitProps('jupiter')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.saturn} {...getOrbitProps('saturn')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.uranus} {...getOrbitProps('uranus')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.neptune} {...getOrbitProps('neptune')} fadeAlphaRef={fadeAlphaRef} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
    </group>
  );
}
