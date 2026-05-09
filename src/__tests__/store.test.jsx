import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../../src/store/useStore';

// Mock the API module used by fetchData
vi.mock('../../src/api/weather', () => ({
  fetchWeatherByCoords: async (lat, lon) => ({ current: { temp: 20, is_day: 1 }, hourly: [], daily: [] }),
  fetchAQI: async () => ({ european_aqi: 10 }),
  reverseGeocode: async () => 'Test City',
}));

describe('useStore.fetchData', () => {
  beforeEach(() => {
    // reset store between tests
    useStore.setState({ coords: null, weatherData: null, aqiData: null, cityName: '', loading: false, error: null, lastRefresh: null });
  });

  it('updates coords, weatherData, aqiData and cityName atomically', async () => {
    const { fetchData } = useStore.getState();
    await fetchData(12.34, 56.78);

    const state = useStore.getState();
    expect(state.coords).toEqual({ lat: 12.34, lon: 56.78 });
    expect(state.weatherData).toBeTruthy();
    expect(state.aqiData).toBeTruthy();
    expect(state.cityName).toBe('Test City');
    expect(state.loading).toBe(false);
    expect(state.lastRefresh).toBeTruthy();
  });
});
