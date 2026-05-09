/**
 * CurrentWeather.jsx
 * -------------------
 * The hero card showing:
 *   - City name & country
 *   - Big temperature
 *   - Weather condition label + animated icon
 *   - Feels-like temp, high/low, sunrise/sunset
 */

import { motion } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, CloudFog, CloudSun, Snowflake, Wind
} from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherCodes';
import { roundTemp, formatCurrentTime } from '../utils/formatters';

// Map icon name strings (from weatherCodes) to actual Lucide components
const ICONS = {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, CloudFog, CloudSun, Snowflake, Wind
};

export default function CurrentWeather({ current, daily, cityName, isDay }) {
  const code     = current.weather_code;
  const info     = getWeatherInfo(code);
  const IconComp = ICONS[info.icon] ?? Cloud;

  const temp       = roundTemp(current.temperature_2m);
  const feelsLike  = roundTemp(current.apparent_temperature);
  const highTemp   = daily?.temperature_2m_max?.[0] != null ? roundTemp(daily.temperature_2m_max[0]) : '—';
  const lowTemp    = daily?.temperature_2m_min?.[0] != null ? roundTemp(daily.temperature_2m_min[0]) : '—';
  const periodLabel = isDay ? 'Day' : 'Night';

  // Icon animation variants
  const iconVariants = {
    sunny:  { rotate: [0, 10, -10, 0], transition: { repeat: Infinity, duration: 6 } },
    cloudy: { y:      [0,  -6,   0],   transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' } },
    rain:   { y:      [0,   4,   0],   transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' } },
    snow:   { rotate: [0, 360],        transition: { repeat: Infinity, duration: 12, ease: 'linear' } },
    thunder: { scale: [1, 1.15, 1],   transition: { repeat: Infinity, duration: 0.8 } },
    fog:    { opacity: [0.7, 1, 0.7], transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' } },
    default: {},
  };
  const animVariant = iconVariants[info.animation] ?? iconVariants.default;
  const cardVariants = {
    sunny: { boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(250, 204, 21, 0.12)' },
    cloudy: { boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(148, 163, 184, 0.10)' },
    rain: { boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(56, 189, 248, 0.16)' },
    snow: { boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(191, 219, 254, 0.14)' },
    thunder: { boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(129, 140, 248, 0.18)' },
    fog: { boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(203, 213, 225, 0.10)' },
  };
  const cardStyle = cardVariants[info.animation] ?? cardVariants.cloudy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative rounded-[2.5rem] overflow-hidden"
    >
      {/* Premium background with subtle gradient */}
      <div className="absolute inset-0 glass border border-white/10" />
      
      {/* Dynamic gradient overlay based on weather */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Animated glow effect */}
      <motion.div
        animate={animVariant}
        className="absolute -top-12 right-0 w-48 h-48 rounded-full bg-white/8 blur-3xl opacity-40"
      />

      {/* Content */}
      <div className="relative z-10 px-6 sm:px-8 lg:px-10 py-10 sm:py-12 lg:py-14 text-center text-white space-y-4 sm:space-y-6">
        {/* Location header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <p className="text-sm sm:text-base font-medium tracking-wide text-white/70">
            {cityName}
          </p>
          <p className="text-[11px] sm:text-xs text-white/50 tracking-[0.28em] uppercase">
            {periodLabel} · {formatCurrentTime()}
          </p>
        </motion.div>

        {/* Animated weather icon */}
        <motion.div
          animate={animVariant}
          className="flex justify-center py-3 sm:py-5"
        >
          <IconComp
            size={120}
            strokeWidth={1}
            className="text-white drop-shadow-lg"
          />
        </motion.div>

        {/* Big temperature — HERO */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-2"
        >
          <p className="text-hero font-bold tracking-tighter leading-none">
            {temp}°
          </p>
          <p className="text-h3 sm:text-h2 font-semibold text-white/90">
            {info.condition}
          </p>
        </motion.div>

        {/* Detailed info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10"
        >
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">Feels Like</p>
            <p className="text-h4 font-semibold text-white/90">{feelsLike}°</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">High</p>
            <p className="text-h4 font-semibold text-white/90">{highTemp}°</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">Low</p>
            <p className="text-h4 font-semibold text-white/90">{lowTemp}°</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
