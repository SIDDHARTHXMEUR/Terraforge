import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DISPLAY_RADII, DISPLAY_ORBIT_RADII } from '../../data/displayScale';

// Scratch vectors pre-allocated to ensure ZERO garbage collection during 60 FPS flight
const _vSat = new THREE.Vector3();
const _vSun = new THREE.Vector3(0, 0, 0);
const _toSun = new THREE.Vector3();
const _satNormal = new THREE.Vector3();
const _inPlaneSun = new THREE.Vector3();
const _inPlanePerp = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _startCam = new THREE.Vector3();
const _endCam = new THREE.Vector3();
const _startTgt = new THREE.Vector3();
const _endTgt = new THREE.Vector3();
const _sunScreen = new THREE.Vector3();
const _dummy = new THREE.Object3D();

// Shader for 600 instanced ice particles grazing Saturn's ring plane
const RingParticleShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    attribute float aSpeed;
    attribute float aPhase;
    attribute vec3 aOffset;

    uniform float uTime;
    uniform vec3 uSunPosition;

    varying float vGlint;
    varying float vAlpha;

    void main() {
      // Gentle Keplerian orbital drift along Saturn's ring plane
      vec3 pos = position;
      
      // Velocity streak elongation along orbital direction
      pos.z *= 2.8;

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      
      // Compute glint towards Sun
      vec3 toSun = normalize(uSunPosition - worldPos.xyz);
      vec3 norm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      float nDotL = max(0.0, dot(norm, toSun));
      
      // Sparkle phase
      float sparkle = sin(uTime * 4.0 + aPhase) * 0.5 + 0.5;
      vGlint = nDotL * 0.6 + sparkle * 0.4;
      vAlpha = smoothstep(0.0, 1.5, uTime) * smoothstep(5.5, 4.2, uTime);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying float vGlint;
    varying float vAlpha;

    void main() {
      #include <logdepthbuf_fragment>
      if (vAlpha <= 0.01) discard;

      // Silvery-white ice crystal color with subtle amber scatter
      vec3 iceColor = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.85, 0.65), vGlint * 0.5);
      gl_FragColor = vec4(iceColor, vAlpha * (0.45 + vGlint * 0.55));
    }
  `
};

// Shader for volumetric radial light shafts through Cassini ring gap
const VolumetricRadialShaftShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec2 uSunScreenPos;
    uniform float uIntensity;
    uniform float uTime;

    void main() {
      if (uIntensity <= 0.005) {
        discard;
      }

      vec2 delta = (vUv - uSunScreenPos) * (1.0 / 24.0);
      vec2 coord = vUv;
      float decay = 1.0;
      float rays = 0.0;

      for (int i = 0; i < 24; i++) {
        coord -= delta;
        float d = length(coord - uSunScreenPos);
        
        // Radial beam frequency modeling Cassini division optical gap
        float angle = atan(coord.y - uSunScreenPos.y, coord.x - uSunScreenPos.x);
        float beamPattern = sin(angle * 14.0 + 1.2) * sin(angle * 7.0 - 0.5);
        beamPattern = max(0.0, beamPattern);

        float falloff = exp(-d * 3.5);
        rays += falloff * beamPattern * decay;
        decay *= 0.91;
      }

      // Golden solar radiance color palette matching SDO Chromosphere
      vec3 shaftColor = vec3(1.0, 0.78, 0.38) * rays * uIntensity * 0.65;
      gl_FragColor = vec4(shaftColor, min(1.0, rays * uIntensity * 0.5));
    }
  `
};

export function CinematicLivePrologue({
  isActive = true,
  onComplete,
  bodyPositions = {}
}) {
  const { camera, gl, scene, size } = useThree();
  const timeRef = useRef(0);
  const isFinishedRef = useRef(false);

  // Initialize global prologue trackers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__isLivePrologueActive = true;
      window.__prologueTime = 0;
      window.__prologueTimeSpeed = 1.0;
      window.__prologueOrbitProgress = {
        mercury: 0.0,
        venus: 0.0,
        earth: 0.0,
        mars: 0.0,
        asteroids: 0.0,
        jupiter: 0.0,
        saturn: 0.0,
        uranus: 0.0,
        neptune: 0.0
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.__isLivePrologueActive = false;
        window.__prologueTimeSpeed = 1.0;
        window.__prologueOrbitProgress = {
          mercury: 1.0,
          venus: 1.0,
          earth: 1.0,
          mars: 1.0,
          asteroids: 1.0,
          jupiter: 1.0,
          saturn: 1.0,
          uranus: 1.0,
          neptune: 1.0
        };
      }
    };
  }, []);

  // Master watchdog timer ensures completion even on system stall
  useEffect(() => {
    if (!isActive) return;
    const masterTimer = setTimeout(() => {
      if (!isFinishedRef.current) {
        isFinishedRef.current = true;
        if (onComplete) onComplete();
      }
    }, 16000);

    return () => clearTimeout(masterTimer);
  }, [isActive, onComplete]);

  // 600 instanced ice particles grazing Saturn's ring plane
  const particleCount = 600;
  const instancedMeshRef = useRef();
  const particleShaderRef = useRef();

  const particleData = useMemo(() => {
    const offsets = [];
    const speeds = [];
    const phases = [];
    for (let i = 0; i < particleCount; i++) {
      // Ring radius between 22 and 34 units from Saturn center
      const r = 22.0 + Math.random() * 12.0;
      const angle = (Math.random() * 0.7 + 2.2) * Math.PI; // Nightside arc
      const y = (Math.random() - 0.5) * 0.7; // Very thin vertical spread
      offsets.push(r, angle, y);
      speeds.push(0.04 + Math.random() * 0.06);
      phases.push(Math.random() * Math.PI * 2);
    }
    return { offsets, speeds, phases };
  }, []);

  // Radial blur screen-space quad material
  const shaftMaterialRef = useRef();
  const glintMeshRef = useRef();

  useFrame((state, delta) => {
    if (!isActive || isFinishedRef.current) return;

    timeRef.current += delta;
    const t = timeRef.current;
    if (typeof window !== 'undefined') {
      window.__prologueTime = t;
      window.__threeCamera = camera;
      window.__currentExposure = state.gl.toneMappingExposure;
    }

    const satPos = bodyPositions.saturn || [-132, 0, 98];
    _vSat.set(satPos[0], satPos[1], satPos[2]);
    _toSun.copy(_vSat).negate().normalize();

    // Saturn axial tilt (26.73 degrees in Z)
    const tilt = (26.73 * Math.PI) / 180;
    _satNormal.set(-Math.sin(tilt), Math.cos(tilt), 0).normalize();

    // In-plane basis vectors on Saturn's ring plane
    _inPlaneSun.copy(_toSun).addScaledVector(_satNormal, -_satNormal.dot(_toSun)).normalize();
    _inPlanePerp.crossVectors(_satNormal, _inPlaneSun).normalize();

    // -------------------------------------------------------------------------
    // CHOREOGRAPHY BEATS (Exact single continuous shot)
    // -------------------------------------------------------------------------

    if (t < 5.0) {
      // 0.0 - 5.0s: Saturn Night Side, Ring Plane Glide
      const p = Math.min(1.0, t / 5.0);
      const ease = p * p * (3.0 - 2.0 * p); // Smooth cubic hermite

      // Gliding along ring plane on the nightside (facing opposite to Sun)
      const dist = 33.0 - ease * 7.5;
      const altitude = 0.60 + ease * 0.45;
      const perpOffset = 5.2 - ease * 2.8;

      _camPos.copy(_vSat)
        .addScaledVector(_inPlaneSun, -dist)
        .addScaledVector(_inPlanePerp, perpOffset)
        .addScaledVector(_satNormal, altitude);

      camera.position.copy(_camPos);
      if (typeof window !== 'undefined') {
        window.__debugCamPos = [_camPos.x, _camPos.y, _camPos.z];
        window.__debugActualCamPos = [camera.position.x, camera.position.y, camera.position.z];
      }

      // Look past Saturn's dark rim towards where the Sun will emerge
      _lookTarget.copy(_vSat)
        .addScaledVector(_inPlaneSun, 16.0)
        .addScaledVector(_inPlanePerp, perpOffset * 0.5)
        .addScaledVector(_satNormal, altitude * 0.3);

      camera.lookAt(_lookTarget);
      camera.rotation.z = Math.sin(t * 0.35) * 0.025; // Subtle cinematic camera roll

      // Exposure curve: minimum exposure during 0-1s, then steady nightside exposure
      if (t < 1.0) {
        state.gl.toneMappingExposure = 0.55 + (t / 1.0) * 0.40;
      } else {
        state.gl.toneMappingExposure = 0.95;
      }

      // 1.5s Micro-glint on Saturn's rim
      if (glintMeshRef.current) {
        const glintP = Math.max(0.0, 1.0 - Math.abs(t - 1.5) / 0.35);
        glintMeshRef.current.visible = glintP > 0.01;
        if (glintMeshRef.current.visible) {
          glintMeshRef.current.position.copy(_vSat)
            .addScaledVector(_inPlaneSun, 9.8)
            .addScaledVector(_satNormal, 0.2);
          glintMeshRef.current.scale.setScalar(0.4 + glintP * 1.8);
        }
      }

    } else if (t < 8.5) {
      // 5.0 - 8.5s: THE SUN RISES from behind Saturn's limb!
      const p = (t - 5.0) / 3.5;
      const ease = p * p * (3.0 - 2.0 * p);

      // Camera glides past Saturn and pushes toward the rising Sun
      const distSat = 22.0 - ease * 4.0;
      const pushTowardSun = ease * 160.0;

      _camPos.copy(_vSat)
        .addScaledVector(_inPlaneSun, -distSat)
        .addScaledVector(_toSun, pushTowardSun)
        .addScaledVector(_inPlanePerp, (1.0 - ease) * 1.8)
        .addScaledVector(_satNormal, 0.85);

      camera.position.copy(_camPos);
      if (typeof window !== 'undefined') {
        window.__debugCamPos = [_camPos.x, _camPos.y, _camPos.z];
        window.__debugActualCamPos = [camera.position.x, camera.position.y, camera.position.z];
      }

      // Look directly towards the rising Sun
      _lookTarget.copy(_vSun);
      camera.lookAt(_lookTarget);

      // Telephoto lens framing: Sun must occupy >= 45% of frame height at 8.0s!
      // In 28-degree FOV at distance ~298 from Sol, Sun radius 54 occupies ~75% of vertical frame
      const zoomP = Math.sin(p * Math.PI * 0.5);
      camera.fov = 45.0 - zoomP * 17.5; // ~27.5 deg at peak (8.0s)
      camera.updateProjectionMatrix();

      // Dynamic Auto-Exposure: pulls down tone mapping dynamically to 0.78 so Sun surface
      // granulation, boiling convective cells, and sunspots remain crystal clear without clipping
      const sunFlareEase = Math.sin(p * Math.PI * 0.5);
      state.gl.toneMappingExposure = 0.95 - sunFlareEase * 0.17; // 0.78 at peak!

      // Activate volumetric light shafts through Cassini ring gap
      if (shaftMaterialRef.current) {
        _sunScreen.copy(_vSun).project(camera);
        const screenUvX = _sunScreen.x * 0.5 + 0.5;
        const screenUvY = _sunScreen.y * 0.5 + 0.5;
        shaftMaterialRef.current.uniforms.uSunScreenPos.value.set(screenUvX, screenUvY);
        const shaftIntensity = Math.sin(p * Math.PI) * 1.0;
        shaftMaterialRef.current.uniforms.uIntensity.value = shaftIntensity;
        shaftMaterialRef.current.uniforms.uTime.value = t;
      }

    } else if (t < 11.5) {
      // 8.5 - 11.5s: COSMIC PULL-BACK, ORBIT REVELATION & SPEED RAMP
      const p = (t - 8.5) / 3.0;
      // Smooth quintic acceleration/deceleration
      const ease = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

      // Start pose: near Saturn/Sun transition pose
      _startCam.copy(_vSat)
        .addScaledVector(_inPlaneSun, -18.0)
        .addScaledVector(_toSun, 160.0)
        .addScaledVector(_satNormal, 0.85);
      _startTgt.copy(_vSun);

      // End pose: Master solar overview position
      _endCam.set(-320, 110, 310);
      _endTgt.set(-65, 0, 48);

      camera.position.lerpVectors(_startCam, _endCam, ease);
      _lookTarget.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTarget);
      
      // Normalize FOV back to 45 degrees
      camera.fov = 27.5 + ease * 17.5;
      camera.updateProjectionMatrix();

      // Simulation speed ramps 1x -> 300x -> 1x
      const speedRamp = 1.0 + 299.0 * Math.sin(p * Math.PI);
      if (typeof window !== 'undefined') {
        window.__prologueTimeSpeed = speedRamp;
      }

      // Neon orbit lines ignite outward in distance order:
      // Mercury -> Venus -> Earth -> Mars -> Asteroids -> Jupiter -> Saturn -> Uranus -> Neptune
      const bodyOrder = ['mercury', 'venus', 'earth', 'mars', 'asteroids', 'jupiter', 'saturn', 'uranus', 'neptune'];
      bodyOrder.forEach((bodyKey, index) => {
        const bodyStart = index * 0.085;
        const bodyProgress = Math.max(0.0, Math.min(1.0, (p - bodyStart) / 0.28));
        if (typeof window !== 'undefined' && window.__prologueOrbitProgress) {
          window.__prologueOrbitProgress[bodyKey] = bodyProgress;
        }
      });

      // Exposure normalizes to standard overview 1.15
      state.gl.toneMappingExposure = 0.78 + ease * 0.37;

      // Shafts fade away
      if (shaftMaterialRef.current) {
        shaftMaterialRef.current.uniforms.uIntensity.value = Math.max(0.0, (1.0 - p * 3.0));
      }

    } else if (t < 13.5) {
      // 11.5 - 13.5s: Dip to black & Wordmark card
      // Camera is settled in overview
      camera.position.set(-320, 110, 310);
      camera.lookAt(-65, 0, 48);
      camera.fov = 45.0;
      camera.updateProjectionMatrix();
      state.gl.toneMappingExposure = 1.15;
      if (typeof window !== 'undefined') {
        window.__prologueTimeSpeed = 1.0;
        // All orbits fully visible
        Object.keys(window.__prologueOrbitProgress || {}).forEach((k) => {
          window.__prologueOrbitProgress[k] = 1.0;
        });
      }

    } else if (t <= 14.5) {
      // 13.5 - 14.5s: Overview scene reveal & Handover
      camera.position.set(-320, 110, 310);
      camera.lookAt(-65, 0, 48);
      camera.fov = 45.0;
      camera.updateProjectionMatrix();
      state.gl.toneMappingExposure = 1.15;
      if (typeof window !== 'undefined') {
        window.__prologueTimeSpeed = 1.0;
      }
    } else {
      if (!isFinishedRef.current) {
        isFinishedRef.current = true;
        if (onComplete) onComplete();
      }
    }

    // Update 600 instanced ring particles
    if (instancedMeshRef.current && t < 6.0) {
      const { offsets, speeds, phases } = particleData;
      for (let i = 0; i < particleCount; i++) {
        const baseR = offsets[i * 3];
        const baseAngle = offsets[i * 3 + 1];
        const baseY = offsets[i * 3 + 2];
        const speed = speeds[i];

        // Particle orbital position around Saturn
        const curAngle = baseAngle + t * speed * 0.15;
        const pX = Math.cos(curAngle) * baseR;
        const pZ = Math.sin(curAngle) * baseR;

        // Transform into Saturn's tilted ring space
        _dummy.position.copy(_vSat)
          .addScaledVector(_inPlaneSun, pX)
          .addScaledVector(_inPlanePerp, pZ)
          .addScaledVector(_satNormal, baseY);

        // Subtle tumble
        _dummy.rotation.set(t * 0.2 + phases[i], t * 0.3 + phases[i], 0);
        _dummy.scale.set(0.05, 0.05, 0.22);
        _dummy.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, _dummy.matrix);
      }
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. 600 Instanced Ice Particles Grazing Saturn's Ring Plane */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[null, null, particleCount]}
        renderOrder={12}
      >
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial
          ref={particleShaderRef}
          args={[RingParticleShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uTime: { value: 0 },
            uSunPosition: { value: _vSun }
          }}
        />
      </instancedMesh>

      {/* 2. 1.5s Specular Micro-Glint on Saturn's Crescent Rim */}
      <mesh ref={glintMeshRef} visible={false} renderOrder={14}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color="#FFFDF0"
          transparent={true}
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthTest={false}
        />
      </mesh>

      {/* 3. Screen-Space Half-Res Volumetric Radial Light Shafts Pass */}
      <mesh renderOrder={99} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={shaftMaterialRef}
          args={[VolumetricRadialShaftShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          uniforms={{
            uSunScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
            uIntensity: { value: 0.0 },
            uTime: { value: 0 }
          }}
        />
      </mesh>
    </group>
  );
}
