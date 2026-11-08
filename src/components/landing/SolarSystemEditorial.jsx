import React from 'react';
import { PLANETS_CONFIG } from '../../data/planetsData';

const ORDERED_PLANETS = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune'
];

export function SolarSystemEditorial({ onSelectPlanet }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-16 flex flex-col justify-center select-none pointer-events-auto">
      {/* Section Header */}
      <div className="mb-12 border-b border-space-14 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7AD1FF]" />
          <span className="font-sans text-[11px] uppercase tracking-[0.45em] text-[#929BA8]">
            SECTION 02 // ARCHITECTURE
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between">
          <h2 className="font-serif text-4xl sm:text-6xl uppercase tracking-[0.08em] text-[#E9EDF2] leading-tight">
            THE SOLAR SYSTEM
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#929BA8] max-w-md mt-4 md:mt-0 leading-relaxed">
            Eight unique planetary worlds bound to our central star. Displayed in sequence from the scorched inner basin to the frozen methane winds of the outer perimeter.
          </p>
        </div>
      </div>

      {/* 8 Planets Editorial Horizontal Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-6">
        {ORDERED_PLANETS.map((key, index) => {
          const p = PLANETS_CONFIG[key] || {};
          const numStr = `0${index + 1}`;
          const diameterKm = (p.radiusKm * 2).toLocaleString();

          return (
            <a
              key={key}
              href={`#/sim/${key}`}
              onClick={(e) => {
                if (onSelectPlanet) {
                  e.preventDefault();
                  onSelectPlanet(key);
                }
              }}
              className="group relative flex flex-col justify-between p-4 bg-[#080B10]/70 hover:bg-[#10151C] border border-space-14 hover:border-[#7AD1FF]/60 transition-all duration-300 rounded-sm cursor-pointer shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            >
              {/* Top: Index & Category */}
              <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-[#929BA8]/70">
                <span>{numStr}</span>
                <span className="uppercase text-[8px] tracking-wider truncate max-w-[60px]">
                  {key === 'jupiter' || key === 'saturn' ? 'GAS' : key === 'uranus' || key === 'neptune' ? 'ICE' : 'ROCK'}
                </span>
              </div>

              {/* Planet Circular Imagery */}
              <div className="relative w-full aspect-square my-2 flex items-center justify-center overflow-hidden">
                <img
                  src={p.texture || `/assets/planets/${key}/${key}.jpg`}
                  alt={p.name}
                  className="w-4/5 h-4/5 object-cover rounded-full filter contrast-110 brightness-95 group-hover:scale-115 group-hover:brightness-110 transition-transform duration-500 shadow-md"
                  loading="lazy"
                />
              </div>

              {/* Bottom: Name & Key Parameters */}
              <div className="mt-3 border-t border-space-14 pt-2">
                <h3 className="font-serif text-lg font-light uppercase tracking-wider text-[#E9EDF2] group-hover:text-[#7AD1FF] transition-colors">
                  {p.name}
                </h3>
                <div className="font-mono text-[9px] text-[#929BA8] mt-1 space-y-0.5">
                  <div className="truncate">Ø {diameterKm} KM</div>
                  <div className="truncate">{p.orbitalPeriodDays} D</div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] font-sans tracking-widest text-[#7AD1FF] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>EXPLORE</span>
                  <span>&gt;</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Some Numbers / System Metrics (Inspired by NASA & Aerospace Telemetry) */}
      <div className="mt-12 pt-8 border-t border-space-14">
        <div className="flex items-center space-x-3 mb-6">
          <span className="inline-block w-[3px] h-[14px] bg-[#7AD1FF] rounded-full shadow-[0_0_8px_#7AD1FF]" />
          <h4 className="font-mono text-xs uppercase tracking-[0.35em] text-[#E9EDF2]">
            SYSTEM CENSUS // SOME NUMBERS
          </h4>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Major & Dwarf Planets */}
          <div className="bg-[#080B10]/80 border border-space-14 hover:border-[#7AD1FF]/40 transition-colors p-4 rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#929BA8] mb-2">
              <span className="font-sans text-[10px] uppercase tracking-wider">Planets / Dwarf</span>
              <span className="text-[#7AD1FF] font-mono text-xs">☉</span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-light text-[#E9EDF2] tracking-wider">
              8 <span className="text-[#7AD1FF] text-xl font-thin">|</span> 5
            </div>
            <div className="font-mono text-[9px] text-[#929BA8] mt-2 tracking-wide">
              Major Worlds & Recognized Dwarfs
            </div>
          </div>

          {/* Card 2: Moons */}
          <div className="bg-[#080B10]/80 border border-space-14 hover:border-[#7AD1FF]/40 transition-colors p-4 rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#929BA8] mb-2">
              <span className="font-sans text-[10px] uppercase tracking-wider">Natural Satellites</span>
              <span className="text-[#7AD1FF] font-mono text-xs">☾</span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-light text-[#E9EDF2] tracking-wider">
              200<span className="text-[#7AD1FF] text-xl">+</span>
            </div>
            <div className="font-mono text-[9px] text-[#929BA8] mt-2 tracking-wide">
              Planetary Moons Confirmed
            </div>
          </div>

          {/* Card 3: Comets */}
          <div className="bg-[#080B10]/80 border border-space-14 hover:border-[#7AD1FF]/40 transition-colors p-4 rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#929BA8] mb-2">
              <span className="font-sans text-[10px] uppercase tracking-wider">Comets</span>
              <span className="text-[#7AD1FF] font-mono text-xs">☄</span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-light text-[#E9EDF2] tracking-wider">
              3,720
            </div>
            <div className="font-mono text-[9px] text-[#929BA8] mt-2 tracking-wide">
              Icy Relics Catalogued by NASA
            </div>
          </div>

          {/* Card 4: Asteroids */}
          <div className="bg-[#080B10]/80 border border-space-14 hover:border-[#7AD1FF]/40 transition-colors p-4 rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#929BA8] mb-2">
              <span className="font-sans text-[10px] uppercase tracking-wider">Asteroids Tracked</span>
              <span className="text-[#7AD1FF] font-mono text-xs">✦</span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-light text-[#E9EDF2] tracking-wider">
              1,071,827
            </div>
            <div className="font-mono text-[9px] text-[#929BA8] mt-2 tracking-wide">
              Rocky Fragments in Orbital Survey
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Scale Note */}
      <div className="mt-8 text-center font-mono text-[10px] text-[#929BA8]/60 tracking-wider">
        * ASTROPHYSICAL PARAMETERS DISPLAYED AT CALIBRATED VISUAL SCALE FOR OBSERVATIONAL CLARITY
      </div>
    </div>
  );
}
