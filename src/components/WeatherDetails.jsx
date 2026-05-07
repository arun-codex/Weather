/**
 * WeatherDetails.jsx
 * -------------------
 * A grid of detail tiles showing:
 *   - Humidity
 *   - Wind speed + direction
 *   - UV Index
 *   - Pressure
 *   - Air Quality Index (AQI)
 *   - Precipitation (today)
 *   - Sunrise / Sunset (from daily)
 *   - Visibility (fallback — not always in API)
 */

import {
  Droplets, Wind, Sun, Gauge, Activity,
  CloudRain, Sunrise, Sunset
} from 'lucide-react';
import { describeWind, degToCompass, getAqiInfo, getUvInfo } from '../utils/formatters';

// A single detail tile
function Tile({ icon: Icon, label, value, sub, accent }) {
  return (
    <div
      className="glass rounded-2xl p-4 space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Icon size={14} className="text-white/50" />
        <span className="text-xs text-white/50 uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-white/50">{sub}</p>}
    </div>
  );
}

// Format time from ISO string "2024-03-22T06:10" → "6:10 AM"
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function WeatherDetails({ current, daily, aqi }) {
  const aqiValue  = aqi?.european_aqi ?? null;
  const aqiInfo   = getAqiInfo(aqiValue);
  const uvInfo    = getUvInfo(current.uv_index);

  const windDir   = degToCompass(current.wind_direction_10m ?? 0);
  const windDesc  = describeWind(current.wind_speed_10m ?? 0);

  const sunrise   = daily?.sunrise?.[0];
  const sunset    = daily?.sunset?.[0];

  return (
    <div>
      <p className="text-xs text-white/50 uppercase tracking-widest mb-3 font-medium px-1">
        Details
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Humidity */}
        <Tile
          icon={Droplets}
          label="Humidity"
          value={`${current.relative_humidity_2m}%`}
          sub={current.relative_humidity_2m > 70 ? 'Feels muggy' : 'Comfortable'}
        />

        {/* Wind */}
        <Tile
          icon={Wind}
          label="Wind"
          value={`${Math.round(current.wind_speed_10m)} km/h`}
          sub={`${windDir} · ${windDesc}`}
        />

        {/* UV Index */}
        <Tile
          icon={Sun}
          label="UV Index"
          value={Math.round(current.uv_index ?? 0)}
          sub={uvInfo.label}
          accent={uvInfo.color}
        />

        {/* Pressure */}
        <Tile
          icon={Gauge}
          label="Pressure"
          value={`${Math.round(current.surface_pressure ?? 0)}`}
          sub="hPa"
        />

        {/* AQI */}
        <Tile
          icon={Activity}
          label="Air Quality"
          value={aqiValue !== null ? aqiValue : 'N/A'}
          sub={aqiInfo.label}
          accent={aqiInfo.color}
        />

        {/* Precipitation */}
        <Tile
          icon={CloudRain}
          label="Precipitation"
          value={`${current.precipitation ?? 0} mm`}
          sub="Past hour"
        />

        {/* Sunrise */}
        <Tile
          icon={Sunrise}
          label="Sunrise"
          value={fmtTime(sunrise)}
          sub="Local time"
        />

        {/* Sunset */}
        <Tile
          icon={Sunset}
          label="Sunset"
          value={fmtTime(sunset)}
          sub="Local time"
        />
      </div>
    </div>
  );
}
