/**
 * formatters.js
 * -------------
 * Utility functions for formatting dates, times, temperatures, etc.
 */

/**
 * Format an ISO datetime string to a short hour label: e.g. "3 PM"
 */
export function formatHour(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

/**
 * Format an ISO date string to a 3-letter weekday: e.g. "Mon"
 */
export function formatDay(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: 'short' });
}

/**
 * Format an ISO date string to "Mon, Mar 22"
 */
export function formatFullDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format current time as "8:05 PM"
 */
export function formatCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Round temperature to nearest integer
 */
export function roundTemp(temp) {
  return Math.round(temp);
}

/**
 * Determine if the current hour is daytime (06:00 – 18:00)
 */
export function getIsDay() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

/**
 * Convert wind speed from km/h to the most human-friendly description
 */
export function describeWind(kmh) {
  if (kmh < 5)  return 'Calm';
  if (kmh < 20) return 'Light';
  if (kmh < 40) return 'Moderate';
  if (kmh < 60) return 'Strong';
  if (kmh < 80) return 'Very Strong';
  return 'Storm';
}

/**
 * AQI label and color class from AQI value (US standard).
 */
export function getAqiInfo(aqi) {
  if (aqi === null || aqi === undefined) return { label: 'N/A', color: 'text-gray-400' };
  if (aqi <= 50)  return { label: 'Good',        color: 'text-green-400'  };
  if (aqi <= 100) return { label: 'Fair',         color: 'text-yellow-400' };
  if (aqi <= 150) return { label: 'Moderate',     color: 'text-orange-400' };
  if (aqi <= 200) return { label: 'Poor',         color: 'text-red-400'    };
  if (aqi <= 300) return { label: 'Very Poor',    color: 'text-purple-400' };
  return              { label: 'Hazardous',    color: 'text-red-600'    };
}

/**
 * UV index label and color
 */
export function getUvInfo(uv) {
  if (uv === null || uv === undefined) return { label: 'N/A', color: 'text-gray-400' };
  if (uv <= 2)  return { label: 'Low',       color: 'text-green-400'  };
  if (uv <= 5)  return { label: 'Moderate',  color: 'text-yellow-400' };
  if (uv <= 7)  return { label: 'High',      color: 'text-orange-400' };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-400'    };
  return             { label: 'Extreme',    color: 'text-purple-400' };
}

/**
 * Wind direction degrees → compass abbreviation
 */
export function degToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}
