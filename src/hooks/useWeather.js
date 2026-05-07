/**
 * useWeather.js
 * --------------
 * Main data-fetching hook. Accepts coordinates and fetches weather + AQI.
 * Auto-refreshes every 10 minutes.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const REFRESH_INTERVAL = 10 * 60 * 1000;

export function useWeather(coords) {
  const { 
    weatherData, 
    aqiData, 
    cityName, 
    loading, 
    error, 
    lastRefresh, 
    fetchData,
    setCoords
  } = useStore();

  const coordsRef = useRef(coords);
  
  useEffect(() => { 
    coordsRef.current = coords; 
    if (coords) {
      setCoords(coords);
    }
  }, [coords, setCoords]);

  useEffect(() => {
    if (!coords) return;
    fetchData(coords.lat, coords.lon);

    const interval = setInterval(() => {
      const { lat, lon } = coordsRef.current;
      fetchData(lat, lon);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [coords, fetchData]);

  return {
    data: weatherData ? { weather: weatherData, aqi: aqiData } : null,
    cityName,
    loading,
    error,
    lastRefresh,
    refresh: () => coords && fetchData(coords.lat, coords.lon),
  };
}
