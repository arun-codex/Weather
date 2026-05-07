/**
 * useGeolocation.js
 * ------------------
 * Custom React hook to request the browser's GPS location.
 * Returns the user's coordinates, loading state, and any error.
 */

import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [coords, setCoords]   = useState(null);  // { lat, lon }
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setTimeout(() => {
        setError('Geolocation is not supported by your browser.');
        setLoading(false);
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        // User denied GPS or another error — fall back to default location
        console.warn('Geolocation error:', err.message);
        setError(err.message);
        // Default to New Delhi, India as fallback
        setCoords({ lat: 28.6139, lon: 77.2090 });
        setLoading(false);
      },
      {
        enableHighAccuracy: false,  // Faster; no need for GPS precision for weather
        timeout: 8000,
        maximumAge: 300000,         // Cache location for 5 minutes
      }
    );
  }, []);

  return { coords, loading, error };
}
