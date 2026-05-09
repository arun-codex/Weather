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

import {
  Droplets, Wind, Sun, Gauge, Activity, Eye,
  CloudRain, Sunrise, Sunset
} from 'lucide-react';
import { describeWind, degToCompass, getAqiInfo, getUvInfo } from '../utils/formatters';

function Tile({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-2 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className="text-white/50" />
        <span className="text-xs text-white/50 uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ?? 'text-white'} break-words`}>{value}</p>
      {sub && <p className="text-xs text-white/50 break-words">{sub}</p>}
    </div>
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
    <div className="glass rounded-3xl p-5 lg:p-6 border border-white/10 min-w-0">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-[0.24em] font-medium">
            Environment Data
          </p>
          <p className="text-white/80 text-sm mt-1">Compact live readings</p>
        </div>
        <p className="text-xs text-white/45 uppercase tracking-[0.22em]">Air, light, comfort</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
    </div>
  );
}
