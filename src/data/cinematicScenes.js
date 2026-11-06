// 12-Scene Cinematic Sequence Script & Path Specifications
// Directed by IMAX Space Cinematography principles:
// Deliberate pacing, scale progression, foreground/background parallax, dramatic lighting angles.

export const CINEMATIC_SCENES = [
  {
    id: 'void',
    number: '01',
    title: 'THE VOID',
    subtitle: 'Deep Space Horizon',
    duration: 11.0, // seconds
    cameraStart: [0, 4, 380],
    cameraEnd: [0, 1.5, 260],
    targetStart: [0, 0, 0],
    targetEnd: [0, 0, 0],
    fov: 42,
    narration: 'Before the light, there was only the cosmic silence—an endless vacuum spanning billions of kilometers.',
    focusBody: 'void'
  },
  {
    id: 'sun',
    number: '02',
    title: 'THE SUN',
    subtitle: 'Sol: 1.989 × 10³⁰ kg G-Type Main-Sequence Star',
    duration: 14.0,
    cameraStart: [0, 22, 120],
    cameraEnd: [0, 6, 26],
    targetStart: [0, 0, 0],
    targetEnd: [0, 0, 0],
    fov: 48,
    narration: 'At the gravitational center lies the Sun—a colossal fusion furnace generating heat and solar wind that sculpts the entire planetary system.',
    focusBody: 'sun'
  },
  {
    id: 'mercury',
    number: '03',
    title: 'MERCURY',
    subtitle: 'Innermost Desolate Scorched World',
    duration: 12.0,
    // Close orbital flyby
    cameraStartOffset: [2.8, 1.4, 4.2],
    cameraEndOffset: [-2.1, 0.6, 2.9],
    fov: 38,
    narration: 'Emerging from the sunlit glare: Mercury. Airless, heavily cratered, enduring extreme temperature swings from 430°C to -180°C.',
    focusBody: 'mercury'
  },
  {
    id: 'venus',
    number: '04',
    title: 'VENUS',
    subtitle: 'Dense Supercritical Greenhouse Atmosphere',
    duration: 13.0,
    cameraStartOffset: [5.2, 2.0, 5.8],
    cameraEndOffset: [2.4, 0.5, 3.6],
    fov: 36,
    narration: 'Shrouded under permanent sulfuric acid clouds, Venus is a runaway greenhouse world with surface pressures equal to 900 meters ocean depth.',
    focusBody: 'venus'
  },
  {
    id: 'earth',
    number: '05',
    title: 'EARTH & THE MOON',
    subtitle: 'The Pale Blue Oasis of Life',
    duration: 16.0,
    cameraStartOffset: [4.8, 1.8, 6.2],
    cameraEndOffset: [2.2, 0.4, 3.4],
    fov: 34,
    narration: 'Earth: oceans covering 71% of the surface, swirling weather systems, and the protective glow of an oxygen-nitrogen atmosphere, bound to its tidally locked Moon.',
    focusBody: 'earth'
  },
  {
    id: 'mars',
    number: '06',
    title: 'MARS',
    subtitle: 'The Rusty Canyons of the Red Planet',
    duration: 13.0,
    cameraStartOffset: [4.0, 1.2, 4.8],
    cameraEndOffset: [1.6, 0.3, 2.8],
    fov: 36,
    narration: 'The Red Planet: towering volcanoes like Olympus Mons and vast rift valleys like Valles Marineris carved into oxidized basaltic iron sands.',
    focusBody: 'mars'
  },
  {
    id: 'asteroids',
    number: '07',
    title: 'THE ASTEROID BELT',
    subtitle: 'Remnants of the Protoplanetary Disk & Dwarf Planet Ceres',
    duration: 14.0,
    cameraStart: [42, 6, 24],
    cameraEnd: [54, 2, 40],
    targetStart: [48, 0, 32],
    targetEnd: [58, 0, 46],
    fov: 46,
    narration: 'Spanning between Mars and Jupiter lies the Asteroid Belt—millions of primordial rocky fragments kept from accreting into a planet by Jovian gravity.',
    focusBody: 'asteroids'
  },
  {
    id: 'jupiter',
    number: '08',
    title: 'JUPITER & GALILEAN MOONS',
    subtitle: 'The Colossal Gas Giant: King of Planets',
    duration: 16.0,
    cameraStartOffset: [18.0, 5.5, 24.0],
    cameraEndOffset: [9.5, 1.8, 14.5],
    fov: 42,
    narration: 'More massive than all other planets combined: Jupiter, featuring centuries-old storm vortices including the Great Red Spot and an immense magnetosphere.',
    focusBody: 'jupiter'
  },
  {
    id: 'saturn',
    number: '09',
    title: 'SATURN & THE CASSINI DIVISION',
    subtitle: 'The Jewel of the Solar System',
    duration: 16.0,
    cameraStartOffset: [16.0, 9.0, 22.0],
    cameraEndOffset: [8.5, 3.2, 12.8],
    fov: 38,
    narration: 'Saturn: adorned by billions of individual ice and rock particles spanning 282,000 kilometers across yet only tens of meters thick, divided by the Cassini gap.',
    focusBody: 'saturn'
  },
  {
    id: 'uranus',
    number: '10',
    title: 'URANUS',
    subtitle: 'The Tilted Cyan Ice Giant',
    duration: 12.0,
    cameraStartOffset: [11.0, 4.2, 14.0],
    cameraEndOffset: [6.2, 1.5, 8.8],
    fov: 36,
    narration: 'Rolling along its orbital plane at a 97.8-degree axial tilt: Uranus, a frigid ice giant rich in water, ammonia, and methane giving its pale cyan hue.',
    focusBody: 'uranus'
  },
  {
    id: 'neptune',
    number: '11',
    title: 'NEPTUNE',
    subtitle: 'Windswept Outer Sentinel',
    duration: 13.0,
    cameraStartOffset: [11.5, 3.8, 14.2],
    cameraEndOffset: [6.4, 1.2, 8.9],
    fov: 36,
    narration: 'Over 4.5 billion kilometers from the Sun: Neptune, swept by supersonic winds exceeding 2,100 km/h in deep oceanic blue obscurity.',
    focusBody: 'neptune'
  },
  {
    id: 'finale',
    number: '12',
    title: 'THE GRAND FINALE',
    subtitle: 'The Sol System in Monumental Isolation',
    duration: 16.0,
    cameraStart: [0, 40, 90],
    cameraEnd: [0, 160, 260],
    targetStart: [0, 0, 0],
    targetEnd: [0, 0, 0],
    fov: 52,
    narration: 'An island of gravitation and light amidst the immense interstellar dark: our cosmic home.',
    focusBody: 'overview'
  }
];

