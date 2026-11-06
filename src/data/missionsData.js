// TERRAFORGE 2.0 — Aerospace Mission Control Telemetry Catalog
// Telemetry and trajectories derived from NASA JPL Horizons and NASA Mission Operations

export const MISSIONS_DATA = [
  {
    id: 'artemis',
    name: 'Artemis II',
    agency: 'NASA / ESA / CSA',
    type: 'Crewed Lunar Flyby',
    status: 'ACTIVE_PREPARATION',
    statusColor: '#38bdf8',
    targetBody: 'moon',
    launchDate: 'September 2025',
    destination: 'Lunar Free-Return Trajectory',
    distanceFromEarthKm: 384400,
    velocityKmS: 1.45,
    altitudeKm: 7400,
    missionPhase: 'Translunar Injection Simulation',
    description: 'First crewed mission of NASA Artemis campaign sending four astronauts around the Moon aboard the Orion spacecraft atop SLS Block 1.',
    telemetry: {
      apogeeKm: 385000,
      perigeeKm: 185,
      inclinationDeg: 28.5,
      crewCapacity: 4,
      communicationDelaySec: 1.28
    },
    timeline: [
      { event: 'SLS Liftoff & Trans-Lunar Injection (TLI)', status: 'SCHEDULED' },
      { event: 'Outbound Lunar Flyby at 7,400 km altitude', status: 'SCHEDULED' },
      { event: 'Earth Atmospheric Entry & Pacific Splashdown', status: 'SCHEDULED' }
    ]
  },
  {
    id: 'perseverance',
    name: 'Mars 2020 Perseverance',
    agency: 'NASA JPL',
    type: 'Surface Astrobiology Rover',
    status: 'OPERATIONAL',
    statusColor: '#22c55e',
    targetBody: 'mars',
    launchDate: 'July 30, 2020',
    landingDate: 'February 18, 2021',
    destination: 'Jezero Crater, Mars (18.38° N, 77.58° E)',
    distanceFromEarthKm: 225400000,
    velocityKmS: 0.00042, // Driving speed ~152 m/h
    sol: 1320,
    missionPhase: 'Delta Front Sample Deposition Campaign',
    description: 'Seeking signs of ancient microbial biosignatures, collecting core rock samples for Mars Sample Return (MSR), and testing MOXIE oxygen generation.',
    telemetry: {
      distanceTraveledKm: 31.84,
      samplesCollected: 24,
      moxieOxygenGrams: 122,
      communicationDelaySec: 752 // ~12.5 minutes
    },
    timeline: [
      { event: 'Entry, Descent, and Landing (Sky Crane)', status: 'COMPLETED' },
      { event: 'Ingenuity Helicopter 72 Historic Flights', status: 'COMPLETED' },
      { event: 'Upper Fan Sample Caching Campaign', status: 'ACTIVE' }
    ]
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    agency: 'NASA / ESA / CSA',
    type: 'Infrared Space Observatory',
    status: 'OPERATIONAL',
    statusColor: '#eab308',
    targetBody: 'earth',
    launchDate: 'December 25, 2021',
    destination: 'Sun-Earth Lagrange Point 2 (L2)',
    distanceFromEarthKm: 1500000,
    velocityKmS: 0.202,
    haloOrbitPeriodDays: 180,
    missionPhase: 'Cycle 3 General Observer Science Operations',
    description: 'Premier space observatory observing the earliest galaxies formed after the Big Bang, stellar nurseries, and transiting exoplanet atmospheres in infrared.',
    telemetry: {
      primaryMirrorDiameterM: 6.5,
      sunshieldDimensionsM: '21.2 × 14.2',
      coldSideTempK: 37, // MIRI cooled to 6.4 K via cryocooler
      communicationDelaySec: 5.0
    },
    timeline: [
      { event: 'Ariane 5 Launch & Solar Array Deployment', status: 'COMPLETED' },
      { event: 'Sunshield Tensioning & Mirror Alignment', status: 'COMPLETED' },
      { event: 'First Deep Field Science Release', status: 'COMPLETED' },
      { event: 'Exoplanet Atmospheric Transmission Spectra', status: 'ACTIVE' }
    ]
  },
  {
    id: 'voyager1',
    name: 'Voyager 1',
    agency: 'NASA JPL',
    type: 'Interstellar Probe',
    status: 'OPERATIONAL',
    statusColor: '#a855f7',
    targetBody: 'sun',
    launchDate: 'September 5, 1977',
    destination: 'Interstellar Space (Ophiuchus Constellation)',
    distanceFromEarthKm: 24450000000, // ~163.4 AU
    distanceAU: 163.44,
    velocityKmS: 16.999, // ~3.6 AU/year
    missionPhase: 'Voyager Interstellar Mission (VIM)',
    description: 'The most distant human-made object in history, actively sampling interstellar plasma beyond the solar heliopause with its RTG power supply.',
    telemetry: {
      roundTripSignalHours: 45.4, // Light travel time > 22.7 hours each way
      rtgPowerWatts: 220,
      instrumentsOperating: 4,
      interstellarPlasmaDensityCm3: 0.08
    },
    timeline: [
      { event: 'Jupiter Flyby & Io Volcanism Discovery (1979)', status: 'COMPLETED' },
      { event: 'Saturn & Titan Flyby (1980)', status: 'COMPLETED' },
      { event: 'Crossed the Solar Heliopause into Interstellar Space (2012)', status: 'COMPLETED' },
      { event: 'Interstellar Cosmic Ray Monitoring', status: 'ACTIVE' }
    ]
  }
];

