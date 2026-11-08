import React from 'react';
import { PLANETS_CONFIG } from '../../data/planetsData';

const SPEED_OF_LIGHT_KM_S = 299792.458;
const AU_IN_KM = 149597870.7;

export const CHAPTERS_DATA = [
  {
    index: 1,
    id: 'mercury',
    planetKey: 'mercury',
    name: 'MERCURY',
    microLabel: '01 / INNER SYSTEM',
    accent: '#B8B2A7',
    nextPlanet: 'VENUS',
    nextHash: '#venus',
    surfaceStrip: {
      name: 'CALORIS BASIN',
      coords: '30.5° N, 189.8° W',
      image: '/assets/planets/mercury/mercury.jpg'
    }
  },
  {
    index: 2,
    id: 'venus',
    planetKey: 'venus',
    name: 'VENUS',
    microLabel: '02 / SULPHURIC HELLSCAPE',
    accent: '#E5C185',
    nextPlanet: 'EARTH',
    nextHash: '#earth',
    surfaceStrip: null
  },
  {
    index: 3,
    id: 'earth',
    planetKey: 'earth',
    name: 'EARTH',
    microLabel: '03 / HABITABLE WORLD',
    accent: '#7AD1FF',
    nextPlanet: 'MARS',
    nextHash: '#mars',
    surfaceStrip: null
  },
  {
    index: 4,
    id: 'mars',
    planetKey: 'mars',
    name: 'MARS',
    microLabel: '04 / RED PLANET',
    accent: '#E2673A',
    nextPlanet: 'JUPITER',
    nextHash: '#jupiter',
    surfaceStrip: {
      name: 'VALLES MARINERIS',
      coords: '14.0° S, 59.2° W',
      image: '/assets/planets/mars/mars.jpg'
    }
  },
  {
    index: 5,
    id: 'jupiter',
    planetKey: 'jupiter',
    name: 'JUPITER',
    microLabel: '05 / GAS GIANT',
    accent: '#D9A066',
    nextPlanet: 'SATURN',
    nextHash: '#saturn',
    surfaceStrip: null
  },
  {
    index: 6,
    id: 'saturn',
    planetKey: 'saturn',
    name: 'SATURN',
    microLabel: '06 / RINGED MONARCH',
    accent: '#F5B942',
    nextPlanet: 'URANUS',
    nextHash: '#uranus',
    surfaceStrip: null
  },
  {
    index: 7,
    id: 'uranus',
    planetKey: 'uranus',
    name: 'URANUS',
    microLabel: '07 / ICE GIANT',
    accent: '#8EE5D8',
    nextPlanet: 'NEPTUNE',
    nextHash: '#neptune',
    surfaceStrip: null
  },
  {
    index: 8,
    id: 'neptune',
    planetKey: 'neptune',
    name: 'NEPTUNE',
    microLabel: '08 / AZURE PERIMETER',
    accent: '#5B8CFF',
    nextPlanet: 'DYNAMICS',
    nextHash: '#dynamics',
    surfaceStrip: null
  }
];

export function computeChapterStats(chapter) {
  const p = PLANETS_CONFIG[chapter.planetKey] || {};

  // 1. Distance from Sun (AU and M km)
  let distanceAU = p.semiMajorAxisAU || 0;
  let distanceMkm = (distanceAU * AU_IN_KM / 1e6);
  let distStr = distanceAU > 0 ? `${distanceAU.toFixed(3)} AU` : '0.00 AU';
  let distSub = distanceAU > 0 ? `${distanceMkm.toFixed(1)}M KM` : 'CENTER';

  // 2. Light-time from Sun: distance / c
  let lightTimeSec = (distanceAU * AU_IN_KM) / SPEED_OF_LIGHT_KM_S;
  let lightTimeStr = '0.00 S';
  if (lightTimeSec >= 60) {
    const mins = Math.floor(lightTimeSec / 60);
    const secs = Math.floor(lightTimeSec % 60);
    lightTimeStr = `${mins}M ${secs}S`;
  } else if (lightTimeSec > 0) {
    lightTimeStr = `${lightTimeSec.toFixed(1)}S`;
  }

  // 3. Length of year / orbital period
  let yearStr = 'N/A';
  let days = p.orbitalPeriodDays || 0;
  if (days > 0) {
    if (days >= 500) {
      yearStr = `${(days / 365.25).toFixed(2)} YRS`;
    } else {
      yearStr = `${days.toFixed(1)} DAYS`;
    }
  }

  // 4. Mean Diameter in km
  let diameterKm = p.radiusKm ? `${(p.radiusKm * 2).toLocaleString()} KM` : 'N/A';

  // 5. Length of Day / Rotation
  let rotationHours = Math.abs(p.rotationPeriodHours || 24);
  let dayLengthStr = rotationHours >= 48 ? `${(rotationHours / 24).toFixed(1)} DAYS` : `${rotationHours.toFixed(1)} HRS`;

  // Planet Type
  let typeStr = 'TERRESTRIAL';
  if (['jupiter', 'saturn'].includes(chapter.planetKey)) typeStr = 'GAS GIANT';
  else if (['uranus', 'neptune'].includes(chapter.planetKey)) typeStr = 'ICE GIANT';

  return {
    distStr,
    distSub,
    lightTimeStr,
    yearStr,
    diameterKm,
    dayLengthStr,
    typeStr,
    description: p.description || ''
  };
}

export function ChapterOverlay({ chapter, onNext }) {
  const stats = computeChapterStats(chapter);
  const pagerIndexStr = `0${chapter.index} / 08`;

  return (
    <div className="sticky top-0 w-full h-screen flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-16 md:pt-24 pb-4 md:pb-8 select-none pointer-events-none">
      {/* Surface Texture Magnified Strip (Mercury & Mars) - 14vw slice on left edge */}
      {chapter.surfaceStrip && (
        <div
          className="hidden xl:flex absolute border border-space-14 flex-col justify-between overflow-hidden bg-[#080B10]/80 pointer-events-auto z-20"
          style={{
            left: '48px',
            top: '26%',
            width: '14vw',
            maxWidth: '200px',
            height: '280px'
          }}
        >
          <div
            className="w-full h-full bg-cover bg-center filter contrast-125 brightness-90 transition-transform duration-700 hover:scale-110"
            style={{ backgroundImage: `url(${chapter.surfaceStrip.image})` }}
          />
          {/* 1px bracket and coordinates readout */}
          <div className="absolute inset-0 border border-space-25 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-[#030508]/90 backdrop-blur-sm border-t border-space-14 text-left">
            <div className="font-mono text-[9px] text-[#E9EDF2] uppercase tracking-wider">
              {chapter.surfaceStrip.name}
            </div>
            <div className="font-mono text-[8px] text-[#929BA8] mt-0.5">
              {chapter.surfaceStrip.coords}
            </div>
          </div>
        </div>
      )}

      {/* Main Chapter Content: Left Column (Cols 2-5) */}
      <div className="flex-1 flex flex-col justify-start md:justify-center max-w-xl z-20 pointer-events-auto pl-0 xl:pl-56 mt-4 md:mt-0">
        {/* Micro-label with 2x14px vertical accent bar */}
        <div className="flex items-center space-x-3 mb-3">
          <span
            className="inline-block w-[2px] h-[14px]"
            style={{ backgroundColor: chapter.accent }}
          />
          <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-[#929BA8]">
            {chapter.microLabel}
          </span>
        </div>

        {/* Planet Name in Cormorant Garamond, uppercase */}
        <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal uppercase tracking-[0.12em] text-[#E9EDF2] leading-tight">
          {chapter.name}
        </h2>

        {/* 2-Sentence Scientific Description */}
        <p className="font-sans text-[14px] sm:text-[15px] leading-[1.6] text-[#929BA8] max-w-[34ch] mt-4">
          {stats.description}
        </p>

        {/* 1px accent-coloured rule */}
        <div
          className="w-16 h-[1px] my-5"
          style={{ backgroundColor: chapter.accent }}
        />

        {/* Plain text link: EXPLORE IN SIMULATOR > */}
        <div>
          <a
            href={`#/sim/${chapter.planetKey}`}
            className="inline-flex items-center space-x-2 font-sans text-xs tracking-[0.2em] uppercase text-[#E9EDF2] opacity-80 hover:opacity-100 hover:text-[#7AD1FF] transition-all border-b border-transparent hover:border-[#7AD1FF]/40 pb-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7AD1FF]"
          >
            <span>EXPLORE {chapter.name} IN SIMULATOR</span>
            <span className="ml-1 text-[11px]">&gt;</span>
          </a>
        </div>
      </div>

      {/* Right-edge Pager: 0X / 08 and NEXT: <PLANET> with 1px chevron */}
      <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 flex flex-col items-end z-20 pointer-events-auto">
        <div className="font-mono text-xs sm:text-sm tracking-widest text-[#929BA8] mb-4">
          {pagerIndexStr}
        </div>
        {chapter.nextPlanet && (
          <button
            onClick={() => onNext && onNext(chapter.nextHash)}
            className="group flex items-center space-x-2 text-right cursor-pointer focus:outline-none"
          >
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#929BA8]/70 group-hover:text-[#E9EDF2] transition-colors">
              NEXT: {chapter.nextPlanet}
            </span>
            <span className="text-[#929BA8]/70 group-hover:text-[#E9EDF2] transition-colors font-mono text-xs">
              &gt;
            </span>
          </button>
        )}
      </div>

      {/* Bottom 5-Column SpaceX-style Aerospace Telemetry Strip separated by 1px hairlines */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-space-14 pt-4 pb-2 z-20 pointer-events-auto bg-[#030508]/80 backdrop-blur-md">
        {/* Col 1: Distance from Sun */}
        <div className="pr-4 border-r border-space-14 mb-3 sm:mb-0">
          <div className="font-sans text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#929BA8]">
            DISTANCE FROM SUN
          </div>
          <div
            className="font-mono text-base sm:text-xl font-light mt-1"
            style={{ color: chapter.accent }}
          >
            {stats.distSub}
          </div>
          <div className="font-mono text-[9px] text-[#929BA8]/70 mt-0.5">
            {stats.distStr}
          </div>
        </div>

        {/* Col 2: Light-Time from Sun */}
        <div className="px-4 border-r border-space-14 mb-3 sm:mb-0">
          <div className="font-sans text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#929BA8]">
            SOLAR LIGHT-TIME
          </div>
          <div
            className="font-mono text-base sm:text-xl font-light mt-1"
            style={{ color: chapter.accent }}
          >
            {stats.lightTimeStr}
          </div>
          <div className="font-mono text-[9px] text-[#929BA8]/70 mt-0.5">
            ONE-WAY RELAY
          </div>
        </div>

        {/* Col 3: Mean Diameter */}
        <div className="px-0 sm:px-4 lg:border-r border-space-14 mb-3 sm:mb-0">
          <div className="font-sans text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#929BA8]">
            MEAN DIAMETER
          </div>
          <div
            className="font-mono text-base sm:text-xl font-light mt-1"
            style={{ color: chapter.accent }}
          >
            {stats.diameterKm}
          </div>
          <div className="font-mono text-[9px] text-[#929BA8]/70 mt-0.5">
            EQUATORIAL
          </div>
        </div>

        {/* Col 4: Length of year */}
        <div className="pr-4 sm:px-4 border-r border-space-14">
          <div className="font-sans text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#929BA8]">
            ORBITAL PERIOD
          </div>
          <div
            className="font-mono text-base sm:text-xl font-light mt-1"
            style={{ color: chapter.accent }}
          >
            {stats.yearStr}
          </div>
          <div className="font-mono text-[9px] text-[#929BA8]/70 mt-0.5">
            DAY: {stats.dayLengthStr}
          </div>
        </div>

        {/* Col 5: Classification */}
        <div className="pl-4">
          <div className="font-sans text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#929BA8]">
            CLASSIFICATION
          </div>
          <div
            className="font-mono text-base sm:text-xl font-light uppercase mt-1 truncate"
            style={{ color: chapter.accent }}
          >
            {stats.typeStr}
          </div>
          <div className="font-mono text-[9px] text-[#929BA8]/70 mt-0.5">
            SOLAR ORBITER
          </div>
        </div>
      </div>
    </div>
  );
}
