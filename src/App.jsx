import { useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { useStore } from './store/useStore';
import { getIsDay } from './utils/formatters';
import { getWeatherInfo } from './utils/weatherCodes';

import WeatherBackground, { WeatherParticles } from './components/WeatherBackground';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import WeatherDetails from './components/WeatherDetails';
import WeatherAlerts from './components/WeatherAlerts';
import LoadingSkeleton from './components/LoadingSkeleton';
import SavedCities from './components/SavedCities';
import InsightsPanel from './components/InsightsPanel';
import LifestyleInsights from './components/WeatherPulse';

function useTimeTheme() {
  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', !getIsDay());
    };
    applyTheme();
    const id = setInterval(applyTheme, 60_000);
    return () => clearInterval(id);
  }, []);
}

export default function App() {
  const { coords: gpsCoords, loading: gpsLoading } = useGeolocation();
  const selectedCity = useStore((s) => s.selectedCity);
  const persistedCoords = useStore((s) => s.coords);
  const selectCity = useStore((s) => s.selectCity);
  const clearSelectedCity = useStore((s) => s.clearSelectedCity);

  const selectedCoords = useMemo(
    () => (selectedCity ? { lat: selectedCity.lat, lon: selectedCity.lon } : null),
    [selectedCity]
  );
  const activeCoords = selectedCoords ?? gpsCoords ?? persistedCoords;

  const { data, cityName: geocodedCity, loading, error, lastRefresh, refresh } =
    useWeather(activeCoords);

  useTimeTheme();

  const displayCity = selectedCity?.displayName || geocodedCity || 'Loading location...';
  const isDay = data?.weather?.current?.is_day === 1 || getIsDay();
  const weatherCode = data?.weather?.current?.weather_code ?? 0;
  const animation = getWeatherInfo(weatherCode).animation;
  const isLoading = (gpsLoading && !activeCoords && !data) || (loading && !data);

  const handleCitySelect = useCallback((city) => {
    selectCity(city);
  }, [selectCity]);

  const handleGpsClick = useCallback(() => {
    clearSelectedCity();
    if (!selectedCity) {
      refresh?.();
    }
  }, [clearSelectedCity, refresh, selectedCity]);

  return (
    <>
      <WeatherBackground animation={animation} isDay={isDay} />
      <WeatherParticles animation={animation} isDay={isDay} />

      <main className="relative z-10 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-20">
          <div className="sticky top-4 sm:top-6 z-50 mb-6">
            <SearchBar
              onSelectCity={handleCitySelect}
              onGpsClick={handleGpsClick}
              currentCity={displayCity}
            />
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-3xl p-8 text-center text-white mt-4"
            >
              <p className="text-4xl mb-4">!</p>
              <p className="font-semibold text-lg">Couldn't load weather</p>
              <p className="text-white/60 text-sm mt-2 mb-6">{error}</p>
              <button
                type="button"
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
              <WeatherAlerts current={data.weather.current} aqi={data.aqi} />

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

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              >
                <InsightsPanel />
              </motion.div>

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

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                <WeatherDetails current={data.weather.current} daily={data.weather.daily} aqi={data.aqi} />
              </motion.div>

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

              <div className="flex items-center justify-center gap-2 py-4 text-white/35 text-xs">
                <RefreshCw size={11} />
                <span>
                  {lastRefresh
                    ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Refreshing...'}
                </span>
              </div>
            </motion.div>
          ) : null}
        </div>
      </main>
    </>
  );
}
