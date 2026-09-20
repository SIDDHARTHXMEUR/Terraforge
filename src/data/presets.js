export const PRESETS = {
  earth: {
    id: 'earth',
    name: 'Earth',
    temp: 15, // °C
    cloudCoverage: 0.6, // opacity 0..1
    atmosphereIntensity: 1.0, // multiplier 0..2
    rotationSpeed: 0.5, // rad/s relative
    atmosphereColor: '#3b82f6',
    surfaceTint: '#ffffff',
    description: 'Temperate climate with oceans, lush landmasses, and active cloud systems.'
  },
  ice: {
    id: 'ice',
    name: 'Ice World',
    temp: -50,
    cloudCoverage: 0.85,
    atmosphereIntensity: 1.4,
    rotationSpeed: 0.25,
    atmosphereColor: '#93c5fd',
    surfaceTint: '#e0f2fe',
    description: 'Sub-zero cryo planet dominated by glaciers, frozen oceans, and high albedo.'
  },
  desert: {
    id: 'desert',
    name: 'Desert World',
    temp: 45,
    cloudCoverage: 0.1,
    atmosphereIntensity: 0.6,
    rotationSpeed: 0.7,
    atmosphereColor: '#f97316',
    surfaceTint: '#ffedd5',
    description: 'Arid terra-cotta world with vast dune seas, sparse atmosphere, and extreme heat.'
  }
};
