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
       <div className="w-full glass rounded-3xl p-6 hidden md:block animate-in slide-in-from-left-8 duration-700" role="region" aria-label="Saved Cities">
      <div className="flex items-center justify-between mb-4">
        <h2 className="opacity-80 text-sm font-medium uppercase tracking-wider">
          Saved Cities
        </h2>
        <button
          type="button"
          onClick={addCurrentCity}
          disabled={!currentCityEntry || currentIsSaved}
          title={currentIsSaved ? 'Current city is saved' : 'Save current city'}
          className="p-1 rounded-full transition-colors opacity-80 hover:opacity-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full text-left p-4 rounded-2xl bg-white/15 border border-white/20 shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <MapPin size={18} className="text-blue-200 flex-shrink-0" />
            <span className="font-semibold text-white drop-shadow-sm truncate max-w-[150px]">
              {currentCity || 'Current Location'}
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 opacity-90 group-hover:opacity-100 transition-opacity">
            Active
          </span>
        </motion.button>

        {savedCities.map((city) => (
          <motion.div
            key={city.id}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl glass-light hover:bg-white/10 transition-colors flex items-center"
          >
            <button
              type="button"
              onClick={() => onCitySelect(toSelectableCity(city))}
              className="min-w-0 flex-1 text-left p-4"
            >
              <span className="block font-medium text-white/90 truncate">{city.name}</span>
              <span className="block text-xs text-white/45 mt-1">Tap to view forecast</span>
            </button>
            <button
              type="button"
              onClick={() => removeCity(city.id)}
              title={`Remove ${city.name}`}
              className="mr-3 p-2 rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
