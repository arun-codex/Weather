/**
 * weather.js — API Service Layer
 * --------------------------------
 * All network calls to Open-Meteo (free, no API key needed).
 *
 * Open-Meteo API docs: https://open-meteo.com/en/docs
 * Geocoding API docs:  https://open-meteo.com/en/docs/geocoding-api
 */

import axios from 'axios';
import { foldSearchText, normalizeCityResult, normalizeSearchQuery } from '../utils/searchRanking';

const WEATHER_BASE = 'https://api.open-meteo.com/v1';
const GEO_BASE     = 'https://geocoding-api.open-meteo.com/v1';
const AQI_BASE     = 'https://air-quality-api.open-meteo.com/v1';
const SEARCH_CACHE_TTL = 5 * 60 * 1000;

const searchCache = new Map();
const inFlightSearches = new Map();

export function clearSearchCache() {
  searchCache.clear();
  inFlightSearches.clear();
}

function getSearchCacheKey(query, count, language) {
  return `${foldSearchText(query)}|${count}|${language}`;
}

function normalizeCount(count) {
  const parsed = Number(count);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

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
export async function searchCity(query, { signal, count = 50, language = 'en' } = {}) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const normalizedCount = normalizeCount(count);
  const cacheKey = getSearchCacheKey(normalizedQuery, normalizedCount, language);
  const cached = searchCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.results;
  }

  if (cached) {
    searchCache.delete(cacheKey);
  }

  if (inFlightSearches.has(cacheKey)) {
    return inFlightSearches.get(cacheKey);
  }

  const request = axios
    .get(`${GEO_BASE}/search`, {
      params: { name: normalizedQuery, count: normalizedCount, language, format: 'json' },
      signal,
    })
    .then(({ data }) => {
      const results = (data.results ?? []).map((result, index) => normalizeCityResult(result, index));
      searchCache.set(cacheKey, {
        results,
        expiresAt: Date.now() + SEARCH_CACHE_TTL,
      });
      return results;
    })
    .catch((error) => {
      searchCache.delete(cacheKey);
      throw error;
    })
    .finally(() => {
      inFlightSearches.delete(cacheKey);
    });

  inFlightSearches.set(cacheKey, request);
  return request;
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
