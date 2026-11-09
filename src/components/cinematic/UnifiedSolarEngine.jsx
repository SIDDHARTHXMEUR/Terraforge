import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SolarSystemEngine } from './SolarSystemEngine';
import { HeroEarthSunrise } from '../landing/HeroEarthSunrise';
import { ChapterPlanets3D } from '../landing/ChapterPlanets3D';
import { LineupSection3D } from '../landing/LineupSection3D';
import { OverviewSection3D } from '../landing/OverviewSection3D';
import { LandingStarfield } from '../landing/LandingStarfield';
import { runProgressiveWarmup } from '../../utils/assetWarmer';

const SIM_OVERVIEW_POS = new THREE.Vector3(-300, 165, 290);
const SIM_OVERVIEW_TARGET = new THREE.Vector3(-65, 0, 48);

export function UnifiedSolarEngine({
  route,
  selectedBody = 'overview',
  viewMode = 'cinematic',
  timeMultiplier = 1.0,
  isPaused = false,
  showOrbits = true,
  showLabels = true,
  onSelectBody,
  isUserInteracting = false,
  scrollProgressRef,
  onWarmupProgress,
  onFirstRender
}) {
  const { gl, scene, camera } = useThree();
  const [isWarmed, setIsWarmed] = useState(false);
  const hasReportedFirstRender = useRef(false);

  const heroGroupRef = useRef();
  const chaptersGroupRef = useRef();
  const lineupGroupRef = useRef();
  const overviewGroupRef = useRef();

  // Transition state: 'none', 'entering_sim', 'returning_landing'
  const transitionRef = useRef({
    state: 'none',
    startTime: 0,
    duration: 900, // 900ms dive
    fromPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    toTarget: new THREE.Vector3()
  });

  const lastRouteMode = useRef(route.mode);

  // Progressive idle asset warming (chunks <= 4ms, 5s fail-safe)
  useEffect(() => {
    const cancelWarmup = runProgressiveWarmup(
      gl,
      scene,
      camera,
      (pct) => {
        if (onWarmupProgress) onWarmupProgress(pct);
      },
      () => {
        setIsWarmed(true);
        if (onWarmupProgress) onWarmupProgress(100);
      }
    );
    return () => cancelWarmup();
  }, [gl, scene, camera, onWarmupProgress]);

  // Handle route transitions (ENTER dive or HOME return)
  useEffect(() => {
    if (lastRouteMode.current === route.mode) return;

    const now = performance.now();
    const curPos = camera.position.clone();
    // Estimate current lookAt from camera direction
    const curDir = new THREE.Vector3();
    camera.getWorldDirection(curDir);
    const curTarget = curPos.clone().add(curDir.multiplyScalar(100));

    if (route.mode === 'sim') {
      // ENTER THE SIMULATOR: 900ms continuous dive to overview pose
      transitionRef.current = {
        state: 'entering_sim',
        startTime: now,
        duration: 900,
        fromPos: curPos,
        fromTarget: curTarget,
        toPos: SIM_OVERVIEW_POS.clone(),
        toTarget: SIM_OVERVIEW_TARGET.clone()
      };
    } else {
      // RETURN TO LANDING: 900ms smooth reverse glide to Hero Earth pose
      const heroPos = new THREE.Vector3(0, 1.2, 5.0);
      const heroTarget = new THREE.Vector3(0, 0.1, 0);
      transitionRef.current = {
        state: 'returning_landing',
        startTime: now,
        duration: 900,
        fromPos: curPos,
        fromTarget: curTarget,
        toPos: heroPos,
        toTarget: heroTarget
      };
    }

    lastRouteMode.current = route.mode;
  }, [route.mode, camera]);

  // Camera director loop
  useFrame(() => {
    if (!hasReportedFirstRender.current) {
      hasReportedFirstRender.current = true;
      if (onFirstRender) onFirstRender();
    }

    const tState = transitionRef.current;
    if (tState.state !== 'none') {
      const elapsed = performance.now() - tState.startTime;
      const progress = THREE.MathUtils.clamp(elapsed / tState.duration, 0, 1);
      // Cubic-bezier(.22, 1, .36, 1) approximation via smoothstep
      const ease = THREE.MathUtils.smootherstep(progress, 0, 1);

      camera.position.lerpVectors(tState.fromPos, tState.toPos, ease);
      const target = new THREE.Vector3().lerpVectors(tState.fromTarget, tState.toTarget, ease);
      camera.lookAt(target);

      if (progress >= 1) {
        tState.state = 'none';
      }
      return;
    }

    // When in Landing mode and not transitioning: camera follows landing scroll
    const scrollP = scrollProgressRef?.current || 0;
    const isLanding = route.mode === 'landing';

    // Dynamically update section groups visibility on every frame (zero static ref desync)
    if (heroGroupRef.current) {
      heroGroupRef.current.visible = isLanding && (scrollP <= 1.2 || transitionRef.current.state !== 'none');
    }
    if (chaptersGroupRef.current) {
      chaptersGroupRef.current.visible = isLanding && scrollP > 0.4 && scrollP < 6.8;
    }
    if (lineupGroupRef.current) {
      lineupGroupRef.current.visible = isLanding && scrollP >= 6.4 && scrollP < 7.6;
    }
    if (overviewGroupRef.current) {
      overviewGroupRef.current.visible = isLanding && scrollP >= 7.3;
    }

    if (isLanding) {
      if (scrollP <= 0.85) {
        // Section 1: Hero
        const heroCamY = 1.2 + scrollP * 0.4;
        const heroCamZ = 5.0 + scrollP * 1.5;
        camera.position.set(0, heroCamY, heroCamZ);
        camera.lookAt(0, 0.1, 0);
      } else if (scrollP < 6.4) {
        // Sections 2 to 7: Chapters
        camera.position.set(0, 0, 7.2);
        camera.lookAt(0.7, 0, 0);
      } else if (scrollP < 7.4) {
        // Section 8: Lineup
        const sub = THREE.MathUtils.clamp((scrollP - 6.4) / 1.0, 0, 1);
        const camX = THREE.MathUtils.lerp(-4.0, 16.0, sub);
        camera.position.set(camX, 0, 11.5);
        camera.lookAt(camX, 0, 0);
      } else {
        // Section 9: The System (exact simulator overview pose)
        const t = THREE.MathUtils.clamp((scrollP - 7.4) / 0.6, 0, 1);
        const easeT = THREE.MathUtils.smootherstep(t, 0, 1);
        const startPos = new THREE.Vector3(16.0, 0, 11.5);
        const startTarget = new THREE.Vector3(16.0, 0, 0);
        camera.position.lerpVectors(startPos, SIM_OVERVIEW_POS, easeT);
        const curTarget = new THREE.Vector3().lerpVectors(startTarget, SIM_OVERVIEW_TARGET, easeT);
        camera.lookAt(curTarget);
      }
    }
  });

  const isSimActive = route.mode === 'sim';
  const isLandingActive = route.mode === 'landing';
  const isTransitioning = transitionRef.current.state !== 'none';

  return (
    <>
      {/* Background Starfield - Always resident */}
      <LandingStarfield count={3000} />

      {/* Hero Earth Sunrise - Always resident in memory for instant <0.1s return */}
      <group ref={heroGroupRef}>
        <HeroEarthSunrise isVisible={isLandingActive} />
      </group>

      {/* Landing Chapters 3D Planets (Sections 2 to 7) */}
      <group ref={chaptersGroupRef}>
        <ChapterPlanets3D scrollProgressRef={scrollProgressRef} />
      </group>

      {/* Landing Section 8 Lineup 3D */}
      <group ref={lineupGroupRef}>
        <LineupSection3D scrollProgressRef={scrollProgressRef} />
      </group>

      {/* Landing Section 9 Overview 3D */}
      <group ref={overviewGroupRef}>
        <OverviewSection3D scrollProgressRef={scrollProgressRef} />
      </group>

      {/* Simulator Solar System Engine - Mounted permanently, camera hands off smoothly */}
      <group visible={isSimActive || isTransitioning}>
        <SolarSystemEngine
          selectedBody={selectedBody}
          viewMode={viewMode}
          timeMultiplier={timeMultiplier}
          isPaused={isPaused}
          showOrbits={showOrbits}
          showLabels={isSimActive && showLabels && !isTransitioning} // Route-aware: never over landing!
          onSelectBody={onSelectBody}
          isUserInteracting={isUserInteracting}
          isPrologueActive={false}
          enabled={isSimActive}
        />
      </group>
    </>
  );
}
