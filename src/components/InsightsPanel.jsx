import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getAstronomyData } from '../utils/astronomy';
import {
  Sparkles,
  Sun,
  Moon,
  Shirt,
  ShieldAlert,
  BookOpen,
  Activity,
} from 'lucide-react';

function Section({ title, items, icon: Icon, emptyText }) {
  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
        <Icon size={13} />
        <span>{title}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 leading-relaxed break-words">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 break-words">
          {emptyText}
        </p>
      )}
    </div>
  );
}

export default function InsightsPanel() {
  const { coords, weatherData, aqiData } = useStore();

  const recommendation = useMemo(() => {
    if (!coords || !weatherData) return null;

    const current = weatherData.current;
    const daily = weatherData.daily;
    const astro = getAstronomyData(coords.lat, coords.lon);

    const temperature = current.temperature_2m ?? 0;
    const feelsLike = current.apparent_temperature ?? temperature;
    const humidity = current.relative_humidity_2m ?? 0;
    const windSpeed = current.wind_speed_10m ?? 0;
    const uvIndex = current.uv_index ?? 0;
    const precipitation = current.precipitation ?? 0;
    const visibility = current.visibility ?? 999999;
    const aqi = aqiData?.european_aqi ?? aqiData?.us_aqi ?? null;
    const isDay = current.is_day === 1 || astro?.sun?.isDay;
    const sunrise = daily?.sunrise?.[0];
    const sunset = daily?.sunset?.[0];
    const weatherCode = current.weather_code ?? 0;
    const condition = weatherCode >= 60 || precipitation > 0
      ? 'rain'
      : weatherCode >= 45
        ? 'fog'
        : weatherCode >= 70
          ? 'snow'
          : weatherCode >= 95
            ? 'storm'
            : temperature > 30
              ? 'hot'
              : temperature < 10
                ? 'cold'
                : 'clear';

    const weatherSummary = isDay
      ? `Daytime ${condition} conditions in ${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}.`
      : `Night conditions with ${condition} weather and cooler air.`;

    const whatToDo = [];
    const whatToAvoid = [];
    const clothing = [];
    const healthAlerts = [];
    const productivityTips = [];

    if (temperature >= 38 || feelsLike >= 40) {
      whatToDo.push('Drink extra water and stay in shade during peak heat.');
      whatToAvoid.push('Avoid heavy workouts and long walks in direct sun.');
      clothing.push('Light cotton clothing');
      clothing.push('Hat and sunglasses');
      healthAlerts.push('Heat and dehydration risk');
    } else if (temperature <= 8) {
      whatToDo.push('Layer up before heading out, especially early morning.');
      whatToAvoid.push('Avoid staying outside too long if you are sensitive to cold.');
      clothing.push('Hoodie or jacket');
      clothing.push('Closed shoes');
      healthAlerts.push('Cold exposure warning');
    } else {
      whatToDo.push('Good day for normal routines and light outdoor time.');
      clothing.push('Comfortable daily wear');
    }

    if (precipitation > 0 || weatherCode >= 60) {
      whatToDo.push('Carry an umbrella or rain layer if you go out.');
      whatToAvoid.push('Avoid slippery shortcuts and exposed electronics.');
      clothing.push('Waterproof outerwear');
      healthAlerts.push('Rain-ready travel caution');
    }

    if (windSpeed >= 30) {
      whatToDo.push('Secure loose items before leaving home.');
      whatToAvoid.push('Avoid biking or balcony time in strong gusts.');
      healthAlerts.push('Strong wind caution');
    } else if (windSpeed >= 15) {
      whatToDo.push('Plan lighter outdoor tasks if you stay outside.');
    }

    if (uvIndex >= 7) {
      whatToDo.push('Use sunscreen before midday outdoor exposure.');
      whatToAvoid.push('Avoid long sun exposure around noon.');
      clothing.push('Sunglasses');
      healthAlerts.push('High UV warning');
    }

    if (aqi !== null) {
      if (aqi >= 150) {
        whatToDo.push('Keep activity indoors and close windows if possible.');
        whatToAvoid.push('Avoid outdoor cardio and long commutes on foot.');
        healthAlerts.push('Pollution warning');
      } else if (aqi >= 100) {
        whatToDo.push('Short outdoor trips are fine, but keep exertion light.');
        whatToAvoid.push('Avoid intense workouts outside.');
        healthAlerts.push('Sensitive groups should limit exposure');
      } else if (aqi <= 50) {
        whatToDo.push('Great air quality for a run or an evening walk.');
        productivityTips.push('Best window for outdoor exercise: now to early evening.');
      }
    }

    if (humidity >= 75 && temperature >= 24) {
      healthAlerts.push('Muggy air may feel tiring today');
      whatToDo.push('Keep breaks short and drink more water than usual.');
    }

    if (visibility < 5000) {
      whatToAvoid.push('Avoid fast driving and early highway travel.');
      productivityTips.push('Use indoor focus blocks until visibility improves.');
    }

    if (sunrise && sunset) {
      const sunriseText = new Date(sunrise).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const sunsetText = new Date(sunset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      productivityTips.push(`Best outdoor window: ${sunriseText} to ${sunsetText}.`);
    }

    if (temperature >= 25 && temperature <= 34 && aqi !== null && aqi < 100 && windSpeed < 20) {
      productivityTips.push('Good day for a short walk, errands, or content creation outdoors.');
    } else if (temperature >= 30 || feelsLike >= 35 || (aqi !== null && aqi >= 100)) {
      productivityTips.push('Best time for study, coding, or indoor work is the afternoon.');
    } else if (temperature <= 12 || condition === 'rain') {
      productivityTips.push('Indoor work blocks will feel more productive than long outings.');
    }

    if (condition === 'rain') {
      clothing.unshift('Waterproof footwear');
      whatToDo.push('Leave a little earlier if you need to travel.');
      productivityTips.push('If possible, schedule travel before the rain window.');
    }

    if (condition === 'hot') {
      productivityTips.push('Morning is better for errands; midday is for indoor tasks.');
    }

    if (condition === 'cold') {
      productivityTips.push('Late morning is the safest slot for a quick walk.');
    }

    if (condition === 'storm') {
      whatToAvoid.push('Avoid open areas and unnecessary travel if storms build up.');
      healthAlerts.push('Thunderstorm safety alert');
      productivityTips.push('Keep plans flexible and stay near shelter.');
    }

    const moodMessage = (() => {
      if (condition === 'rain') return 'Rain is around, so keep plans light and travel a bit earlier.';
      if (condition === 'hot') return 'A hot day ahead, so pace yourself and keep water close.';
      if (aqi !== null && aqi >= 150) return 'Air quality is poor today. Indoor comfort is the safer call.';
      if (aqi !== null && aqi <= 50 && temperature >= 20 && temperature <= 32) return 'Clean air and decent temperatures make this a good day to move.';
      if (!isDay) return 'Night looks calm enough for a slow, quiet reset.';
      return 'A balanced day for getting things done without overdoing it.';
    })();

    const unique = (items) => [...new Set(items)].slice(0, 4);

    return {
      weather_summary: weatherSummary,
      what_to_do: unique(whatToDo),
      what_to_avoid: unique(whatToAvoid),
      clothing: unique(clothing),
      health_alerts: unique(healthAlerts),
      productivity_tips: unique(productivityTips),
      mood_message: moodMessage,
    };
  }, [coords, weatherData, aqiData]);

  if (!recommendation) return null;

  return (
    <div className="glass rounded-3xl p-5 lg:p-6 flex flex-col gap-4 relative overflow-hidden min-w-0">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-300" />
      <div className="space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Sparkles size={18} /> Smart Weather Suggestions
          </h3>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
            Mood
          </span>
        </div>
        <p className="text-white/55 text-sm leading-relaxed break-words">Practical advice from the current weather mix.</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Mood message</p>
          <p className="text-sm text-white/90 mt-1 leading-relaxed break-words">{recommendation.mood_message}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Weather summary</p>
        <p className="text-sm text-white/90 leading-relaxed break-words">{recommendation.weather_summary}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="What to do today" items={recommendation.what_to_do.slice(0, 2)} icon={Activity} emptyText="Keep your normal routine, with light outdoor activity if you want it." />
        <Section title="What to avoid" items={recommendation.what_to_avoid.slice(0, 2)} icon={ShieldAlert} emptyText="No major avoidances right now." />
        <Section title="Clothing" items={recommendation.clothing.slice(0, 2)} icon={Shirt} emptyText="Comfortable everyday wear should work." />
        <Section title="Health alerts" items={recommendation.health_alerts.slice(0, 2)} icon={ShieldAlert} emptyText="No major health alerts detected." />
        <Section title="Productivity tips" items={recommendation.productivity_tips.slice(0, 2)} icon={BookOpen} emptyText="Indoor focus blocks and light errands both look fine." />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-white/65">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2">
          <Sun size={13} className="text-yellow-300" />
          <span>Day and sun aware</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2">
          <Moon size={13} className="text-indigo-300" />
          <span>Night and rest aware</span>
        </div>
      </div>
    </div>
  );
}
