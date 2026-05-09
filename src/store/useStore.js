import { create } from 'zustand';
import { fetchWeatherByCoords, fetchAQI, reverseGeocode } from '../api/weather';

export const useStore = create((set, get) => ({
  // Core state
  coords: null,
  cityName: '',
  weatherData: null,
  aqiData: null,
  loading: false,
  error: null,
  lastRefresh: null,
  _inFlight: null,

  // Map & Timeline state
  activeLayer: 'none', // 'none', 'precipitation', 'temperature', 'wind'
  selectedTimeIndex: 0, // 0 to 47 (48 hours of hourly forecast)

  // Actions
  setCoords: (coords, cityName) =>
    set((prev) => ({
      coords,
      ...(typeof cityName !== 'undefined' ? { cityName } : {}),
    })),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSelectedTimeIndex: (index) => set({ selectedTimeIndex: index }),

  // Data fetching
  fetchData: async (lat, lon) => {
    const key = `${Number(lat).toFixed(3)}:${Number(lon).toFixed(3)}`;
    // Prevent duplicate concurrent fetches for the same coords
    if (get()._inFlight === key) return;
    set({ loading: true, error: null, _inFlight: key });
    try {
      const [weather, aqi, city] = await Promise.all([
        fetchWeatherByCoords(lat, lon),
        fetchAQI(lat, lon),
        reverseGeocode(lat, lon),
      ]);

      // Atomically update coords + fetched data so all subscribers see a consistent state
      set((prev) => ({
        coords: { lat, lon },
        weatherData: weather,
        aqiData: aqi,
        // Always update geocoded name from the reverse geocode result to avoid stale labels
        cityName: city,
        lastRefresh: new Date(),
        selectedTimeIndex: 0,
        loading: false,
        _inFlight: prev._inFlight === key ? null : prev._inFlight,
      }));
    } catch (err) {
      console.error('Fetch error:', err);
      set({ error: 'Failed to load data', loading: false, _inFlight: null });
    }
  },
}));
