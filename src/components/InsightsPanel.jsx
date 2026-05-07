import { useStore } from '../store/useStore';
import { getAstronomyData } from '../utils/astronomy';
import { Sparkles, Moon, Sun, Wind, AlertTriangle } from 'lucide-react';

export default function InsightsPanel() {
  const { coords, weatherData, aqiData } = useStore();

  if (!coords || !weatherData) return null;

  const current = weatherData.current;
  const astro = getAstronomyData(coords.lat, coords.lon);
  
  const insights = [];

  // Astronomy insight
  if (astro) {
    if (astro.sun.isDay) {
      insights.push({
        id: 'astro-day',
        icon: Sun,
        color: 'text-yellow-400',
        text: `Sunset will be at ${astro.sun.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    } else {
      insights.push({
        id: 'astro-night',
        icon: Moon,
        color: 'text-indigo-300',
        text: `The moon is currently a ${astro.moon.phaseName}.`
      });
    }
  }

  // AQI / Wind insight
  if (aqiData) {
    const aqi = aqiData.european_aqi;
    const windSpeed = current.wind_speed_10m || 0;
    
    if (aqi > 100 && windSpeed < 10) {
      insights.push({
        id: 'aqi-bad-wind',
        icon: AlertTriangle,
        color: 'text-red-400',
        text: 'High pollution due to low wind stagnation. Avoid prolonged outdoor exertion.'
      });
    } else if (aqi > 100 && current.precipitation > 0) {
      insights.push({
        id: 'aqi-rain',
        icon: Sparkles,
        color: 'text-blue-300',
        text: 'Rain may soon improve the current poor air quality.'
      });
    } else if (aqi < 50) {
      insights.push({
        id: 'aqi-good',
        icon: Wind,
        color: 'text-green-300',
        text: 'Air quality is excellent right now. Perfect time for outdoor activities!'
      });
    }
  }

  // Extreme weather insight
  if (current.temperature_2m > 35) {
    insights.push({ id: 'heat', icon: AlertTriangle, color: 'text-orange-400', text: 'Extreme heat detected. Stay hydrated.' });
  } else if (current.temperature_2m < 0) {
    insights.push({ id: 'cold', icon: AlertTriangle, color: 'text-blue-200', text: 'Freezing temperatures. Frost possible.' });
  }

  if (insights.length === 0) return null;

  return (
    <div className="glass rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400" />
      <h3 className="text-white/80 font-medium flex items-center gap-2">
        <Sparkles size={18} /> Environmental Insights
      </h3>
      
      <div className="flex flex-col gap-3">
        {insights.map(item => (
          <div key={item.id} className="flex gap-3 items-start bg-white/5 p-3 rounded-2xl">
            <item.icon size={18} className={`mt-0.5 shrink-0 ${item.color}`} />
            <p className="text-sm text-white/90 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
