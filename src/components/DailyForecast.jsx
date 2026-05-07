/**
 * DailyForecast.jsx
 * ------------------
 * 7-day forecast list. Each row shows:
 *   - Day name (Mon, Tue…)
 *   - Condition icon
 *   - Precipitation probability
 *   - Temperature range bar (low → high)
 */

import { motion } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, CloudFog, CloudSun, Snowflake, Droplets
} from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherCodes';
import { formatDay, roundTemp } from '../utils/formatters';

const ICONS = {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, CloudFog, CloudSun, Snowflake
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show:   (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
};

export default function DailyForecast({ daily }) {
  // Calculate the absolute temp range across all 7 days for the bar scaling
  const allTemps = [...daily.temperature_2m_max, ...daily.temperature_2m_min];
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const range     = globalMax - globalMin || 1; // avoid /0

  const days = daily.time.map((time, i) => ({
    time,
    code:    daily.weather_code[i],
    high:    daily.temperature_2m_max[i],
    low:     daily.temperature_2m_min[i],
    precip:  daily.precipitation_probability_max[i] ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass rounded-2xl px-5 py-4"
    >
      {/* Section title */}
      <p className="text-xs text-white/50 uppercase tracking-widest mb-4 font-medium">
        7-Day Forecast
      </p>

      <div className="space-y-3">
        {days.map(({ time, code, high, low, precip }, i) => {
          const info     = getWeatherInfo(code);
          const IconComp = ICONS[info.icon] ?? Cloud;

          // Position the bar within the global range
          const barLeft  = ((low  - globalMin) / range) * 100;
          const barWidth = ((high - low)        / range) * 100;

          return (
            <motion.div
              key={time}
              custom={i}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              className="flex items-center gap-3"
            >
              {/* Day label */}
              <span className="text-sm font-medium text-white/80 w-9 flex-shrink-0">
                {i === 0 ? 'Today' : formatDay(time)}
              </span>

              {/* Icon */}
              <IconComp size={18} strokeWidth={1.5} className="text-white flex-shrink-0" />

              {/* Precipitation probability */}
              {precip > 10 ? (
                <span className="flex items-center gap-0.5 text-blue-300 text-xs w-10 flex-shrink-0">
                  <Droplets size={10} /> {precip}%
                </span>
              ) : (
                <span className="w-10 flex-shrink-0" />
              )}

              {/* Low temp */}
              <span className="text-xs text-white/50 w-8 text-right flex-shrink-0">
                {roundTemp(low)}°
              </span>

              {/* Gradient range bar */}
              <div className="relative flex-1 h-1.5 rounded-full bg-white/10">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-400"
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
              </div>

              {/* High temp */}
              <span className="text-xs font-semibold text-white w-8 flex-shrink-0">
                {roundTemp(high)}°
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
