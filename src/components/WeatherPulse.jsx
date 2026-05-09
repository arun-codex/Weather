/**
 * LifestyleInsights.jsx
 * ---------------------
 * Premium lifestyle guidance card:
 * - best workout time
 * - best travel time
 * - study mode
 * - mood insight
 */

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Dumbbell, PlaneTakeoff, BookOpen, Sparkles, TimerReset, MoonStar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatHour, getAqiInfo } from '../utils/formatters';

function InsightCard({ icon: Icon, title, value, description, accent = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-w-0">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/45">
        <Icon size={12} />
        <span>{title}</span>
      </div>
      <p className={`mt-2 text-base font-semibold ${accent} break-words`}>{value}</p>
      <p className="mt-1 text-sm text-white/60 leading-relaxed break-words">{description}</p>
    </div>
  );
}

function scoreHour(hourly, index, aqiValue) {
  const temp = hourly.temperature_2m[index] ?? 0;
  const wind = hourly.wind_speed_10m?.[index] ?? 0;
  const precip = hourly.precipitation_probability[index] ?? 0;
  const code = hourly.weather_code[index] ?? 0;

  let score = 100;
  score -= Math.abs(temp - 24) * 3;
  score -= wind * 1.8;
  score -= precip * 1.6;
  score -= aqiValue >= 100 ? 15 : 0;
  score -= code >= 60 ? 15 : 0;
  return score;
}

export default function LifestyleInsights({ current, hourly, daily, aqi, cityName }) {
  const { coords } = useStore();

  const lifestyle = useMemo(() => {
    if (!current || !hourly?.time?.length) return null;

    const aqiValue = aqi?.european_aqi ?? aqi?.us_aqi ?? null;
    const aqiInfo = getAqiInfo(aqiValue);
    const currentTemp = current.temperature_2m ?? 0;
    const feelsLike = current.apparent_temperature ?? currentTemp;
    const windSpeed = current.wind_speed_10m ?? 0;
    const rainNow = current.precipitation ?? 0;
    const humidity = current.relative_humidity_2m ?? 0;
    const isNight = current.is_day === 0;

    const next12 = hourly.time.slice(0, 12).map((time, index) => ({ time, index }));
    const workoutSlot = next12.reduce((best, item) => {
      const score = scoreHour(hourly, item.index, aqiValue ?? 0);
      return score > best.score ? { score, index: item.index } : best;
    }, { score: -Infinity, index: 0 });

    const travelSlot = next12.reduce((best, item) => {
      const precip = hourly.precipitation_probability[item.index] ?? 0;
      const wind = hourly.wind_speed_10m?.[item.index] ?? 0;
      const temp = hourly.temperature_2m[item.index] ?? 0;
      const score = 100 - precip * 2 - wind * 1.5 - Math.abs(temp - 23) * 2;
      return score > best.score ? { score, index: item.index } : best;
    }, { score: -Infinity, index: 0 });

    const workoutTime = formatHour(hourly.time[workoutSlot.index]);
    const travelTime = formatHour(hourly.time[travelSlot.index]);

    const studyMode = (() => {
      if (aqiValue !== null && aqiValue >= 100) return 'Indoor deep-work mode';
      if (currentTemp >= 30 || feelsLike >= 35 || rainNow > 0) return 'Best for focused indoor blocks';
      if (windSpeed >= 25) return 'Quiet indoor focus, keep tasks steady';
      return 'Balanced focus mode with light breaks';
    })();

    const mood = (() => {
      if (aqiValue !== null && aqiValue >= 150) return 'Keep things slow. The air needs you to stay inside more than usual.';
      if (currentTemp >= 38 || feelsLike >= 40) return 'A hot day, so pace yourself and keep hydration within reach.';
      if (rainNow > 0) return 'A softer day with rain in the mix. Good for calm, indoor momentum.';
      if (aqiValue !== null && aqiValue <= 50 && currentTemp >= 20 && currentTemp <= 32) return 'Clean air and friendly temperatures make this a good day to move.';
      return isNight ? 'Night is quiet and usable for slow planning or a reset.' : 'A balanced weather window for steady progress.';
    })();

    const workoutDescription = aqiValue !== null && aqiValue >= 100
      ? 'Skip hard cardio outside. Use a gym, home workout, or later indoor session.'
      : `Best around ${workoutTime} when the air feels steadier and temperatures are kinder.`;

    const travelDescription = rainNow > 0 || (hourly.precipitation_probability[travelSlot.index] ?? 0) > 20
      ? `Travel before ${travelTime} if possible. That window looks lighter.`
      : `Travel looks easiest around ${travelTime}, when wind and heat stay more manageable.`;

    const studyDescription = humidity > 75 && currentTemp > 24
      ? 'Humidity may make you feel sluggish. Keep study sessions short and room temperatures steady.'
      : 'Use this as your reliable indoor focus mode. It is a good day for coding, studying, or planning.';

    return {
      workoutTime,
      travelTime,
      studyMode,
      mood,
      workoutDescription,
      travelDescription,
      studyDescription,
      isNight,
      aqiLabel: aqiInfo.label,
      cityLabel: cityName || (coords ? `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}` : 'your area'),
    };
  }, [current, hourly, daily, aqi, cityName, coords]);

  if (!lifestyle) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass rounded-3xl p-5 lg:p-6 border border-white/10 relative overflow-hidden min-w-0"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-amber-300" />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-white/45 text-xs uppercase tracking-[0.24em]">Lifestyle Insights</p>
          <h3 className="text-white text-lg font-semibold mt-1">Best windows for work, movement, and travel</h3>
          <p className="text-white/60 text-sm mt-1">For {lifestyle.cityLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Mood</p>
          <p className="text-sm text-white/90 mt-1 max-w-[11rem] leading-relaxed">{lifestyle.mood}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InsightCard
          icon={Dumbbell}
          title="Best workout time"
          value={lifestyle.workoutTime}
          description={lifestyle.workoutDescription}
          accent="text-white"
        />
        <InsightCard
          icon={PlaneTakeoff}
          title="Best travel time"
          value={lifestyle.travelTime}
          description={lifestyle.travelDescription}
          accent="text-white"
        />
        <InsightCard
          icon={BookOpen}
          title="Study mode"
          value={lifestyle.studyMode}
          description={lifestyle.studyDescription}
          accent="text-white"
        />
        <InsightCard
          icon={Sparkles}
          title="Air + mood"
          value={lifestyle.aqiLabel}
          description={lifestyle.mood}
          accent="text-white"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/65">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2">
          <TimerReset size={13} className="text-cyan-300" />
          <span>Good for timed focus blocks</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2">
          <MoonStar size={13} className="text-indigo-300" />
          <span>{lifestyle.isNight ? 'Night reset mode' : 'Daytime momentum mode'}</span>
        </div>
      </div>
    </motion.div>
  );
}