import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, MapPinOff, WifiOff, AlertTriangle } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

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

function useAndroidOptimization() {
  useEffect(() => {
    // Hide splash screen when app is ready
    SplashScreen.hide();

    // Style status bar
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setOverlaysWebView({ overlay: true });

    // Handle Android back button
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, []);
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}

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
  useAndroidOptimization();
  useTimeTheme();
  const isOnline = useOnlineStatus();

  const { coords: gpsCoords, loading: gpsLoading, error: gpsError, retry: retryGps } = useGeolocation();
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
      retryGps?.();
      refresh?.();
    }
  }, [clearSelectedCity, refresh, retryGps, selectedCity]);

  const renderState = () => {
    if (!isOnline && !data) {
      return (
        <ErrorState
          icon={<WifiOff size={48} />}
          title="You're Offline"
          message="Please check your internet connection to get live weather updates."
          onRetry={() => window.location.reload()}
        />
      );
    }

    if (gpsError && !activeCoords && !data) {
      return (
        <ErrorState
          icon={<MapPinOff size={48} />}
          title="Location Access Required"
          message={gpsError.includes('denied')
            ? "We need your location to show local weather. Please enable it in settings."
            : "We couldn't find your location. Try searching for a city instead."}
          onRetry={retryGps}
          retryText="Grant Permission"
        />
      );
    }

    if (error && !data) {
      return (
        <ErrorState
          icon={<AlertTriangle size={48} />}
          title="Weather Data Unavailable"
          message={error}
          onRetry={refresh}
        />
      );
    }

    if (isLoading) return <LoadingSkeleton />;

    if (data) {
      return (
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
      );
    }

    return null;
  };

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
          <AnimatePresence mode="wait">
            {renderState()}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

function ErrorState({ icon, title, message, onRetry, retryText = "Try again" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-3xl p-10 text-center text-white mt-8 border border-white/10"
    >
      <div className="flex justify-center mb-6 text-white/40">{icon}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all active:scale-95"
        >
          {retryText}
        </button>
      )}
    </motion.div>
  );
}
