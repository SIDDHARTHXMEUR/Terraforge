import React from 'react';
import { PLANETS_CONFIG } from '../../data/planetsData';

const SPEED_OF_LIGHT_KM_S = 299792.458;
const AU_IN_KM = 149597870.7;

export const CHAPTERS_DATA = [
  {
    index: 2,
    id: 'sol',
    planetKey: 'sun',
    name: 'SOL',
    microLabel: '01 / HOST STAR',
    accent: '#FFB347',
    nextPlanet: 'MERCURY',
    nextHash: '#mercury',
    surfaceStrip: null
  },
  {
    index: 3,
    id: 'mercury',
    planetKey: 'mercury',
    name: 'MERCURY',
    microLabel: '02 / INNER SYSTEM',
    accent: '#B8B2A7',
    nextPlanet: 'EARTH',
    nextHash: '#earth',
    surfaceStrip: {
      name: 'CALORIS BASIN',
      coords: '30.5° N, 189.8° W',
      image: '/assets/planets/mercury/mercury.jpg'
    }
  },
  {
    index: 4,
    id: 'earth',
    planetKey: 'earth',
    name: 'EARTH',
    microLabel: '03 / HABITABLE WORLD',
    accent: '#5BB8FF',
    nextPlanet: 'MARS',
    nextHash: '#mars',
    surfaceStrip: null
  },
  {
    index: 5,
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
    index: 6,
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
    index: 7,
    id: 'saturn',
    planetKey: 'saturn',
    name: 'SATURN',
    microLabel: '06 / RINGED MONARCH',
    accent: '#E8D08A',
    nextPlanet: 'LINEUP',
    nextHash: '#lineup',
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

  // 3. Length of year
  let yearStr = 'N/A';
  let days = p.orbitalPeriodDays || 0;
  if (days > 0) {
    if (days >= 500) {
      yearStr = `${(days / 365.25).toFixed(2)} YRS`;
    } else {
      yearStr = `${days.toFixed(1)} DAYS`;
    }
  } else {
    yearStr = 'HOST STAR';
  }

  // 4. Planet type
  let typeStr = 'TERRESTRIAL';
  if (chapter.planetKey === 'sun') typeStr = 'YELLOW DWARF';
  else if (['jupiter', 'saturn'].includes(chapter.planetKey)) typeStr = 'GAS GIANT';
  else if (['uranus', 'neptune'].includes(chapter.planetKey)) typeStr = 'ICE GIANT';

  return {
    distStr,
    distSub,
    lightTimeStr,
    yearStr,
    typeStr,
    description: p.description || ''
  };
}

export function ChapterOverlay({ chapter, onNext }) {
  const stats = computeChapterStats(chapter);
  const pagerIndexStr = `0${chapter.index} / 09`;

  return (
    <div className="sticky top-0 w-full h-screen flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-16 md:pt-24 pb-4 md:pb-8 select-none pointer-events-none">
      {/* Surface Texture Magnified Strip (Mercury & Mars) - 14vw slice on left edge */}
      {chapter.surfaceStrip && (
        <div
          className="hidden xl:flex absolute border border-cream-14 flex-col justify-between overflow-hidden bg-black/60 pointer-events-auto z-20"
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
          <div className="absolute inset-0 border border-cream-30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/85 backdrop-blur-sm border-t border-cream-14 text-left">
            <div className="font-mono text-[9px] text-cream uppercase tracking-wider">
              {chapter.surfaceStrip.name}
            </div>
            <div className="font-mono text-[8px] text-cream-60 mt-0.5">
              {chapter.surfaceStrip.coords}
            </div>
          </div>
        </div>
      )}

      {/* Main Chapter Content: Left Column (Cols 2-5) */}
      <div className="flex-1 flex flex-col justify-center max-w-xl z-20 pointer-events-auto pl-0 xl:pl-56">
        {/* Micro-label with 2x14px vertical accent bar */}
        <div className="flex items-center space-x-3 mb-3">
          <span
            className="inline-block w-[2px] h-[14px]"
            style={{ backgroundColor: chapter.accent }}
          />
          <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-cream-60">
            {chapter.microLabel}
          </span>
        </div>

        {/* Planet Name in Cormorant Garamond, uppercase, tracking 0.12em */}
        <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal uppercase tracking-[0.12em] text-cream leading-tight">
          {chapter.name}
        </h2>

        {/* 2-Sentence Scientific Description (max 34 chars wide, line-height 1.6) */}
        <p className="font-sans text-[15px] sm:text-[16px] leading-[1.6] text-cream-85 max-w-[34ch] mt-4">
          {stats.description}
        </p>

        {/* 1px accent-coloured rule */}
        <div
          className="w-16 h-[1px] my-6"
          style={{ backgroundColor: chapter.accent }}
        />

        {/* Plain text link: EXPLORE <PLANET> > */}
        <div>
          <a
            href={`#/sim/${chapter.planetKey === 'sun' ? 'overview' : chapter.planetKey}`}
            className="inline-flex items-center space-x-2 font-sans text-xs tracking-[0.2em] uppercase text-cream opacity-80 hover:opacity-100 transition-opacity border-b border-transparent hover:border-cream-30 pb-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
          >
            <span>EXPLORE {chapter.name}</span>
            <span className="ml-1 text-[11px]">&gt;</span>
          </a>
        </div>
      </div>

      {/* Right-edge Pager: 0X / 09 and NEXT: <PLANET> with 1px chevron */}
      <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 flex flex-col items-end z-20 pointer-events-auto">
        <div className="font-mono text-xs sm:text-sm tracking-widest text-cream-60 mb-4">
          {pagerIndexStr}
        </div>
        {chapter.nextPlanet && (
          <button
            onClick={() => onNext && onNext(chapter.nextHash)}
            className="group flex items-center space-x-2 text-right cursor-pointer focus:outline-none"
          >
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream-40 group-hover:text-cream transition-colors">
              NEXT: {chapter.nextPlanet}
            </span>
            <span className="text-cream-40 group-hover:text-cream transition-colors font-mono text-xs">
              &gt;
            </span>
          </button>
        )}
      </div>

      {/* Bottom 4-Column Stats Strip separated by 1px hairlines at 14% white */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 border-t border-cream-14 pt-4 pb-2 z-20 pointer-events-auto bg-black/40 backdrop-blur-sm">
        {/* Col 1: Distance from Sun */}
        <div className="pr-4 md:border-r border-cream-14 mb-3 md:mb-0">
          <div
            className="font-mono text-lg sm:text-xl lg:text-2xl font-light"
            style={{ color: chapter.accent }}
          >
            {stats.distStr}
          </div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream-60 mt-1">
            DIST FROM SUN ({stats.distSub})
          </div>
        </div>

        {/* Col 2: Light-time from Sun */}
        <div className="px-0 md:px-4 md:border-r border-cream-14 mb-3 md:mb-0">
          <div
            className="font-mono text-lg sm:text-xl lg:text-2xl font-light"
            style={{ color: chapter.accent }}
          >
            {stats.lightTimeStr}
          </div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream-60 mt-1">
            LIGHT TIME (D / C)
          </div>
        </div>

        {/* Col 3: Length of year */}
        <div className="pr-4 md:px-4 md:border-r border-cream-14">
          <div
            className="font-mono text-lg sm:text-xl lg:text-2xl font-light"
            style={{ color: chapter.accent }}
          >
            {stats.yearStr}
          </div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream-60 mt-1">
            LENGTH OF YEAR
          </div>
        </div>

        {/* Col 4: Planet type */}
        <div className="px-0 md:pl-4">
          <div
            className="font-mono text-lg sm:text-xl lg:text-2xl font-light uppercase"
            style={{ color: chapter.accent }}
          >
            {stats.typeStr}
          </div>
          <div className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream-60 mt-1">
            PLANET TYPE
          </div>
        </div>
      </div>
    </div>
  );
}
