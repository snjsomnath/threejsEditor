/**
 * Solar position calculation utilities for realistic sun positioning
 * Based on astronomical algorithms for accurate sun position calculation
 */

export interface SunPosition {
  azimuth: number;    // Degrees from north (0-360)
  elevation: number;  // Degrees above horizon (-90 to 90)
  x: number;         // Three.js world coordinates
  y: number;
  z: number;
}

export interface GeographicLocation {
  latitude: number;
  longitude: number;
  timezone: string;
}

// Sweden coordinates (Stockholm as default)
export const SWEDEN_LOCATION: GeographicLocation = {
  latitude: 59.3293,   // Stockholm latitude
  longitude: 18.0686,  // Stockholm longitude
  timezone: 'Europe/Stockholm'
};

/**
 * Calculate sun position for given date, time and location
 */
export function calculateSunPosition(
  date: Date,
  location: GeographicLocation = SWEDEN_LOCATION
): SunPosition {
  // Convert to Julian day number
  const julianDay = getJulianDay(date);
  
  // Calculate solar coordinates
  const solarCoords = getSolarCoordinates(julianDay);
  
  // Calculate local hour angle
  const hourAngle = getHourAngle(date, location.longitude);
  
  // Calculate sun position (azimuth and elevation)
  const { azimuth, elevation } = calculateAzimuthElevation(
    location.latitude,
    solarCoords.declination,
    hourAngle
  );
  
  // Convert to Three.js world coordinates
  const { x, y, z } = sphericalToCartesian(azimuth, elevation);
  
  return {
    azimuth,
    elevation,
    x,
    y,
    z
  };
}

/**
 * Get Julian day number for astronomical calculations
 */
function getJulianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  
  const jdn = date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  return jdn + (hour - 12) / 24;
}

/**
 * Calculate solar coordinates (declination and equation of time)
 */
function getSolarCoordinates(julianDay: number) {
  const n = julianDay - 2451545.0;
  
  // Solar longitude
  const L = (280.460 + 0.9856474 * n) % 360;
  
  // Solar anomaly
  const g = toRadians((357.528 + 0.9856003 * n) % 360);
  
  // Solar longitude corrected
  const lambda = toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  
  // Solar declination
  const declination = Math.asin(Math.sin(toRadians(23.439)) * Math.sin(lambda));
  
  // Equation of time (in minutes)
  const equationOfTime = 4 * (L - 0.0057183 - Math.atan2(Math.tan(lambda), Math.cos(toRadians(23.439))));
  
  return {
    declination,
    equationOfTime
  };
}

/**
 * Calculate hour angle for given time and longitude
 */
function getHourAngle(date: Date, longitude: number): number {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const localSolarTime = utcHour + longitude / 15;
  return toRadians(15 * (localSolarTime - 12));
}

/**
 * Calculate azimuth and elevation from latitude, declination and hour angle
 */
function calculateAzimuthElevation(
  latitude: number,
  declination: number,
  hourAngle: number
) {
  const lat = toRadians(latitude);
  
  // Calculate elevation
  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
  );
  
  // Calculate azimuth
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat)
  );
  
  return {
    azimuth: (toDegrees(azimuth) + 180) % 360, // Convert to 0-360 from north
    elevation: toDegrees(elevation)
  };
}

/**
 * Convert spherical coordinates (azimuth, elevation) to Cartesian (x, y, z)
 * for Three.js world coordinates
 */
function sphericalToCartesian(azimuth: number, elevation: number, distance: number = 100) {
  const azimuthRad = toRadians(azimuth - 90); // Convert from north-based to east-based
  const elevationRad = toRadians(Math.max(elevation, -5)); // Clamp elevation to prevent issues
  
  const x = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
  const y = distance * Math.sin(elevationRad);
  const z = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
  
  return { x, y, z };
}

/**
 * Get sun position for current date/time
 */
export function getCurrentSunPosition(location: GeographicLocation = SWEDEN_LOCATION): SunPosition {
  return calculateSunPosition(new Date(), location);
}

/**
 * Get sun position for specific time today
 */
export function getSunPositionForTime(
  hour: number,
  minute: number = 0,
  location: GeographicLocation = SWEDEN_LOCATION
): SunPosition {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  return calculateSunPosition(date, location);
}

/**
 * Determine if it's day or night based on sun elevation
 */
export function isDayTime(sunPosition: SunPosition): boolean {
  return sunPosition.elevation > -6; // Civil twilight threshold
}

/**
 * Get sun intensity based on elevation (for lighting calculations)
 */
export function getSunIntensity(elevation: number): number {
  if (elevation < -18) return 0; // Astronomical night
  if (elevation < -12) return 0.1; // Astronomical twilight
  if (elevation < -6) return 0.3; // Nautical twilight
  if (elevation < 0) return 0.6; // Civil twilight
  return Math.min(1, 0.8 + elevation / 90 * 0.2); // Day time
}

/**
 * Get ambient light intensity based on sun elevation
 */
export function getAmbientIntensity(elevation: number): number {
  if (elevation < -18) return 0.1; // Dark night
  if (elevation < -12) return 0.2; // Astronomical twilight
  if (elevation < -6) return 0.4; // Nautical twilight
  if (elevation < 0) return 0.6; // Civil twilight
  return Math.min(1, 0.4 + elevation / 90 * 0.4); // Day time
}

// Utility functions
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Get sunrise and sunset times for a given date and location
 */
export function getSunriseSunset(
  date: Date,
  location: GeographicLocation = SWEDEN_LOCATION
): { sunrise: Date; sunset: Date } {
  // This is a simplified calculation - for production use a proper sunrise/sunset library
  const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Test different hours to find sunrise/sunset
  let sunrise: Date | null = null;
  let sunset: Date | null = null;
  
  for (let hour = 0; hour < 24; hour++) {
    const testDate = new Date(baseDate.getTime() + hour * 60 * 60 * 1000);
    const sunPos = calculateSunPosition(testDate, location);
    
    if (!sunrise && sunPos.elevation > 0) {
      sunrise = testDate;
    }
    if (sunrise && !sunset && sunPos.elevation < 0 && hour > 12) {
      sunset = testDate;
      break;
    }
  }
  
  // Fallback times if calculation fails
  if (!sunrise) sunrise = new Date(baseDate.getTime() + 6 * 60 * 60 * 1000); // 6 AM
  if (!sunset) sunset = new Date(baseDate.getTime() + 18 * 60 * 60 * 1000); // 6 PM
  
  return { sunrise, sunset };
}
