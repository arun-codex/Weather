/**
 * WeatherPulse.jsx
 * ----------------
 * A compact utility panel replacing the old timeline scrubber.
 * Shows the next few hours, a condition-aware tip, and a small animated pulse.
 */

import { motion } from 'framer-motion';
import { AlertTriangle, CloudRain, SunMedium, Wind, Snowflake, CloudFog } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherCodes';
import { formatHour, roundTemp } from '../utils/formatters';

const CONDITION_TIPS = {
  sunny: {
    title: 'Bright and clear',
    tip: 'Great time to go outside. Use sun protection and stay hydrated.',
    icon: SunMedium,
    accent: 'from-amber-300 to-orange-400',
  },
  cloudy: {
    title: 'Stable cloud cover',
    tip: 'Good for a calm day. Carry a light layer if you are heading out late.',
    icon: CloudFog,
    accent: 'from-slate-300 to-slate-500',
  },
  rain: {
    title: 'Rain incoming',
    tip: 'Take an umbrella and avoid long outdoor plans if the rain strengthens.',
    icon: CloudRain,
    accent: 'from-sky-300 to-blue-500',
  },
  snow: {
    title: 'Cold weather ahead',
    tip: 'Dress in layers and watch for slippery surfaces on the road.',
    icon: Snowflake,
    accent: 'from-cyan-200 to-sky-400',
  },
  thunder: {
    title: 'Storm activity',
    tip: 'Stay indoors if possible and avoid exposed areas during lightning.',
    icon: AlertTriangle,
    accent: 'from-violet-300 to-fuchsia-400',
  },
  fog: {
    title: 'Low visibility',
    tip: 'Drive carefully and allow extra time for your commute.',
    icon: CloudFog,
    accent: 'from-zinc-300 to-slate-500',
  },
};

export default function WeatherPulse({ current, hourly, animation }) {
  if (!current || !hourly?.time?.length) return null;

  const weatherInfo = getWeatherInfo(current.weather_code);
  const tone = CONDITION_TIPS[animation] ?? CONDITION_TIPS.cloudy;
  const AccentIcon = tone.icon;

  const nextHours = hourly.time.slice(0, 6).map((time, index) => ({
    time,
    temp: hourly.temperature_2m[index],
    precip: hourly.precipitation_probability[index] ?? 0,
  }));

  const pulseVariants = {
    sunny: { scale: [1, 1.02, 1], transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } },
    cloudy: { x: [0, 3, 0], transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' } },
    rain: { y: [0, 2, 0], transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } },
    snow: { rotate: [0, 1.5, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } },
    thunder: { scale: [1, 1.03, 1], transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } },
    fog: { opacity: [0.75, 1, 0.75], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl border border-white/10 p-5 relative overflow-hidden"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.accent}`} />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-white/45 text-xs uppercase tracking-[0.28em]">Weather pulse</p>
          <h3 className="text-white text-xl font-semibold mt-1">{tone.title}</h3>
          <p className="text-white/65 text-sm mt-1">{weatherInfo.label}</p>
        </div>

        <motion.div
          animate={pulseVariants[animation] ?? pulseVariants.cloudy}
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tone.accent} flex items-center justify-center text-white shadow-lg shadow-black/20`}
        >
          <AccentIcon size={20} />
        </motion.div>
      </div>

      <p className="text-white/80 text-sm leading-relaxed mb-5">
        {tone.tip}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-3">
          <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-[0.24em]">
            <Wind size={11} /> Wind
          </div>
          <div className="text-white font-semibold mt-1">{Math.round(current.wind_speed_10m ?? 0)} km/h</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-3">
          <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-[0.24em]">
            <AccentIcon size={11} /> Condition
          </div>
          <div className="text-white font-semibold mt-1">{weatherInfo.label}</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-3">
          <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-[0.24em]">
            <AlertTriangle size={11} /> Alert
          </div>
          <div className="text-white font-semibold mt-1">{animation === 'thunder' ? 'Stay alert' : 'Normal'}</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Next 6 hours</p>
          <p className="text-white/45 text-xs">Quick glance</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {nextHours.map(({ time, temp, precip }, index) => {
            const isNow = index === 0;
            return (
              <motion.div
                key={time}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border px-3 py-3 text-center ${isNow ? 'bg-white/15 border-white/20' : 'bg-white/5 border-white/10'}`}
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  {isNow ? 'Now' : formatHour(time)}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">{roundTemp(temp)}°</div>
                <div className="mt-1 text-[10px] text-white/50">
                  {precip > 10 ? `${precip}% rain` : 'Dry'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}