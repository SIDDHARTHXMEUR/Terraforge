import React from 'react';
import { useProgress } from '@react-three/drei';
import { BrandedPreloader } from './common/BrandedPreloader';

export function LoadingScreen() {
  const { progress, active } = useProgress();

  return (
    <BrandedPreloader
      progress={progress}
      isVisible={active}
      statusText="INITIALIZING 3D UNIVERSE"
    />
  );
}

export default LoadingScreen;
