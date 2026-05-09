/**
 * App.jsx — Root Component
 * -------------------------
 * Orchestrates the entire weather app:
 *  1. Gets GPS coordinates via useGeolocation
 *  2. Allows manual city override via SearchBar
 *  3. Fetches all weather data via useWeather hook
 *  4. Applies dark/light theme class to <html> based on time of day
 *  5. Renders the correct animated background + all content sections
 *
 * Layout (mobile-first, max-width centered on desktop):
 *   ┌─────────────────────────────┐
 *   │  [SearchBar]                │
 *   │  [WeatherAlerts?]           │
 *   │  [CurrentWeather]           │
 *   │  [HourlyForecast]           │
 *   │  [DailyForecast]            │
 *   │  [WeatherDetails]           │
 *   │  [Footer: last refresh]     │
 *   └─────────────────────────────┘
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Wind, Droplets, Eye, Sparkles } from 'lucide-react';

import { useGeolocation }  from './hooks/useGeolocation';
import { useWeather }      from './hooks/useWeather';
import { getIsDay }        from './utils/formatters';
import { getWeatherInfo }  from './utils/weatherCodes';

import WeatherBackground, { WeatherParticles } from './components/WeatherBackground';
import SearchBar       from './components/SearchBar';
import CurrentWeather  from './components/CurrentWeather';
import HourlyForecast  from './components/HourlyForecast';
import DailyForecast   from './components/DailyForecast';
import WeatherDetails  from './components/WeatherDetails';
import WeatherAlerts   from './components/WeatherAlerts';
import LoadingSkeleton from './components/LoadingSkeleton';
import SavedCities     from './components/SavedCities';
import InsightsPanel   from './components/InsightsPanel';
import LifestyleInsights from './components/WeatherPulse';
import { getAqiInfo, describeWind } from './utils/formatters';

// ─── Dark/Light theme based on time of day ───────────────────────────────────
function useTimeTheme() {
  useEffect(() => {
    const applyTheme = () => {
      const isDaytime = getIsDay();
      // Sunny and partly cloudy in daytime use light theme;
      // everything else and night uses dark theme
      document.documentElement.classList.toggle('dark', !isDaytime);
    };
    applyTheme();
    // Re-check every minute in case the user leaves the tab open through dawn/dusk
    const id = setInterval(applyTheme, 60_000);
    return () => clearInterval(id);
  }, []);
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // 1. GPS location
  const { coords: gpsCoords, loading: gpsLoading } = useGeolocation();

  // 2. Override coords if user searches for a city
  const [manualCoords, setManualCoords] = useState(null);
  const [manualCityName, setManualCityName] = useState('');

  // Active coords = manual override OR GPS, whichever is set
  const activeCoords = manualCoords ?? gpsCoords;

  // 3. Fetch weather for active coords
  const { data, cityName: geocodedCity, loading, error, lastRefresh, refresh } =
    useWeather(activeCoords);

  // 4. Apply dark/light theme
  useTimeTheme();

  // 5. Derive display values
  const displayCity = manualCityName || geocodedCity || 'Loading location…';
  const isDay       = data?.weather?.current?.is_day === 1 || getIsDay();
  const weatherCode = data?.weather?.current?.weather_code ?? 0;
  const animation   = getWeatherInfo(weatherCode).animation;
  const current = data?.weather?.current;
  const aqiValue = data?.aqi?.european_aqi ?? data?.aqi?.us_aqi ?? null;
  const aqiInfo = getAqiInfo(aqiValue);
  const windSpeed = current?.wind_speed_10m ?? 0;
  const windLabel = describeWind(windSpeed);
  const humidity = current?.relative_humidity_2m ?? null;
  const visibility = current?.visibility ?? null;
  const heroMotion = {
    sunny: { y: [0, -4, 0], rotate: [0, 0.5, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } },
    cloudy: { x: [0, 4, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } },
    rain: { y: [0, 2, 0], transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } },
    snow: { y: [0, -2, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } },
    thunder: { scale: [1, 1.01, 1], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
    fog: { opacity: [0.82, 1, 0.82], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  };
  const heroVariant = heroMotion[animation] ?? heroMotion.cloudy;

  // Handle city selection from SearchBar
  const handleCitySelect = (city) => {
    // Normalize incoming city object: accept {lat,lon} or {latitude,longitude}
    const lat = city.lat ?? city.latitude ?? city.latitude ?? city.latitude;
    const lon = city.lon ?? city.longitude ?? city.longitude ?? city.longitude;
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (!parsedLat || !parsedLon) {
      // fallback: if invalid coords, just set name and attempt to reverse-geocode later
      setManualCoords(null);
      setManualCityName(city.name || '');
      return;
    }

    setManualCoords({ lat: parsedLat, lon: parsedLon });
    setManualCityName((city.name || '') + (city.country_code ? `, ${city.country_code}` : ''));
    // Trigger immediate fetch for new coords
    // useWeather hook will pick up manualCoords change; also call refresh to be explicit
    // (refresh is a safe no-op if not yet mounted)
    setTimeout(() => refresh?.(), 50);
  };

  // Handle GPS button
  const handleGpsClick = () => {
    setManualCoords(null);
    setManualCityName('');
    // Force re-fetch by resetting gpsCoords effect — hook re-runs on coords change
    refresh?.();
  };

  const isLoading = gpsLoading || loading;

  return (
    <>
      {/* Full-screen animated gradient background */}
      <WeatherBackground animation={animation} isDay={isDay} />

      {/* Weather particle effects (rain, snow, etc.) */}
      <WeatherParticles animation={animation} isDay={isDay} />

      {/* Main scrollable content */}
      <main className="relative z-10 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-20">
          
          {/* ── SEARCH & CITY NAVIGATION (STICKY TOP) ── */}
          <div className="sticky top-4 sm:top-6 z-50 mb-6">
            <SearchBar
              onSelectCity={handleCitySelect}
              onGpsClick={handleGpsClick}
              currentCity={displayCity}
            />
          </div>

          {/* ── MAIN CONTENT AREA ── */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-3xl p-8 text-center text-white mt-4"
            >
              <p className="text-4xl mb-4">⚠️</p>
              <p className="font-semibold text-lg">Couldn't load weather</p>
              <p className="text-white/60 text-sm mt-2 mb-6">{error}</p>
              <button
                onClick={refresh}
                className="px-6 py-2 rounded-full glass text-sm font-medium hover:bg-white/15 transition-colors"
              >
                Try again
              </button>
            </motion.div>
          ) : data ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              {/* Weather Alerts */}
              <WeatherAlerts current={data.weather.current} aqi={data.aqi} />

              {/* ── HERO WEATHER (FULL WIDTH, DOMINANT) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <CurrentWeather
                  current={data.weather.current}
                  daily={data.weather.daily}
                  cityName={displayCity}
                  isDay={isDay}
                />
              </motion.div>

              {/* ── SMART SUGGESTIONS (INSIGHTS) ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              >
                <InsightsPanel />
              </motion.div>

              {/* ── SAVED CITIES (HORIZONTAL SCROLL) ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                <SavedCities 
                  currentCity={displayCity} 
                  currentCoords={activeCoords}
                  onCitySelect={handleCitySelect} 
                />
              </motion.div>

              {/* ── FORECAST SECTION ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="glass rounded-3xl border border-white/10 p-5 lg:p-6 space-y-5"
              >
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-[0.24em] font-medium">Forecast</p>
                  <h2 className="text-white text-h3 font-semibold mt-2">Hourly and 7-day outlook</h2>
                </div>
                <HourlyForecast hourly={data.weather.hourly} />
                <DailyForecast daily={data.weather.daily} />
              </motion.div>

              {/* ── ENVIRONMENT METRICS ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                <WeatherDetails current={data.weather.current} daily={data.weather.daily} aqi={data.aqi} />
              </motion.div>

              {/* ── LIFESTYLE INSIGHTS ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.35 }}
              >
                <LifestyleInsights
                  current={data.weather.current}
                  hourly={data.weather.hourly}
                  daily={data.weather.daily}
                  aqi={data.aqi}
                  cityName={displayCity}
                />
              </motion.div>

              {/* Footer: last refresh timestamp */}
              <div className="flex items-center justify-center gap-2 py-4 text-white/35 text-xs">
                <RefreshCw size={11} />
                <span>
                  {lastRefresh
                    ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Refreshing…'}
                </span>
              </div>
            </motion.div>
          ) : null}
        </div>
      </main>
    </>
  );
}
