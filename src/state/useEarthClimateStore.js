import { create } from 'zustand';

export function computeSeaLevelFromTemp(t) {
  if (t === 0) return 0;
  if (t > 0) {
    // Thermal expansion + polar ice melt up to +80m (total Antarctic/Greenland ice melt)
    return Math.round(Math.min(80, t * 1.5 + Math.pow(t / 8.0, 2) * 1.8));
  } else {
    // Continental ice sheet sequestration down to -120m (Last Glacial Maximum)
    return Math.round(Math.max(-120, t * 2.8 - Math.pow(Math.abs(t) / 9.0, 1.8) * 1.5));
  }
}

export function computeCloudCoverFromTemp(t) {
  if (t === 0) return 1.0;
  if (t > 0) {
    // Clausius-Clapeyron: +7% moisture per °C
    return Math.min(2.2, 1.0 + (t / 35.0) * 0.85);
  } else {
    // Dry cryosphere atmosphere
    return Math.max(0.35, 1.0 - (Math.abs(t) / 30.0) * 0.6);
  }
}

export function computeClimateImpactMetrics(temp, seaLevel) {
  // 1. CO2 Equivalent
  let co2 = 420;
  if (temp > 0) {
    co2 = Math.round(420 + temp * 55 + Math.pow(temp / 4.0, 2) * 18);
  } else {
    co2 = Math.max(160, Math.round(420 + temp * 9.5));
  }

  // 2. Displaced Population (global coastal population ~1.2B under +80m flood)
  let displacedPopStr = '0 (Baseline)';
  if (seaLevel > 0) {
    const displacedMillions = Math.min(1850, Math.round(seaLevel * 14.5 + Math.pow(seaLevel / 10.0, 2) * 18));
    displacedPopStr = displacedMillions >= 1000 ? `${(displacedMillions / 1000).toFixed(2)} Billion` : `${displacedMillions} Million`;
  } else if (seaLevel < -10) {
    const displacedCold = Math.round(Math.abs(temp) * 12);
    displacedPopStr = `${displacedCold}M (Polar Migration)`;
  }

  // 3. Ecosystem & Biodiversity
  let ecosystem = 'Stable Holocene Biosphere';
  let ecoStatusColor = '#4FD1C5'; // Cyan
  let habitability = 'Optimal Planetary Biomass';
  let cropYield = 'Nominal Global Production';

  if (temp >= 5.0) {
    ecosystem = 'Planetary Mass Extinction · Ocean Anoxia Cascade';
    ecoStatusColor = '#F87171'; // Red
    habitability = 'Tropical Belts Completely Uninhabitable';
    cropYield = '-48% Global Grain Yield Collapse';
  } else if (temp >= 3.0) {
    ecosystem = 'Amazon Rainforest Dieback · Global Coral Collapse (99%)';
    ecoStatusColor = '#F87171';
    habitability = 'Severe Heat Stress for 3.4B People';
    cropYield = '-28% Grain Harvest Deficit';
  } else if (temp >= 1.5) {
    ecosystem = '75% Coral Reef Bleaching · Mediterranean Aridification';
    ecoStatusColor = '#FBBF24'; // Amber
    habitability = 'Moderate Subtropical Desiccation';
    cropYield = '-12% Regional Agricultural Stress';
  } else if (temp <= -15.0) {
    ecosystem = 'Mass Glaciation · Tundra Steppe Expansion to 35°N';
    ecoStatusColor = '#60A5FA'; // Ice Blue
    habitability = 'Northern Hemisphere Buried Under Ice';
    cropYield = '-65% Arable Land Glacier Encroachment';
  } else if (temp <= -3.0) {
    ecosystem = 'Boreal Zone Expansion · Alpine Glacier Advance';
    ecoStatusColor = '#60A5FA';
    habitability = 'Temperate Growing Season Shortened';
    cropYield = '-18% High-Latitude Yield Reduction';
  }

  // 4. Cryosphere / Ice Sheet Status
  let iceStatus = 'Pre-Industrial Cryosphere Baseline';
  if (temp >= 15.0) {
    iceStatus = '100% Polar Caps Melted (Ice-Free Planet)';
  } else if (temp >= 3.0) {
    iceStatus = 'Greenland & West Antarctic Collapse (-70% Ice)';
  } else if (temp >= 1.0) {
    iceStatus = 'Arctic Summer Sea Ice Depleted (-35% Mass)';
  } else if (temp <= -15.0) {
    iceStatus = 'Laurentide & Fennoscandian Sheets (+220% Mass)';
  } else if (temp <= -3.0) {
    iceStatus = 'Arctic Sea Ice Expansion (+45% Glaciation)';
  }

  return {
    co2,
    displacedPopStr,
    ecosystem,
    ecoStatusColor,
    habitability,
    cropYield,
    iceStatus
  };
}

export const useEarthClimateStore = create((set, get) => ({
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
        set({ tempAnomaly: -25, seaLevelDelta: -100, cityLightsFactor: 0.1, cloudCover: 0.5 });
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
