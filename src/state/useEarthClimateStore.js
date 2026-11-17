import { create } from 'zustand';

export function computeSeaLevelFromTemp(t) {
  if (t === 0) return 0;
  if (t > 0) {
    // Thermal expansion + polar ice melt up to +80m (total Antarctic/Greenland ice melt)
    return Math.round(Math.min(80, t * 1.6 + Math.pow(t / 7.5, 2) * 2.2));
  } else {
    // Continental ice sheet sequestration down to -120m (Last Glacial Maximum)
    return Math.round(Math.max(-120, t * 3.0 - Math.pow(Math.abs(t) / 8.5, 1.8) * 1.8));
  }
}

export function computeCloudCoverFromTemp(t) {
  if (t === 0) return 1.0;
  if (t > 0) {
    // Clausius-Clapeyron relation (+7% water vapor holding capacity per °C)
    return Math.min(2.0, 1.0 + (t / 30.0) * 0.75);
  } else {
    // Cryosphere dry atmosphere
    return Math.max(0.4, 1.0 - (Math.abs(t) / 28.0) * 0.55);
  }
}

export function computeEarthSystemMetrics(temp, seaLevel) {
  // 1. Absolute Surface Mean Temperature
  const absTemp = (14.2 + temp).toFixed(1);

  // 2. Atmospheric CO2 Equivalent
  let co2 = 422;
  if (temp > 0) {
    co2 = Math.round(422 + temp * 48 + Math.pow(temp / 4.2, 2) * 22);
  } else {
    co2 = Math.max(175, Math.round(422 + temp * 8.5));
  }

  // 3. Planetary Bond Albedo (Reflectivity)
  let albedo = 0.306;
  if (temp > 0) {
    albedo = Math.max(0.258, +(0.306 - (temp / 45.0) * 0.048).toFixed(3));
  } else {
    albedo = Math.min(0.565, +(0.306 + (Math.abs(temp) / 28.0) * 0.235).toFixed(3));
  }

  // 4. Ocean Acidification (Surface pH)
  let oceanPh = 8.11;
  if (temp > 0) {
    oceanPh = Math.max(7.68, +(8.11 - (temp / 35.0) * 0.36).toFixed(2));
  } else {
    oceanPh = Math.min(8.28, +(8.11 + (Math.abs(temp) / 30.0) * 0.15).toFixed(2));
  }

  // 5. Cryosphere Ice Extent & Volume
  let cryosphereArea = '26.2 M km²';
  let cryosphereStatus = 'Nominal Cryosphere Baseline';
  if (temp >= 15.0) {
    cryosphereArea = '0.0 M km²';
    cryosphereStatus = '-100% (Complete Ice-Free Planet)';
  } else if (temp >= 4.0) {
    cryosphereArea = '8.4 M km²';
    cryosphereStatus = '-68% (Greenland & West Antarctic Melt)';
  } else if (temp >= 1.5) {
    cryosphereArea = '17.8 M km²';
    cryosphereStatus = '-32% (Arctic Summer Sea Ice Loss)';
  } else if (temp <= -15.0) {
    cryosphereArea = '62.4 M km²';
    cryosphereStatus = '+138% (Laurentide Continental Glaciation)';
  } else if (temp <= -3.0) {
    cryosphereArea = '38.5 M km²';
    cryosphereStatus = '+47% (Subpolar Glacier Advance)';
  }

  // 6. Biosphere & Biome State
  let biomeState = 'Stable Holocene Equilibrium';
  let statusColor = '#4FD1C5'; // Cyan
  let biomeDetail = 'Temperate, Boreal & Tropical Forest Stability';

  if (temp >= 6.0) {
    biomeState = 'Marine Anoxia & Mass Extinction';
    statusColor = '#F87171'; // Red
    biomeDetail = 'Global Forest Dieback · Extreme Tropical Heat Belt';
  } else if (temp >= 3.0) {
    biomeState = 'Amazon Dieback & Coral Collapse';
    statusColor = '#F87171';
    biomeDetail = '99% Coral Bleaching · Tropical Savannafication';
  } else if (temp >= 1.5) {
    biomeState = 'Subtropical Aridification Stress';
    statusColor = '#FBBF24'; // Amber
    biomeDetail = '70% Coral Bleaching · Mediterranean Arid Belt Expansion';
  } else if (temp <= -15.0) {
    biomeState = 'Continental Glacial Steppe';
    statusColor = '#60A5FA'; // Ice Blue
    biomeDetail = 'Boreal Tundra Steppe Encroachment to 35°N';
  } else if (temp <= -3.0) {
    biomeState = 'Subpolar Tundra Expansion';
    statusColor = '#60A5FA';
    biomeDetail = 'Southward Shift of Boreal Forest Margins';
  }

  return {
    absTemp,
    co2,
    albedo,
    oceanPh,
    cryosphereArea,
    cryosphereStatus,
    biomeState,
    biomeDetail,
    statusColor
  };
}

export const useEarthClimateStore = create((set) => ({
  tempAnomaly: 0, // -30°C to +50°C
  seaLevelDelta: 0, // -120m to +80m
  cityLightsFactor: 1.0, // 0.0 to 3.0
  cloudCover: 1.0, // 0.2 to 2.5

  setTempAnomaly: (val) => {
    const autoSeaLevel = computeSeaLevelFromTemp(val);
    const autoCloudCover = computeCloudCoverFromTemp(val);
    set({
      tempAnomaly: val,
      seaLevelDelta: autoSeaLevel,
      cloudCover: autoCloudCover
    });
  },

  setSeaLevelDelta: (val) => set({ seaLevelDelta: val }),
  setCityLightsFactor: (val) => set({ cityLightsFactor: val }),
  setCloudCover: (val) => set({ cloudCover: val }),

  setPreset: (preset) => {
    switch (preset) {
      case 'snowball':
        set({ tempAnomaly: -25, seaLevelDelta: -105, cityLightsFactor: 0.1, cloudCover: 0.45 });
        break;
      case 'baseline':
        set({ tempAnomaly: 0, seaLevelDelta: 0, cityLightsFactor: 1.0, cloudCover: 1.0 });
        break;
      case 'hothouse':
        set({ tempAnomaly: 35, seaLevelDelta: 72, cityLightsFactor: 1.2, cloudCover: 1.65 });
        break;
      default:
        break;
    }
  },

  reset: () => set({ tempAnomaly: 0, seaLevelDelta: 0, cityLightsFactor: 1.0, cloudCover: 1.0 })
}));
