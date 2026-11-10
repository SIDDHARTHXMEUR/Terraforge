import { PLANETS_CONFIG } from '../data/planetsData.js';

const SPEED_OF_LIGHT_KM_S = 299792.458;
const AU_IN_KM = 149597870.7;

export function formatDayLength(hours) {
  if (hours === undefined || hours === null) return 'N/A';
  const abs = Math.abs(hours);
  const isRet = hours < 0;
  if (abs >= 48) {
    return `${(abs / 24).toFixed(1)} Earth days${isRet ? ' (retrograde)' : ''}`;
  }
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${h}h ${m}m${isRet ? ' (retrograde)' : ''}`;
}

/**
 * Single source of truth for planetary stats across Landing Page and Simulator
 */
export function getUnifiedPlanetStats(planetKey) {
  const key = (planetKey || '').toLowerCase();
  const p = PLANETS_CONFIG[key] || {};

  // Distance calculations
  const distanceAU = p.semiMajorAxisAU !== undefined
    ? p.semiMajorAxisAU
    : (p.semiMajorAxisAu !== undefined ? p.semiMajorAxisAu : 0);

  const distanceMkm = (distanceAU * AU_IN_KM) / 1e6;
  const distStr = distanceAU > 0 ? `${distanceAU.toFixed(3)} AU` : (key === 'sun' ? '0.00 AU' : '0.00 AU');
  const distSimStr = distanceAU === 0 ? '0.00 AU' : `${distanceAU.toFixed(2)} AU`;
  const distSub = distanceAU > 0 ? `${distanceMkm.toFixed(1)}M KM` : 'CENTER';

  // Light-time calculations
  const lightTimeSec = (distanceAU * AU_IN_KM) / SPEED_OF_LIGHT_KM_S;
  let lightTimeStr = '0.00 S';
  if (lightTimeSec >= 60) {
    const mins = Math.floor(lightTimeSec / 60);
    const secs = Math.floor(lightTimeSec % 60);
    lightTimeStr = `${mins}M ${secs}S`;
  } else if (lightTimeSec > 0) {
    lightTimeStr = `${lightTimeSec.toFixed(1)}S`;
  }

  // Length of year / Orbital Period
  let yearStr = 'N/A';
  const days = p.orbitalPeriodDays || 0;
  if (days > 0) {
    if (days >= 500) {
      yearStr = `${(days / 365.25).toFixed(2)} YRS`;
    } else {
      yearStr = `${days.toFixed(1)} DAYS`;
    }
  } else {
    yearStr = 'HOST STAR';
  }

  // Classification
  let typeStr = 'TERRESTRIAL';
  if (key === 'sun') typeStr = 'YELLOW DWARF';
  else if (['jupiter', 'saturn'].includes(key)) typeStr = 'GAS GIANT';
  else if (['uranus', 'neptune'].includes(key)) typeStr = 'ICE GIANT';
  else if (key === 'asteroids' || key === 'ceres') typeStr = 'MINOR PLANET';

  // Day length
  const dayStr = formatDayLength(p.rotationPeriodHours);

  // Diameter
  const diameterKm = p.radiusKm ? Math.round(p.radiusKm * 2) : 0;
  const diameterStr = diameterKm > 0 ? `${diameterKm.toLocaleString()} KM` : 'N/A';

  return {
    name: p.name || key.toUpperCase(),
    distAU: distanceAU,
    distStr,
    distSimStr,
    distSub,
    lightTimeSec,
    lightTimeStr,
    yearStr,
    orbitalPeriodDays: days,
    typeStr,
    dayStr,
    diameterStr,
    radiusKm: p.radiusKm || 0,
    gravity: p.gravity || 'N/A',
    meanTempC: p.meanTempC,
    axialTiltDeg: p.axialTiltDeg,
    mass: p.mass,
    atmosphereComposition: p.atmosphereComposition,
    description: p.description || p.tagline || ''
  };
}
