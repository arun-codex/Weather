/**
 * weatherCodes.js
 * ---------------
 * Maps WMO Weather Interpretation Codes to human-readable labels,
 * Lucide icon names, and animation category strings.
 *
 * Source: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */

export const WEATHER_CODES = {
  0:  { label: 'Clear Sky',          icon: 'Sun',          animation: 'sunny'  },
  1:  { label: 'Mainly Clear',       icon: 'Sun',          animation: 'sunny'  },
  2:  { label: 'Partly Cloudy',      icon: 'CloudSun',     animation: 'cloudy' },
  3:  { label: 'Overcast',           icon: 'Cloud',        animation: 'cloudy' },
  45: { label: 'Foggy',              icon: 'CloudFog',     animation: 'fog'    },
  48: { label: 'Icy Fog',            icon: 'CloudFog',     animation: 'fog'    },
  51: { label: 'Light Drizzle',      icon: 'CloudDrizzle', animation: 'rain'   },
  53: { label: 'Drizzle',            icon: 'CloudDrizzle', animation: 'rain'   },
  55: { label: 'Heavy Drizzle',      icon: 'CloudDrizzle', animation: 'rain'   },
  61: { label: 'Light Rain',         icon: 'CloudRain',    animation: 'rain'   },
  63: { label: 'Rain',               icon: 'CloudRain',    animation: 'rain'   },
  65: { label: 'Heavy Rain',         icon: 'CloudRain',    animation: 'rain'   },
  71: { label: 'Light Snow',         icon: 'Snowflake',    animation: 'snow'   },
  73: { label: 'Snow',               icon: 'Snowflake',    animation: 'snow'   },
  75: { label: 'Heavy Snowfall',     icon: 'Snowflake',    animation: 'snow'   },
  77: { label: 'Snow Grains',        icon: 'Snowflake',    animation: 'snow'   },
  80: { label: 'Light Showers',      icon: 'CloudRain',    animation: 'rain'   },
  81: { label: 'Showers',            icon: 'CloudRain',    animation: 'rain'   },
  82: { label: 'Heavy Showers',      icon: 'CloudRain',    animation: 'rain'   },
  85: { label: 'Snow Showers',       icon: 'CloudSnow',    animation: 'snow'   },
  86: { label: 'Heavy Snow Showers', icon: 'CloudSnow',    animation: 'snow'   },
  95: { label: 'Thunderstorm',       icon: 'CloudLightning', animation: 'thunder' },
  96: { label: 'Thunderstorm w/ Hail', icon: 'CloudLightning', animation: 'thunder' },
  99: { label: 'Heavy Thunderstorm', icon: 'CloudLightning', animation: 'thunder' },
};

/**
 * Get WMO code info (label, icon name, animation).
 * Falls back gracefully to "Unknown" if code not found.
 */
export function getWeatherInfo(code) {
  return WEATHER_CODES[code] ?? { label: 'Unknown', icon: 'Cloud', animation: 'cloudy' };
}

/**
 * Get the CSS class for the animated background
 * based on animation type and whether it is day or night.
 */
export function getBgClass(animation, isDay) {
  const map = {
    sunny:   isDay ? 'bg-sunny-day'   : 'bg-sunny-night',
    cloudy:  isDay ? 'bg-cloudy-day'  : 'bg-cloudy-night',
    rain:    isDay ? 'bg-rain-day'    : 'bg-rain-night',
    thunder: isDay ? 'bg-thunder-day' : 'bg-thunder-night',
    snow:    isDay ? 'bg-snow-day'    : 'bg-snow-night',
    fog:     isDay ? 'bg-fog-day'     : 'bg-fog-night',
  };
  return map[animation] ?? (isDay ? 'bg-sunny-day' : 'bg-sunny-night');
}
