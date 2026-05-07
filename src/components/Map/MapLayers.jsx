import { useStore } from '../../store/useStore';
import { Layers, CloudRain, Wind, Thermometer } from 'lucide-react';

const LAYERS = [
  { id: 'none', label: 'Default Map', icon: Layers },
  { id: 'precipitation', label: 'Precipitation', icon: CloudRain },
  { id: 'temperature', label: 'Temperature', icon: Thermometer },
  { id: 'wind', label: 'Wind Animation', icon: Wind },
];

export default function MapLayers() {
  const activeLayer = useStore((state) => state.activeLayer);
  const setActiveLayer = useStore((state) => state.setActiveLayer);

  return (
    <div className="glass rounded-3xl p-6 mt-6 flex flex-col gap-4">
      <h3 className="text-white/80 font-medium flex items-center gap-2">
        <Layers size={18} /> Map Overlay
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                  : 'hover:bg-white/10 text-white/70 hover:text-white border border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-300' : ''} />
              <span className="text-sm font-medium">{layer.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
