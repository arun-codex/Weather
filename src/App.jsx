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

import WeatherPulse from './components/WeatherPulse';
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
    setManualCoords({ lat: city.latitude, lon: city.longitude });
    setManualCityName(city.name + (city.country_code ? `, ${city.country_code}` : ''));
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
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-5 lg:pt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
            
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-6 z-50">
              <SearchBar
                onSelectCity={handleCitySelect}
                onGpsClick={handleGpsClick}
                currentCity={displayCity}
              />
              <SavedCities 
                currentCity={displayCity} 
                currentCoords={activeCoords}
                onCitySelect={handleCitySelect} 
              />
            </div>

            {/* ── CONTENT AREA ── */}
            {isLoading ? (
              <div className="min-w-0">
                <LoadingSkeleton />
              </div>
            ) : error ? (
              <div className="min-w-0">
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
              </div>
            ) : data ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="min-w-0 flex flex-col gap-6"
              >
                {/* ── HERO STRIP ── */}
                <motion.div
                  animate={heroVariant}
                  className="glass rounded-3xl border border-white/10 px-5 py-4 overflow-hidden relative"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-fuchsia-400" />
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-white/45 text-xs uppercase tracking-[0.28em]">Live conditions</p>
                      <h2 className="text-white text-2xl font-semibold">{displayCity}</h2>
                      <p className="text-white/70 text-sm">{isDay ? 'Daytime forecast' : 'Night conditions'}</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto">
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2 text-white/55 text-xs uppercase tracking-[0.2em]"><Wind size={12} /> Wind</div>
                        <div className="text-white font-semibold mt-1">{windSpeed.toFixed(1)} km/h</div>
                        <div className="text-white/55 text-xs">{windLabel}</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2 text-white/55 text-xs uppercase tracking-[0.2em]"><Droplets size={12} /> Humidity</div>
                        <div className="text-white font-semibold mt-1">{humidity != null ? `${Math.round(humidity)}%` : '—'}</div>
                        <div className="text-white/55 text-xs">Comfort level</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2 text-white/55 text-xs uppercase tracking-[0.2em]"><Eye size={12} /> Visibility</div>
                        <div className="text-white font-semibold mt-1">{visibility != null ? `${Math.round(visibility / 1000)} km` : '—'}</div>
                        <div className="text-white/55 text-xs">Clear view</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2 text-white/55 text-xs uppercase tracking-[0.2em]"><Sparkles size={12} /> AQI</div>
                        <div className="text-white font-semibold mt-1">{aqiValue != null ? Math.round(aqiValue) : '—'}</div>
                        <div className={`text-xs ${aqiInfo.color}`}>{aqiInfo.label}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-6 items-start">
                  {/* ── MAIN COLUMN ── */}
                  <motion.div className="flex flex-col gap-6 min-w-0">
                    <CurrentWeather
                      current={data.weather.current}
                      daily={data.weather.daily}
                      cityName={displayCity}
                      isDay={isDay}
                    />
                    <WeatherPulse
                      current={data.weather.current}
                      hourly={data.weather.hourly}
                      animation={animation}
                    />
                    <HourlyForecast hourly={data.weather.hourly} />
                  </motion.div>

                  {/* ── SIDE COLUMN ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col gap-6 max-h-[85vh] overflow-y-auto no-scrollbar pb-10 pr-2"
                  >
                    <WeatherAlerts current={data.weather.current} aqi={data.aqi} />
                    <InsightsPanel />

                    <DailyForecast daily={data.weather.daily} />
                    <WeatherDetails current={data.weather.current} daily={data.weather.daily} aqi={data.aqi} />

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
                </div>
              </motion.div>
            ) : null}

          </div>
        </div>
      </main>
    </>
  );
}
