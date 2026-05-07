/**
 * WeatherAlerts.jsx
 * ------------------
 * Displays weather alert banners if any alerts are present.
 * Open-Meteo doesn't explicitly provide alerts in all regions,
 * so we synthesize basic threshold-based alerts from current conditions.
 *
 * Alert types generated:
 *  - Extreme UV (>= 8)
 *  - High wind (>= 60 km/h)
 *  - Heavy rain (precipitation >= 10mm/h)
 *  - Poor air quality (AQI > 150)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wind, Droplets, Activity, Sun, X } from 'lucide-react';
import { useState } from 'react';

function buildAlerts(current, aqi) {
  const alerts = [];

  if ((current.uv_index ?? 0) >= 8) {
    alerts.push({
      id:      'uv',
      icon:    Sun,
      title:   'Extreme UV Warning',
      message: `UV index is ${Math.round(current.uv_index)}. Limit direct sun exposure.`,
      color:   'border-orange-400/40 bg-orange-400/10',
      text:    'text-orange-300',
    });
  }

  if ((current.wind_speed_10m ?? 0) >= 60) {
    alerts.push({
      id:      'wind',
      icon:    Wind,
      title:   'High Wind Advisory',
      message: `Wind speeds of ${Math.round(current.wind_speed_10m)} km/h. Take care outdoors.`,
      color:   'border-blue-400/40 bg-blue-400/10',
      text:    'text-blue-300',
    });
  }

  if ((current.precipitation ?? 0) >= 10) {
    alerts.push({
      id:      'rain',
      icon:    Droplets,
      title:   'Heavy Precipitation',
      message: `${current.precipitation}mm/h rainfall. Localised flooding possible.`,
      color:   'border-cyan-400/40 bg-cyan-400/10',
      text:    'text-cyan-300',
    });
  }

  const aqiVal = aqi?.european_aqi ?? 0;
  if (aqiVal > 150) {
    alerts.push({
      id:      'aqi',
      icon:    Activity,
      title:   'Poor Air Quality',
      message: `AQI is ${aqiVal}. Sensitive groups should stay indoors.`,
      color:   'border-purple-400/40 bg-purple-400/10',
      text:    'text-purple-300',
    });
  }

  return alerts;
}

export default function WeatherAlerts({ current, aqi }) {
  const alerts = buildAlerts(current, aqi);
  const [dismissed, setDismissed] = useState(new Set());

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/50 uppercase tracking-widest mb-1 font-medium px-1">
        Alerts
      </p>
      <AnimatePresence>
        {visible.map(alert => {
          const Icon = alert.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{    opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-2xl border px-4 py-3 flex gap-3 items-start ${alert.color}`}
            >
              <AlertTriangle size={16} className={`${alert.text} mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${alert.text}`}>{alert.title}</p>
                <p className="text-xs text-white/60 mt-0.5">{alert.message}</p>
              </div>
              <button
                onClick={() => setDismissed(d => new Set([...d, alert.id]))}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
