/**
 * useWeather.js
 * --------------
 * Main data-fetching hook. Accepts coordinates and fetches weather + AQI.
 * Auto-refreshes every 10 minutes.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const REFRESH_INTERVAL = 10 * 60 * 1000;

export function useWeather(coords) {
  // Subscribe only to the pieces we need to avoid broad re-renders
  const weatherData = useStore((s) => s.weatherData);
  const aqiData = useStore((s) => s.aqiData);
  const cityName = useStore((s) => s.cityName);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const lastRefresh = useStore((s) => s.lastRefresh);
  const fetchData = useStore((s) => s.fetchData);

  const coordsRef = useRef(coords);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    if (!coords) return;
    fetchData(coords.lat, coords.lon);

    const interval = setInterval(() => {
      const { lat, lon } = coordsRef.current || {};
      if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
        fetchData(lat, lon);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [coords, fetchData]);

  const refresh = useCallback(() => {
    if (coords) {
      fetchData(coords.lat, coords.lon);
    }
  }, [coords, fetchData]);

  return {
    data: weatherData ? { weather: weatherData, aqi: aqiData } : null,
    cityName,
    loading,
    error,
    lastRefresh,
    refresh,
  };
}
