/**
 * weather.js — API Service Layer
 * --------------------------------
 * All network calls to Open-Meteo (free, no API key needed).
 *
 * Open-Meteo API docs: https://open-meteo.com/en/docs
 * Geocoding API docs:  https://open-meteo.com/en/docs/geocoding-api
 */

import axios from 'axios';

const WEATHER_BASE = 'https://api.open-meteo.com/v1';
const GEO_BASE     = 'https://geocoding-api.open-meteo.com/v1';
const AQI_BASE     = 'https://air-quality-api.open-meteo.com/v1';

/**
 * Fetch full weather data for a lat/lon coordinate.
 * Returns an object with: current, hourly, daily raw API data.
 */
export async function fetchWeatherByCoords(lat, lon) {
  const params = {
    latitude:  lat,
    longitude: lon,
    // Current conditions
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
      'surface_pressure',
      'precipitation',
      'visibility',
      'is_day',
    ].join(','),
    // Hourly for next 48 hours
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'precipitation_probability',
      'wind_speed_10m',
      'precipitation',
    ].join(','),
    // Daily for next 7 days
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'uv_index_max',
      'sunrise',
      'sunset',
      'wind_speed_10m_max',
    ].join(','),
    timezone: 'auto',   // Uses the local timezone automatically
    forecast_days: 7,
  };

  const { data } = await axios.get(`${WEATHER_BASE}/forecast`, { params });
  return data;
}

/**
 * Fetch Air Quality Index for a lat/lon.
 * Uses european_aqi (0–500 scale, like US AQI).
 */
export async function fetchAQI(lat, lon) {
  try {
    const params = {
      latitude: lat,
      longitude: lon,
      current: 'european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone',
      timezone: 'auto',
    };
    const { data } = await axios.get(`${AQI_BASE}/air-quality`, { params });
    return data.current;
  } catch {
    // AQI is optional — return null on failure
    return null;
  }
}

/**
 * Search cities by name using Open-Meteo Geocoding API.
 * Returns an array of city result objects.
 */
export async function searchCity(query) {
  if (!query || query.length < 2) return [];
  // Use q param (per Open-Meteo docs). Return up to 8 results in English.
  const { data } = await axios.get(`${GEO_BASE}/search`, {
    params: { q: query, count: 8, language: 'en', format: 'json' },
  });

  const raw = data.results ?? [];
  // Normalize results to a consistent shape used across the app
  const results = raw.map((r, idx) => ({
    id: r.id ?? `${r.name}-${r.latitude}-${r.longitude}-${idx}`,
    name: r.name ?? '',
    admin1: r.admin1 ?? r.admin2 ?? '',
    country: r.country ?? '',
    country_code: r.country_code ?? r.countryCode ?? '',
    lat: r.latitude ?? r.lat ?? null,
    lon: r.longitude ?? r.lon ?? null,
    raw: r,
  }));

  return results;
}

/**
 * Reverse-geocode a lat/lon to city name using Big Data Cloud (free, no key).
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const { data } = await axios.get(url);
    return data.city || data.locality || data.principalSubdivision || 'Your Location';
  } catch {
    return 'Your Location';
  }
}
