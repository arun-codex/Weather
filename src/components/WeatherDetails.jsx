/**
 * WeatherDetails.jsx
 * -------------------
 * Compact environment data grid showing:
 *   - Humidity
 *   - Wind speed + direction
 *   - UV Index
 *   - Pressure
 *   - Air Quality Index (AQI)
 *   - Precipitation (today)
 *   - Sunrise / Sunset (from daily)
 *   - Visibility (fallback — not always in API)
 */

import { motion } from 'framer-motion';
import {
  Droplets, Wind, Sun, Gauge, Activity, Eye,
  CloudRain, Sunrise, Sunset
} from 'lucide-react';
import { describeWind, degToCompass, getAqiInfo, getUvInfo } from '../utils/formatters';

function Tile({ icon: Icon, label, value, sub, accent }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-4 sm:p-5 space-y-2 min-w-0 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-white/50 flex-shrink-0" />
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${accent ?? 'text-white'} break-words leading-tight`}>{value}</p>
      {sub && <p className="text-xs sm:text-sm text-white/50 break-words">{sub}</p>}
    </motion.div>
  );
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function WeatherDetails({ current, daily, aqi }) {
  const aqiValue = aqi?.european_aqi ?? null;
  const aqiInfo = getAqiInfo(aqiValue);
  const uvInfo = getUvInfo(current.uv_index);

  const windDir = degToCompass(current.wind_direction_10m ?? 0);
  const windDesc = describeWind(current.wind_speed_10m ?? 0);

  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];
  const visibility = current?.visibility ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass rounded-3xl p-5 sm:p-6 lg:p-7 border border-white/10 min-w-0"
    >
      <div className="mb-5 sm:mb-6">
        <p className="text-xs text-white/50 uppercase tracking-[0.24em] font-medium">
          Environment Data
        </p>
        <h3 className="text-white text-h3 font-semibold mt-1">Air, light, and comfort</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Tile
          icon={Droplets}
          label="Humidity"
          value={`${current.relative_humidity_2m}%`}
          sub={current.relative_humidity_2m > 70 ? 'Feels muggy' : 'Comfortable'}
        />

        <Tile
          icon={Wind}
          label="Wind"
          value={`${Math.round(current.wind_speed_10m)} km/h`}
          sub={`${windDir} · ${windDesc}`}
        />

        <Tile
          icon={Sun}
          label="UV Index"
          value={Math.round(current.uv_index ?? 0)}
          sub={uvInfo.label}
          accent={uvInfo.color}
        />

        <Tile
          icon={Activity}
          label="Air Quality"
          value={aqiValue !== null ? aqiValue : 'N/A'}
          sub={aqiInfo.label}
          accent={aqiInfo.color}
        />

        <Tile
          icon={Gauge}
          label="Pressure"
          value={`${Math.round(current.surface_pressure ?? 0)}`}
          sub="hPa"
        />

        <Tile
          icon={Eye}
          label="Visibility"
          value={visibility != null ? `${Math.round(visibility / 1000)} km` : '—'}
          sub={
            visibility == null ? null : (
              visibility >= 10000 ? 'Clear view' :
              visibility >= 5000 ? 'Moderate' : 'Low visibility'
            )
          }
        />

        <Tile
          icon={CloudRain}
          label="Precipitation"
          value={`${current.precipitation ?? 0} mm`}
          sub="Past hour"
        />

        <Tile
          icon={Sunrise}
          label="Sunrise"
          value={fmtTime(sunrise)}
          sub="Local time"
        />

        <Tile
          icon={Sunset}
          label="Sunset"
          value={fmtTime(sunset)}
          sub="Local time"
        />
      </div>
    </motion.div>
  );
}
