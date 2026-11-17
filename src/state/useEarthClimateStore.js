import { create } from 'zustand';

export const useEarthClimateStore = create((set) => ({
  tempAnomaly: 0, // -30°C to +50°C
  seaLevelDelta: 0, // -100m to +80m
  cityLightsFactor: 1.0, // 0.0 to 3.0
  cloudCover: 1.0, // 0.2 to 2.5

  setTempAnomaly: (val) => set({ tempAnomaly: val }),
  setSeaLevelDelta: (val) => set({ seaLevelDelta: val }),
  setCityLightsFactor: (val) => set({ cityLightsFactor: val }),
  setCloudCover: (val) => set({ cloudCover: val }),

  setPreset: (preset) => {
    switch (preset) {
      case 'snowball':
        set({ tempAnomaly: -25, seaLevelDelta: -90, cityLightsFactor: 0.1, cloudCover: 0.5 });
        break;
      case 'baseline':
        set({ tempAnomaly: 0, seaLevelDelta: 0, cityLightsFactor: 1.0, cloudCover: 1.0 });
        break;
      case 'hothouse':
        set({ tempAnomaly: 35, seaLevelDelta: 65, cityLightsFactor: 1.2, cloudCover: 1.6 });
        break;
      default:
        break;
    }
  },

  reset: () => set({ tempAnomaly: 0, seaLevelDelta: 0, cityLightsFactor: 1.0, cloudCover: 1.0 })
}));
