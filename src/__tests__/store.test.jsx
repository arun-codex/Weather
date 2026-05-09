import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../../src/store/useStore';

const apiMocks = vi.hoisted(() => ({
  fetchWeatherByCoords: vi.fn(),
  fetchAQI: vi.fn(),
  reverseGeocode: vi.fn(),
}));

vi.mock('../../src/api/weather', () => apiMocks);

function resetStore() {
  useStore.setState({
    coords: null,
    selectedCity: null,
    weatherData: null,
    aqiData: null,
    cityName: '',
    loading: false,
    error: null,
    lastRefresh: null,
    _inFlight: null,
    _requestSeq: 0,
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('useStore weather state', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
    apiMocks.fetchWeatherByCoords.mockReset();
    apiMocks.fetchAQI.mockReset();
    apiMocks.reverseGeocode.mockReset();
    apiMocks.fetchWeatherByCoords.mockResolvedValue({ current: { temp: 20, is_day: 1 }, hourly: [], daily: [] });
    apiMocks.fetchAQI.mockResolvedValue({ european_aqi: 10 });
    apiMocks.reverseGeocode.mockResolvedValue('Test City');
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

  it('persists selected city, coords, weather data and refresh time', async () => {
    useStore.getState().selectCity({
      name: 'Surat',
      country: 'India',
      country_code: 'IN',
      latitude: 21.1959,
      longitude: 72.8302,
    });

    await useStore.getState().fetchData(21.1959, 72.8302);

    const snapshot = JSON.parse(localStorage.getItem('weather.appState.v1'));
    expect(snapshot.selectedCity.displayName).toBe('Surat, IN');
    expect(snapshot.coords).toEqual({ lat: 21.1959, lon: 72.8302 });
    expect(snapshot.weatherData).toBeTruthy();
    expect(snapshot.aqiData).toBeTruthy();
    expect(snapshot.lastRefresh).toBeTruthy();
  });

  it('ignores older weather responses after a newer request starts', async () => {
    const firstWeather = deferred();
    const secondWeather = deferred();

    apiMocks.fetchWeatherByCoords.mockImplementation((lat) => {
      if (lat === 1) return firstWeather.promise;
      return secondWeather.promise;
    });
    apiMocks.reverseGeocode.mockImplementation((lat) => Promise.resolve(lat === 1 ? 'Old City' : 'New City'));

    const firstRequest = useStore.getState().fetchData(1, 1);
    const secondRequest = useStore.getState().fetchData(2, 2);

    secondWeather.resolve({ current: { temp: 22, is_day: 1 }, hourly: [], daily: [] });
    await secondRequest;

    expect(useStore.getState().coords).toEqual({ lat: 2, lon: 2 });
    expect(useStore.getState().cityName).toBe('New City');

    firstWeather.resolve({ current: { temp: 10, is_day: 0 }, hourly: [], daily: [] });
    await firstRequest;

    expect(useStore.getState().coords).toEqual({ lat: 2, lon: 2 });
    expect(useStore.getState().cityName).toBe('New City');
  });
});
