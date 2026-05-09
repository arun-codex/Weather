/**
 * useGeolocation.js
 * ------------------
 * Robust geolocation hook using Capacitor Geolocation plugin for native platforms
 * and falling back to browser API + IP-based lookup.
 */

import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export function useGeolocation() {
  const [coords, setCoords]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  const requestPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions();
        setPermissionStatus(perm.location);

        if (perm.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            throw new Error('Location permission denied');
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000
        });

        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      } else {
        // Web fallback
        if (!navigator.geolocation) {
          throw new Error('Geolocation not supported');
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            setLoading(false);
          },
          async (err) => {
            console.warn('Browser geolocation failed, trying IP fallback:', err.message);
            await fetchIpFallback(err.message);
          },
          { timeout: 8000 }
        );
      }
    } catch (err) {
      console.error('Geolocation error:', err);
      await fetchIpFallback(err.message);
    }
  }, []);

  const fetchIpFallback = async (originalError) => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const json = await res.json();
      if (json.latitude && json.longitude) {
        setCoords({ lat: json.latitude, lon: json.longitude });
        setLoading(false);
      } else {
        throw new Error('IP lookup failed');
      }
    } catch (fallbackErr) {
      setError(originalError || 'Failed to determine location');
      setLoading(false);
      setCoords(null);
    }
  };

  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

  return { coords, loading, error, retry: requestPosition, permissionStatus };
}
