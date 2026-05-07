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

  // Map & Timeline state
  activeLayer: 'none', // 'none', 'precipitation', 'temperature', 'wind'
  selectedTimeIndex: 0, // 0 to 47 (48 hours of hourly forecast)

  // Actions
  setCoords: (coords, cityName = '') => set({ coords, cityName }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSelectedTimeIndex: (index) => set({ selectedTimeIndex: index }),

  // Data fetching
  fetchData: async (lat, lon) => {
    set({ loading: true, error: null });
    try {
      const [weather, aqi, city] = await Promise.all([
        fetchWeatherByCoords(lat, lon),
        fetchAQI(lat, lon),
        reverseGeocode(lat, lon),
      ]);

      set({
        weatherData: weather,
        aqiData: aqi,
        cityName: get().cityName || city, // Prefer manually set name if available
        lastRefresh: new Date(),
        selectedTimeIndex: 0,
        loading: false,
      });
    } catch (err) {
      console.error('Fetch error:', err);
      set({ error: 'Failed to load data', loading: false });
    }
  },
}));
