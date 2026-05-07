/**
 * HourlyForecast.jsx
 * -------------------
 * Horizontally scrollable strip showing weather hour-by-hour for the next 24 hours.
 * Each item shows: time, condition icon, temperature, precipitation probability.
 */

import { motion } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, CloudFog, CloudSun, Snowflake, Droplets
} from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherCodes';
import { formatHour, roundTemp } from '../utils/formatters';

const ICONS = {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, CloudFog, CloudSun, Snowflake
};

// Stagger animation for each item entering
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function HourlyForecast({ hourly }) {
  // hourly comes from Open-Meteo; it has 168 hours (7 days × 24).
  // We only show the next 24 hours.
  const hours = hourly.time.slice(0, 24).map((time, i) => ({
    time:    time,
    temp:    hourly.temperature_2m[i],
    code:    hourly.weather_code[i],
    precip:  hourly.precipitation_probability[i] ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass rounded-2xl px-4 pt-4 pb-2"
    >
      {/* Section title */}
      <p className="text-xs text-white/50 uppercase tracking-widest mb-3 font-medium px-1">
        Hourly Forecast
      </p>

      {/* Scrollable strip */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex gap-1 overflow-x-auto scroll-hidden pb-2"
      >
        {hours.map(({ time, temp, code, precip }, i) => {
          const info     = getWeatherInfo(code);
          const IconComp = ICONS[info.icon] ?? Cloud;
          const isNow    = i === 0;

          return (
            <motion.div
              key={time}
              variants={itemVariants}
              className={`
                flex-shrink-0 flex flex-col items-center gap-1.5
                px-3 py-3 rounded-xl min-w-[60px] transition-colors
                ${isNow ? 'bg-white/15' : 'hover:bg-white/8'}
              `}
            >
              {/* Time */}
              <span className="text-xs text-white/60 font-medium">
                {isNow ? 'Now' : formatHour(time)}
              </span>

              {/* Icon */}
              <IconComp size={22} strokeWidth={1.5} className="text-white" />

              {/* Temp */}
              <span className="text-sm font-semibold text-white">
                {roundTemp(temp)}°
              </span>

              {/* Precipitation probability (only if >10%) */}
              {precip > 10 && (
                <span className="flex items-center gap-0.5 text-blue-300 text-xs">
                  <Droplets size={10} />
                  {precip}%
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
