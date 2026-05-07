import { MapPin, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SavedCities({ currentCity, onCitySelect }) {
  // Mock saved cities. In a real app, this would be read from localStorage.
  const savedCities = [
    { name: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917, temp: 22, code: 'sunny' },
    { name: 'London, UK', lat: 51.5085, lon: -0.1257, temp: 15, code: 'cloudy' },
    { name: 'New York, USA', lat: 40.7128, lon: -74.0060, temp: 18, code: 'rain' },
  ];

  return (
    <div className="w-full glass rounded-3xl p-6 hidden md:block animate-in slide-in-from-left-8 duration-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="opacity-80 text-sm font-medium uppercase tracking-wider">
          Saved Cities
        </h2>
        <button className="p-1 hovered:bg-white/10 rounded-full transition-colors opacity-80 hover:opacity-100">
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Current Location Badge */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full text-left p-4 rounded-2xl bg-white/15 border border-white/20 shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-blue-200" />
            <span className="font-semibold text-white drop-shadow-sm truncate max-w-[150px]">
              {currentCity || 'Current Location'}
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 opacity-90 group-hover:opacity-100 transition-opacity">
            Active
          </span>
        </motion.button>

        {/* Saved List */}
        {savedCities.map((city) => (
          <motion.button
            key={city.name}
            onClick={() => onCitySelect({ latitude: city.lat, longitude: city.lon, name: city.name.split(',')[0], country_code: city.name.split(',')[1] })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-left p-4 rounded-2xl glass-light hover:bg-white/10 transition-colors flex items-center justify-between"
          >
            <span className="font-medium text-white/90 truncate max-w-[130px]">{city.name}</span>
            <div className="flex items-center gap-2 text-white font-semibold">
              <span className="text-xl">{city.temp}°</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
