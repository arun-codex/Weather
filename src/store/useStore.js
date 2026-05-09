import { create } from 'zustand';
import { fetchWeatherByCoords, fetchAQI, reverseGeocode } from '../api/weather';
import { normalizeCityResult } from '../utils/searchRanking';

const APP_STATE_KEY = 'weather.appState.v1';

const safeLocalStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' ? window.localStorage?.getItem(key) ?? null : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(key, value);
      }
    } catch {
      // Ignore blocked storage or quota errors.
    }
  },
};

function finiteCoord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeCoords(coords) {
  const lat = finiteCoord(coords?.lat ?? coords?.latitude);
  const lon = finiteCoord(coords?.lon ?? coords?.longitude);
  return lat === null || lon === null ? null : { lat, lon };
}

function formatSelectedCityName(city) {
  if (!city?.name) return '';
  if (city.country_code) return `${city.name}, ${city.country_code}`;
  if (city.country) return `${city.name}, ${city.country}`;
  return city.name;
}

function toSelectedCity(city) {
  const normalized = normalizeCityResult(city);
  if (!normalized.name || normalized.lat === null || normalized.lon === null) return null;

  return {
    id: normalized.id,
    name: normalized.name,
    displayName: formatSelectedCityName(normalized),
    admin1: normalized.admin1,
    country: normalized.country,
    country_code: normalized.country_code,
    lat: normalized.lat,
    lon: normalized.lon,
  };
}

function parseLastRefresh(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readPersistedState() {
  try {
    const parsed = JSON.parse(safeLocalStorage.getItem(APP_STATE_KEY));
    if (!parsed || typeof parsed !== 'object') return {};

    const selectedCity = parsed.selectedCity ? toSelectedCity(parsed.selectedCity) : null;
    const coords = normalizeCoords(parsed.coords ?? selectedCity);

    return {
      selectedCity,
      coords,
      cityName: String(parsed.cityName ?? selectedCity?.displayName ?? ''),
      weatherData: parsed.weatherData ?? null,
      aqiData: parsed.aqiData ?? null,
      lastRefresh: parseLastRefresh(parsed.lastRefresh),
    };
  } catch {
    return {};
  }
}

function persistState(state) {
  const snapshot = {
    selectedCity: state.selectedCity,
    coords: state.coords,
    cityName: state.cityName,
    weatherData: state.weatherData,
    aqiData: state.aqiData,
    lastRefresh: state.lastRefresh instanceof Date ? state.lastRefresh.toISOString() : state.lastRefresh,
  };
  safeLocalStorage.setItem(APP_STATE_KEY, JSON.stringify(snapshot));
}

const persistedState = readPersistedState();

export const useStore = create((set, get) => ({
  // Core state
  coords: persistedState.coords ?? null,
  selectedCity: persistedState.selectedCity ?? null,
  cityName: persistedState.cityName ?? '',
  weatherData: persistedState.weatherData ?? null,
  aqiData: persistedState.aqiData ?? null,
  loading: false,
  error: null,
  lastRefresh: persistedState.lastRefresh ?? null,
  _inFlight: null,
  _requestSeq: 0,

  // Map & Timeline state
  activeLayer: 'none',
  selectedTimeIndex: 0,

  // Actions
  setCoords: (coords, cityName) => {
    const normalizedCoords = normalizeCoords(coords);
    if (!normalizedCoords) return;
    set({
      coords: normalizedCoords,
      ...(typeof cityName !== 'undefined' ? { cityName } : {}),
    });
  },
  selectCity: (city) => {
    const selectedCity = toSelectedCity(city);
    if (!selectedCity) return;

    set({
      selectedCity,
      coords: { lat: selectedCity.lat, lon: selectedCity.lon },
      cityName: selectedCity.displayName,
      weatherData: null,
      aqiData: null,
      error: null,
      lastRefresh: null,
      selectedTimeIndex: 0,
    });
    persistState(get());
  },
  clearSelectedCity: () => {
    set({ selectedCity: null, cityName: '', error: null });
    persistState(get());
  },
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSelectedTimeIndex: (index) => set({ selectedTimeIndex: index }),

  // Data fetching
  fetchData: async (lat, lon) => {
    const parsedLat = finiteCoord(lat);
    const parsedLon = finiteCoord(lon);
    if (parsedLat === null || parsedLon === null) return;

    const key = `${parsedLat.toFixed(3)}:${parsedLon.toFixed(3)}`;
    if (get()._inFlight === key) return;

    const nextRequestSeq = get()._requestSeq + 1;
    set({ loading: true, error: null, _inFlight: key, _requestSeq: nextRequestSeq });

    try {
      const [weather, aqi, city] = await Promise.all([
        fetchWeatherByCoords(parsedLat, parsedLon),
        fetchAQI(parsedLat, parsedLon),
        reverseGeocode(parsedLat, parsedLon),
      ]);

      if (get()._requestSeq !== nextRequestSeq) return;

      set((state) => {
        const selectedCity = state.selectedCity;
        const selectedMatchesCoords =
          selectedCity &&
          Math.abs(selectedCity.lat - parsedLat) < 0.01 &&
          Math.abs(selectedCity.lon - parsedLon) < 0.01;

        return {
          coords: { lat: parsedLat, lon: parsedLon },
          weatherData: weather,
          aqiData: aqi,
          cityName: selectedMatchesCoords ? selectedCity.displayName : city,
          lastRefresh: new Date(),
          selectedTimeIndex: 0,
          loading: false,
          _inFlight: state._inFlight === key ? null : state._inFlight,
        };
      });
      persistState(get());
    } catch (err) {
      if (get()._requestSeq !== nextRequestSeq) return;
      console.error('Fetch error:', err);
      set({ error: 'Failed to load data', loading: false, _inFlight: null });
    }
  },
}));
