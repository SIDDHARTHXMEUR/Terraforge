import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ORBIT_COLORS = {
  mercury: '#9ca3af',
  venus: '#eab308',
  earth: '#38bdf8',
  mars: '#f97316',
  asteroids: '#a8a29e',
  jupiter: '#facc15',
  saturn: '#fde047',
  uranus: '#67e8f9',
  neptune: '#60a5fa'
};

const BODY_RADII = {
  mercury: 1.0,
  venus: 1.8,
  earth: 2.0,
  mars: 1.3,
  asteroids: 1.0,
  jupiter: 5.5,
  saturn: 4.2,
  uranus: 2.8,
  neptune: 2.7
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
    uniform float uBaseOpacity;
    uniform vec3 uTargetPos;
    uniform float uTargetRadius;

    void main() {
      #include <logdepthbuf_fragment>

      float distToTarget = length(vWorldPos - uTargetPos);
      // Smoothly fade to zero within 3.5x radius of selected body so line never crosses planet face
      float fade = 1.0;
      if (uTargetRadius > 0.05) {
        fade = smoothstep(uTargetRadius * 1.0, uTargetRadius * 3.5, distToTarget);
      }

      gl_FragColor = vec4(uColor, uBaseOpacity * fade);
    }
  `
};

function OrbitLine({
  radius,
  color = '#38bdf8',
  opacity = 0.22,
  targetPos = [9999, 9999, 9999],
  targetRadius = 0
}) {
  const shaderRef = useRef();

  const lineGeometry = useMemo(() => {
    const points = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  const targetVec = useMemo(() => new THREE.Vector3(...targetPos), [targetPos]);
  const colorVec = useMemo(() => new THREE.Color(color), [color]);

  useFrame(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTargetPos.value.set(...targetPos);
      shaderRef.current.uniforms.uTargetRadius.value = targetRadius;
    }
  });

  return (
    <lineLoop geometry={lineGeometry}>
      <shaderMaterial
        ref={shaderRef}
        args={[OrbitLineShader]}
        transparent={true}
        depthWrite={false}
        depthTest={true}
        uniforms={{
          uColor: { value: colorVec },
          uBaseOpacity: { value: opacity },
          uTargetPos: { value: targetVec },
          uTargetRadius: { value: targetRadius }
        }}
      />
    </lineLoop>
  );
}

export function OrbitGuides({
  radii = {
    mercury: 24,
    venus: 36,
    earth: 50,
    mars: 66,
    asteroidsInner: 78,
    asteroidsOuter: 94,
    jupiter: 122,
    saturn: 165,
    uranus: 208,
    neptune: 250
  },
  visible = true,
  selectedBody = 'overview',
  bodyPositions = {}
}) {
  if (!visible) return null;
  // Fade out orbit lines when viewing the Sun so lines never cross its face
  if (selectedBody === 'sun') return null;

  const currentTargetPos = (selectedBody && selectedBody !== 'overview' && bodyPositions[selectedBody])
    ? bodyPositions[selectedBody]
    : [9999, 9999, 9999];
  const currentTargetRadius = (selectedBody && selectedBody !== 'overview' && BODY_RADII[selectedBody])
    ? BODY_RADII[selectedBody]
    : 0;

  return (
    <group>
      <OrbitLine radius={radii.mercury} color={ORBIT_COLORS.mercury} opacity={0.28} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.venus} color={ORBIT_COLORS.venus} opacity={0.26} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.earth} color={ORBIT_COLORS.earth} opacity={0.32} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.mars} color={ORBIT_COLORS.mars} opacity={0.28} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.asteroidsInner} color={ORBIT_COLORS.asteroids} opacity={0.16} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.asteroidsOuter} color={ORBIT_COLORS.asteroids} opacity={0.16} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.jupiter} color={ORBIT_COLORS.jupiter} opacity={0.28} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.saturn} color={ORBIT_COLORS.saturn} opacity={0.28} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.uranus} color={ORBIT_COLORS.uranus} opacity={0.24} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
      <OrbitLine radius={radii.neptune} color={ORBIT_COLORS.neptune} opacity={0.24} targetPos={currentTargetPos} targetRadius={currentTargetRadius} />
    </group>
  );
}
