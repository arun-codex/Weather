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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass rounded-3xl px-8 py-10 text-center text-white space-y-2"
    >
      {/* City name */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-base font-medium tracking-wide text-white/80"
      >
        {cityName}
      </motion.p>

      {/* Time */}
      <p className="text-xs text-white/50 tracking-widest uppercase">
        {formatCurrentTime()}
      </p>

      {/* Animated weather icon */}
      <motion.div
        animate={animVariant}
        className="flex justify-center my-4"
      >
        <IconComp
          size={80}
          strokeWidth={1.2}
          className="text-white drop-shadow-lg"
        />
      </motion.div>

      {/* Big temperature */}
      <motion.p
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-8xl font-black tracking-tighter leading-none"
      >
        {temp}°
      </motion.p>

      {/* Condition label */}
      <p className="text-lg font-light text-white/90 mt-1">
        {info.label}
      </p>

      {/* High / Low / Feels Like */}
      <div className="flex items-center justify-center gap-4 mt-3 text-sm text-white/60">
        <span>H: <span className="text-white font-medium">{highTemp}°</span></span>
        <span className="w-px h-4 bg-white/20" />
        <span>L: <span className="text-white font-medium">{lowTemp}°</span></span>
        <span className="w-px h-4 bg-white/20" />
        <span>Feels <span className="text-white font-medium">{feelsLike}°</span></span>
      </div>
    </motion.div>
  );
}
