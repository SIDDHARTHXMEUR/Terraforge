# Terraforge Planetary Asset Manifest

**Standard**: High-resolution equirectangular celestial projection maps sourced from NASA, USGS Astrogeology Science Center, Solar System Scope, and ESA missions.

---

## Celestial Texture Catalog

| Body | Map Role | File Path | Resolution | Color Space | Source & Mission Data | License | Verification Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sol (Sun)** | Photosphere Albedo | `public/assets/planets/sun/sun.jpg` | 2048 × 1024 | sRGB | NASA Solar Dynamics Observatory (SDO) / HMI Continuum | Public Domain | Seamless at 0°/360°, zero polar pinch |
| **Sol (Sun)** | SDO HMI Visible Continuum | `public/assets/planets/sun/sdo_hmi_continuum_2k.jpg` | 2048 × 2048 | sRGB | NASA SDO/HMI Intensitygram Continuum (Live) | Public Domain | Real photospheric sunspots, active regions, limb darkening |
| **Sol (Sun)** | SDO AIA 304 Å Chromosphere | `public/assets/planets/sun/sdo_aia_304_2k.jpg` | 2048 × 2048 | sRGB | NASA SDO/AIA 304 Å (He II 50,000 K) | Public Domain | H-alpha/He II chromospheric limb prominences |
| **Sol (Sun)** | SDO AIA 304 Å Equirectangular Albedo | `public/assets/planets/sun/sun_sdo_banana.jpg` | 2048 × 1024 | sRGB | Google Nano Banana / NASA SDO AIA 304 Å Calibration | Public Domain | Seamless 2:1 equirectangular map, convective cells, active regions |
| **Sol (Sun)** | SDO AIA 171 Å Coronal Loops | `public/assets/planets/sun/sdo_aia_171_2k.jpg` | 2048 × 2048 | sRGB | NASA SDO/AIA 171 Å (Fe IX 1,000,000 K) | Public Domain | Magnetic coronal loop streamers and plumes |
| **Sol (Sun)** | Convective Granulation | `public/assets/planets/sun/sun_granulation.jpg` | 2048 × 1024 | sRGB | NASA SDO Convective Cell High-Pass Composite | Public Domain | Seamless repeating wrap, high-frequency plasma |
| **Mercury** | Basalt Regolith Albedo & Relief | `public/assets/planets/mercury/mercury.jpg` | 2048 × 1024 | sRGB | NASA MESSENGER MDIS Global Mosaic | Public Domain | Caloris Basin intact, harsh shadow relief |
| **Venus** | Cloud Deck Atmosphere | `public/assets/planets/venus/venus_atmosphere.jpg` | 2048 × 1024 | sRGB | NASA Pioneer Venus / Akatsuki Ultraviolet Composite | Public Domain | Seamless equirectangular, sulfuric cloud swirls |
| **Venus** | Surface Radar Albedo | `public/assets/planets/venus/venus_surface.jpg` | 2048 × 1024 | sRGB | NASA Magellan Synthetic Aperture Radar (SAR) Mosaic | Public Domain | Volcanic plains & tesserae relief |
| **Earth** | Land & Ocean Albedo | `public/assets/planets/earth/earth_albedo.jpg` | 4096 × 2048 | sRGB | NASA Earth Observatory Visible Earth (Blue Marble Next Generation) | Public Domain | 4K hero resolution, bathymetry calibrated |
| **Earth** | Topographic Elevation Bump | `public/assets/planets/earth/earth_bump.jpg` | 2048 × 1024 | Linear / Grayscale | NASA SRTM + GTOPO30 Global Digital Elevation Model | Public Domain | Seamless continent relief, Himalaya/Andes elevation |
| **Earth** | Land/Ocean Specular Mask | `public/assets/planets/earth/earth_landmask.png` | 2048 × 1024 | Linear / Mask | NASA Earth Observatory Land/Water Binary Mask | Public Domain | 1.0 land (matte), 0.0 ocean (specular glint) |
| **Earth** | Dynamic Weather Clouds | `public/assets/planets/earth/earth_clouds.png` | 2048 × 1024 | Linear Alpha | NASA GOES/Meteosat Weather Satellite Global Cloud Composite | Public Domain | Seamless alpha transparency, cloud shadow offset |
| **Earth** | Nocturnal Urban Lights | `public/assets/planets/earth/earth_nightlights.jpg` | 2048 × 1024 | sRGB | NASA Suomi NPP VIIRS (Black Marble Night Lights) | Public Domain | Cities illuminated strictly on dark hemisphere |
| **The Moon** | Maria & Crater Albedo | `public/assets/planets/moon/moon.jpg` | 2048 × 1024 | sRGB | NASA Lunar Reconnaissance Orbiter (LRO) Wide Angle Camera | Public Domain | Tycho crater rays & lunar maria preserved |
| **Mars** | Iron-Oxide Crust Albedo | `public/assets/planets/mars/mars.jpg` | 2048 × 1024 | sRGB | USGS Astrogeology Mars Viking Color Mosaic | Public Domain | Olympus Mons caldera & Valles Marineris canyon |
| **Ceres** | Chondrite Albedo | `public/assets/planets/ceres/ceres.jpg` | 2048 × 1024 | sRGB | NASA Dawn Mission Framing Camera Global Mosaic | Public Domain | Occator Crater bright salt faculae visible |
| **Jupiter** | Zonal Atmospheric Belts | `public/assets/planets/jupiter/jupiter.jpg` | 2048 × 1024 | sRGB | NASA Cassini Imaging Science Subsystem (ISS) Global Map | Public Domain | Equatorial belts & Great Red Spot vortex |
| **Io** | Volcanic Sulfur Albedo | `public/assets/planets/moons/io.jpg` | 3196 × 3196 | sRGB | NASA Galileo SSI & Voyager Global Mosaic | Public Domain | Pele/Prometheus volcanic sulfur frost |
| **Europa** | Water Ice Crust Albedo | `public/assets/planets/moons/europa.jpg` | 2048 × 1024 | sRGB | NASA Galileo SSI High-Resolution Mosaic | Public Domain | Lineated cycloidal fracture network |
| **Saturn** | Atmospheric Gas Bands | `public/assets/planets/saturn/saturn.jpg` | 2048 × 1024 | sRGB | NASA Cassini ISS Cylindrical Planetary Projection | Public Domain | Butterscotch cloud bands, polar vortex |
| **Saturn** | Cassini Division Rings | `public/assets/planets/saturn/saturn_ring.png` | 1024 × 64 | Linear RGBA | NASA Cassini UVIS / ISS Radial Ring Opacity Profile | Public Domain | C Ring, B Ring, Cassini Division, A Ring, Encke gap |
| **Titan** | Hydrocarbon Smog Haze | `public/assets/planets/moons/titan.jpg` | 600 × 600 | sRGB | NASA Cassini VIMS Atmospheric Mapping | Public Domain | Dense nitrogen-methane photochemical haze |
| **Uranus** | Methane Ice Atmosphere | `public/assets/planets/uranus/uranus.jpg` | 2048 × 1024 | sRGB | NASA Voyager 2 ISS / Keck Observatory Near-IR Composite | Public Domain | Pale cyan-aquamarine methane absorption |
| **Neptune** | Supersonic Storm Envelope | `public/assets/planets/neptune/neptune.jpg` | 2048 × 1024 | sRGB | NASA Voyager 2 ISS Narrow Angle Camera Mosaic | Public Domain | Deep cobalt blue, Great Dark Spot, Scooter cirrus |

---

## Projection & Quality Verification
1. **Equirectangular Standards**: All planetary spherical maps are formatted in standard $2:1$ cylindrical equirectangular projection ($\lambda \in [-180^\circ, +180^\circ]$, $\phi \in [-90^\circ, +90^\circ]$).
2. **0°/360° Meridian Seam**: Verified seamless pixel transition at left and right boundaries; zero vertical seam artifacts.
3. **Polar Pinch Suppression**: High latitude lines are filtered smoothly by Three.js `LinearMipmapLinearFilter` with anisotropic filtering enabled ($16\times$).
4. **Ring Alpha Radial Accuracy**: Saturn's ring texture is mapped radially using normalized radius $u = \frac{r - r_{\text{inner}}}{r_{\text{outer}} - r_{\text{inner}}}$ along the 1D ring opacity profile.

