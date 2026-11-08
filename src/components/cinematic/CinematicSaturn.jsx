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
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = viewMatrix * worldPos;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunPosition;
    uniform vec3 uPlanetCenter;
    uniform vec3 uRingNormal;
    uniform float uRadius;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Physical Bounded Minnaert Limb Darkening strictly from Sun
      float NdotL = dot(N, L);
      float diffuse = max(0.0, NdotL);
      float cosE = clamp(dot(N, V), 0.0, 1.0);
      float limbFalloff = pow(cosE, 0.25) * 0.70 + 0.30;

      // Subtle warm golden cloud banding
      vec3 saturnGold = vec3(0.96, 0.88, 0.68);
      vec3 baseCloud = mix(texColor, saturnGold, 0.25);

      // -----------------------------------------------------------------------
      // World-space Ring-on-Planet Shadow Projection
      // -----------------------------------------------------------------------
      float shadowFactor = 1.0;
      float dPlane = dot(vWorldPosition - uPlanetCenter, uRingNormal);
      float Lproj = dot(L, uRingNormal);

      if (abs(Lproj) > 0.001) {
        float t = -dPlane / Lproj;
        if (t > 0.0) {
          vec3 hitPoint = vWorldPosition + L * t;
          float hitDist = length(hitPoint - uPlanetCenter);
          float rInner = uRadius * 1.35;
          float rOuter = uRadius * 2.85;
          if (hitDist >= rInner && hitDist <= rOuter) {
            float normR = (hitDist - rInner) / (rOuter - rInner);
            bool isCassiniGap = normR > 0.42 && normR < 0.48;
            if (!isCassiniGap) {
              shadowFactor = 0.20;
            }
          }
        }
      }

      // Atmospheric Limb Glow - strictly sunlit, zero rim on nightside
      float rim = 1.0 - cosE;
      float sunlitLimb = pow(rim, 5.0) * smoothstep(0.0, 0.25, NdotL);
      vec3 atmoLimb = vec3(0.98, 0.88, 0.62) * sunlitLimb * 0.45;

      // Ringshine & dark nightside ambient at 0.015
      float ringProximity = clamp(1.0 - abs(vLocalPosition.y) / uRadius, 0.0, 1.0);
      vec3 ringshine = vec3(0.92, 0.84, 0.68) * ringProximity * 0.06 * smoothstep(0.1, -0.2, NdotL);
      vec3 nightAmbient = baseCloud * 0.015 + ringshine;

      vec3 finalColor = baseCloud * diffuse * limbFalloff * shadowFactor * 1.30 + atmoLimb + nightAmbient;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const SaturnRingsShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = viewMatrix * worldPos;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;

    uniform sampler2D uRingMap;
    uniform vec3 uSunPosition;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;

    void main() {
      #include <logdepthbuf_fragment>

      vec4 ringTex = texture2D(uRingMap, vUv);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      // Planet-on-Ring Shadow Projection
      vec3 ringToPlanet = vWorldPosition - uPlanetCenter;
      float sunProj = dot(-ringToPlanet, L);
      float shadow = 1.0;

      if (sunProj > 0.0) {
        vec3 perp = ringToPlanet + L * sunProj;
        float distToAxis = length(perp);
        if (distToAxis < uPlanetRadius * 1.02) {
          float penumbra = smoothstep(uPlanetRadius * 0.95, uPlanetRadius * 1.02, distToAxis);
          shadow = mix(0.04, 1.0, penumbra);
        }
      }

      // Backlit forward-scattering (Cassini phase angle translucent glow)
      float cosPhase = dot(L, V);
      float forwardFactor = pow(clamp(-cosPhase, 0.0, 1.0), 4.5);
      vec3 forwardGlow = vec3(0.98, 0.90, 0.75) * forwardFactor * 0.65;

      vec3 ringColor = clamp((ringTex.rgb * vec3(0.95, 0.90, 0.80) + forwardGlow) * shadow * 1.25, 0.0, 1.35);
      float alpha = ringTex.a * 0.92;

      if (alpha < 0.02) discard;

      gl_FragColor = vec4(ringColor, alpha);
    }
  `
};

export function CinematicSaturn({
  position = [0, 0, 0],
  radius = 11.5,
  isPlaying = true,
  sunPosition = [0, 0, 0],
  onClick
}) {
  const [saturnMap, ringMap] = useTexture([
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png'
  ]);

  // Anti-moiré: generate mipmaps and enable 16x anisotropic filtering on rings
  React.useEffect(() => {
    if (ringMap) {
      ringMap.generateMipmaps = true;
      ringMap.minFilter = THREE.LinearMipmapLinearFilter;
      ringMap.magFilter = THREE.LinearFilter;
      ringMap.anisotropy = 16;
      ringMap.needsUpdate = true;
    }
    if (saturnMap) {
      saturnMap.generateMipmaps = true;
      saturnMap.anisotropy = 16;
      saturnMap.needsUpdate = true;
    }
  }, [ringMap, saturnMap]);

  const saturnBodyRef = useRef();
  const surfaceShaderRef = useRef();
  const ringShaderRef = useRef();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);
  const planetCenterVec = useRef(new THREE.Vector3());
  const ringNormalVec = useRef(new THREE.Vector3(0, 1, 0));

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

  useFrame((_, delta) => {
    if (isPlaying && saturnBodyRef.current) {
      saturnBodyRef.current.rotation.y += delta * 0.16;
    }

    if (saturnBodyRef.current) {
      saturnBodyRef.current.getWorldPosition(planetCenterVec.current);
      // Ring normal in world coordinates
      ringNormalVec.current.set(0, 1, 0).applyQuaternion(saturnBodyRef.current.getWorldQuaternion(new THREE.Quaternion())).normalize();
    }

    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
      surfaceShaderRef.current.uniforms.uPlanetCenter.value.copy(planetCenterVec.current);
      surfaceShaderRef.current.uniforms.uRingNormal.value.copy(ringNormalVec.current);
    }
    if (ringShaderRef.current) {
      ringShaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
      ringShaderRef.current.uniforms.uPlanetCenter.value.copy(planetCenterVec.current);
    }
  });

  return (
    <group position={position} rotation={[0, 0, SATURN_AXIAL_TILT]} onClick={onClick}>
      {/* 1. Saturn Oblate Gas Giant Atmosphere Body (f = 0.098 flattening) - Solid & Opaque */}
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
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: saturnMap },
            uSunPosition: { value: sunPosVec },
            uPlanetCenter: { value: planetCenterVec.current },
            uRingNormal: { value: ringNormalVec.current },
            uRadius: { value: radius }
          }}
        />
      </mesh>

      {/* 2. Saturn Cassini Division Ring System with Planet Shadow Projection */}
      <mesh
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow
        receiveShadow
      >
        <shaderMaterial
          ref={ringShaderRef}
          args={[SaturnRingsShader]}
          uniforms={{
            uRingMap: { value: ringMap },
            uSunPosition: { value: sunPosVec },
            uPlanetCenter: { value: planetCenterVec.current },
            uPlanetRadius: { value: radius }
          }}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={true}
        />
      </mesh>
    </group>
  );
}
