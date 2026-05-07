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
import { RefreshCw } from 'lucide-react';

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

// New map components
import WeatherMap from './components/Map/WeatherMap';
import MapLayers from './components/Map/MapLayers';
import TimelineSlider from './components/TimelineSlider';
import InsightsPanel from './components/InsightsPanel';

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
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 lg:pt-12 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* ── LEFT COLUMN ── */}
            <div className="col-span-1 md:col-span-4 lg:col-span-3 flex flex-col gap-6 md:sticky md:top-6 z-50">
              <SearchBar
                onSelectCity={handleCitySelect}
                onGpsClick={handleGpsClick}
                currentCity={displayCity}
              />
              <SavedCities 
                currentCity={displayCity} 
                onCitySelect={handleCitySelect} 
              />
              
              {/* Only show map layers if data is loaded */}
              {data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <MapLayers />
                </motion.div>
              )}
            </div>

            {/* ── CONTENT AREA ── */}
            {isLoading ? (
              <div className="col-span-1 md:col-span-8 lg:col-span-9">
                <LoadingSkeleton />
              </div>
            ) : error ? (
              <div className="col-span-1 md:col-span-8 lg:col-span-9">
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
              <>
                {/* ── LEFT COLUMN CONTINUATION ── */}
                <div className="col-span-1 md:col-span-4 lg:hidden hidden">
                   {/* Mobile can stack, but desktop has it fixed on left */}
                </div>

                {/* ── CENTER COLUMN (MAP & TIMELINE) ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="col-span-1 md:col-span-8 lg:col-span-5 flex flex-col gap-6"
                >
                  <WeatherMap />
                  <TimelineSlider />
                </motion.div>

                {/* ── RIGHT COLUMN (DATA PANELS) ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-6 max-h-[85vh] overflow-y-auto no-scrollbar pb-10 pr-2"
                >
                  <WeatherAlerts
                    current={data.weather.current}
                    aqi={data.aqi}
                  />

                  <InsightsPanel />

                  <CurrentWeather
                    current={data.weather.current}
                    daily={data.weather.daily}
                    cityName={displayCity}
                    isDay={isDay}
                  />

                  <HourlyForecast hourly={data.weather.hourly} />
                  <DailyForecast daily={data.weather.daily} />
                  
                  <WeatherDetails
                    current={data.weather.current}
                    daily={data.weather.daily}
                    aqi={data.aqi}
                  />

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
              </>
            ) : null}

          </div>
        </div>
      </main>
    </>
  );
}
