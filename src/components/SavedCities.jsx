import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'weather.savedCities';

const DEFAULT_SAVED_CITIES = [
  { id: 'tokyo-jp', name: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917 },
  { id: 'london-uk', name: 'London, UK', lat: 51.5085, lon: -0.1257 },
  { id: 'new-york-us', name: 'New York, USA', lat: 40.7128, lon: -74.006 },
];

function makeCityId(name, coords) {
  const lat = Number(coords?.lat ?? coords?.latitude ?? 0).toFixed(3);
  const lon = Number(coords?.lon ?? coords?.longitude ?? 0).toFixed(3);
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${lat}-${lon}`;
}

function toSelectableCity(city) {
  // Normalize to { name, lat, lon, country_code }
  return {
    name: city.name,
    lat: city.lat ?? city.latitude ?? city.latitude ?? null,
    lon: city.lon ?? city.longitude ?? city.longitude ?? null,
    country_code: city.country_code,
  };
}

function isSameCity(a, b) {
  if (!a || !b) return false;

  const sameName = a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
  const aLat = Number(a.lat ?? a.latitude ?? 0);
  const aLon = Number(a.lon ?? a.longitude ?? 0);
  const bLat = Number(b.lat ?? b.latitude ?? 0);
  const bLon = Number(b.lon ?? b.longitude ?? 0);
  const sameCoords = Math.abs(aLat - bLat) < 0.01 && Math.abs(aLon - bLon) < 0.01;

  return sameName || sameCoords;
}

function uniqueCities(cities) {
  return cities.reduce((unique, city) => {
    if (!unique.some((saved) => isSameCity(saved, city))) {
      unique.push(city);
    }
    return unique;
  }, []);
}

export default function SavedCities({ currentCity, currentCoords, onCitySelect }) {
  const [savedCities, setSavedCities] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(raw) && raw.length > 0) {
        const normalized = raw.map((c) => ({
          id: c.id || makeCityId(c.name || '', c),
          name: c.name || c.displayName || '',
          lat: c.lat ?? c.latitude ?? c.lat ?? null,
          lon: c.lon ?? c.longitude ?? c.lon ?? null,
        })).filter((c) => c.lat && c.lon);

        return uniqueCities(normalized);
      }
      return DEFAULT_SAVED_CITIES;
    } catch {
      return DEFAULT_SAVED_CITIES;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCities));
  }, [savedCities]);

  const currentCityEntry = useMemo(() => {
    if (!currentCity || !currentCoords) return null;
    const name = currentCity.replace('Loading location…', '').trim();
    if (!name) return null;

    return {
      id: makeCityId(name, currentCoords),
      name,
      lat: currentCoords.lat,
      lon: currentCoords.lon,
    };
  }, [currentCity, currentCoords]);

  const currentIsSaved = currentCityEntry
    ? savedCities.some((city) => isSameCity(city, currentCityEntry))
    : false;

  const addCurrentCity = () => {
    if (!currentCityEntry || currentIsSaved) return;
    setSavedCities((cities) => uniqueCities([currentCityEntry, ...cities]).slice(0, 8));
  };

  const removeCity = (cityId) => {
    setSavedCities((cities) => cities.filter((city) => city.id !== cityId));
  };

  return (
    <div className="glass rounded-3xl p-4 sm:p-6 border border-white/10" role="region" aria-label="Saved Cities">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-[0.24em] font-medium">Quick Access</p>
          <h3 className="text-white text-h4 font-semibold mt-1">Saved Cities</h3>
        </div>
        <button
          type="button"
          onClick={addCurrentCity}
          disabled={!currentCityEntry || currentIsSaved}
          title={currentIsSaved ? 'Current city is saved' : 'Save current city'}
          className="p-2 rounded-full transition-all opacity-70 hover:opacity-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Horizontal scrollable cities */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-2 -mx-2 scrollbar-hide">
        {/* Current location card */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-4 rounded-2xl bg-white/15 border-2 border-white/40 shadow-sm flex flex-col items-center justify-center min-w-[120px] group transition-all hover:bg-white/20 hover:border-white/60"
        >
          <MapPin size={20} className="text-blue-300 mb-2" />
          <span className="text-xs font-semibold text-white text-center line-clamp-2">{currentCity || 'Current'}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 mt-1 opacity-70">Active</span>
        </motion.button>

        {/* Saved cities */}
        {savedCities.map((city, idx) => (
          <motion.div
            key={city.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="flex-shrink-0 relative"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCitySelect(toSelectableCity(city))}
              className="p-4 rounded-2xl glass-light border border-white/15 hover:bg-white/10 hover:border-white/25 transition-all flex flex-col items-center justify-center min-w-[120px] group"
            >
              <MapPin size={16} className="text-white/60 mb-2 group-hover:text-white/80" />
              <span className="text-xs font-medium text-white/80 text-center line-clamp-2 group-hover:text-white">{city.name}</span>
            </motion.button>
            
            {/* Delete button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              onClick={() => removeCity(city.id)}
              title={`Remove ${city.name}`}
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white/20 text-white/60 hover:bg-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </motion.button>
          </motion.div>
        ))}

        {/* Add city prompt */}
        {savedCities.length < 8 && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 p-4 rounded-2xl border-2 border-dashed border-white/30 hover:border-white/50 flex flex-col items-center justify-center min-w-[120px] text-white/50 hover:text-white/80 transition-all"
            onClick={() => alert('Search for a city to add it to your saved list')}
          >
            <Plus size={20} />
            <span className="text-xs font-medium mt-2">Add City</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
