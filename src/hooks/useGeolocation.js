/**
 * useGeolocation.js
 * ------------------
 * Custom React hook to request the browser's GPS location.
 * Returns the user's coordinates, loading state, and any error.
 */

import { useState, useEffect, useCallback } from 'react';

export function useGeolocation() {
  const [coords, setCoords]   = useState(null);  // { lat, lon }
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const requestPosition = useCallback(() => {
    setLoading(true);
    setError(null);

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
      async (err) => {
        // If GPS is denied or unavailable, try IP-based lookup as a non-precise fallback
        console.info('Geolocation error, attempting IP fallback:', err.message);
        setError(err.message);

        try {
          const res = await fetch('https://ipapi.co/json/');
          if (!res.ok) throw new Error('IP fallback failed');
          const json = await res.json();
          const lat = parseFloat(json.latitude ?? json.lat ?? null);
          const lon = parseFloat(json.longitude ?? json.lon ?? null);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            setCoords({ lat, lon });
            setLoading(false);
            return;
          }
        } catch (fallbackErr) {
          console.info('IP fallback error:', fallbackErr?.message || fallbackErr);
        }

        // As a last resort, leave coords null so the UI can prompt the user
        setCoords(null);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,  // Faster; no need for GPS precision for weather
        timeout: 8000,
        maximumAge: 300000,         // Cache location for 5 minutes
      }
    );
  }, []);

  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

  return { coords, loading, error, retry: requestPosition };
}
