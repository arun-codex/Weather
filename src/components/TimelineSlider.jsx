import { useStore } from '../store/useStore';
import { Clock, Play, Pause } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TimelineSlider() {
  const { weatherData, selectedTimeIndex, setSelectedTimeIndex } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedTimeIndex((prev) => (prev >= 47 ? 0 : prev + 1));
    }, 1000); // 1 second per hour frame
    return () => clearInterval(interval);
  }, [isPlaying, setSelectedTimeIndex]);

  if (!weatherData?.hourly) return null;

  const hourly = weatherData.hourly;
  // Get time string for the currently selected hour
  const selectedTime = new Date(hourly.time[selectedTimeIndex]);
  const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDay = selectedTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="glass rounded-3xl p-6 mt-6 relative z-10 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex flex-center items-center justify-center text-white transition-all backdrop-blur-md border border-white/10"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
          </button>
          <div>
            <div className="text-white font-semibold text-lg">{formattedTime}</div>
            <div className="text-white/60 text-xs">{formattedDay}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-white/80 text-sm flex items-center justify-end gap-1"><Clock size={14}/> Forecast</div>
          <div className="text-white font-medium">+{selectedTimeIndex} Hours</div>
        </div>
      </div>

      <div className="relative pt-2 pb-4">
        {/* Input range slider for 48 hours */}
        <input 
          type="range" 
          min="0" 
          max="47" 
          value={selectedTimeIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setSelectedTimeIndex(parseInt(e.target.value, 10));
          }}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
        />
        
        <div className="flex justify-between text-white/40 text-[10px] mt-2 px-1">
          <span>Now</span>
          <span>+12h</span>
          <span>+24h</span>
          <span>+36h</span>
          <span>+48h</span>
        </div>
      </div>
    </div>
  );
}
