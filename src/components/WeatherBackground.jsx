/**
 * WeatherBackground.jsx
 * ----------------------
 * Full-screen animated background scene driven by weather condition.
 * Conditions: sunny, cloudy, rain, thunder, snow, fog
 *
 * Architecture:
 *  - The gradient CSS class changes based on animation type & isDay.
 *  - Rain/snow droplets are generated as an array of absolutely-positioned elements.
 *  - Sun orb is shown for sunny conditions.
 *  - Cloud SVGs are shown for cloudy conditions.
 *  - Lightning overlay flashes for thunderstorm.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBgClass } from '../utils/weatherCodes';

// ─── Rain drops generator ───────────────────────────────────────────────────
function RainLayer() {
  // Pre-generate 60 rain drops with randomised positions, speeds, delays
  const [drops, setDrops] = useState([]);
  
  useEffect(() => {
    setTimeout(() => {
      setDrops(Array.from({ length: 60 }, (_, i) => ({
        id:       i,
        left:     `${Math.random() * 100}%`,
        height:   `${Math.random() * 60 + 40}px`,
        delay:    `${Math.random() * 3}s`,
        duration: `${Math.random() * 0.6 + 0.5}s`,
        opacity:  Math.random() * 0.5 + 0.3,
      })));
    }, 0);
  }, []);

  return (
    <div className="rain-container">
      {drops.map(d => (
        <div
          key={d.id}
          className="rain-drop"
          style={{
            left:             d.left,
            height:           d.height,
            animationDelay:   d.delay,
            animationDuration: d.duration,
            opacity:          d.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ─── Snow flakes generator ──────────────────────────────────────────────────
function SnowLayer() {
  const [flakes, setFlakes] = useState([]);
  
  useEffect(() => {
    setTimeout(() => {
      setFlakes(Array.from({ length: 40 }, (_, i) => ({
        id:       i,
        left:     `${Math.random() * 100}%`,
        size:     `${Math.random() * 6 + 3}px`,
        delay:    `${Math.random() * 5}s`,
        duration: `${Math.random() * 4 + 4}s`,
        opacity:  Math.random() * 0.6 + 0.3,
      })));
    }, 0);
  }, []);

  return (
    <div className="rain-container">
      {flakes.map(f => (
        <div
          key={f.id}
          className="snow-flake"
          style={{
            left:             f.left,
            width:            f.size,
            height:           f.size,
            animationDelay:   f.delay,
            animationDuration: f.duration,
            opacity:          f.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ─── Sun orb ────────────────────────────────────────────────────────────────
function SunLayer() {
  return (
    <div className="fixed top-16 right-12 z-0 pointer-events-none">
      <div
        className="sun-orb w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, #FDE68A 0%, #FCD34D 40%, #F59E0B 100%)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  );
}

// ─── Cloud SVGs ──────────────────────────────────────────────────────────────
function CloudLayer({ isDay }) {
  const opacity = isDay ? 0.5 : 0.25;
  const fill    = isDay ? '#E2E8F0' : '#475569';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Large cloud */}
      <svg className="cloud-1 absolute top-16 left-0" width="320" height="140" viewBox="0 0 320 140" fill="none">
        <ellipse cx="160" cy="100" rx="140" ry="55" fill={fill} fillOpacity={opacity} />
        <ellipse cx="110" cy="80"  rx="80"  ry="50" fill={fill} fillOpacity={opacity} />
        <ellipse cx="200" cy="75"  rx="75"  ry="48" fill={fill} fillOpacity={opacity} />
        <ellipse cx="155" cy="60"  rx="60"  ry="42" fill={fill} fillOpacity={opacity} />
      </svg>

      {/* Medium cloud */}
      <svg className="cloud-2 absolute top-36 right-10" width="220" height="100" viewBox="0 0 220 100" fill="none">
        <ellipse cx="110" cy="73" rx="100" ry="38" fill={fill} fillOpacity={opacity * 0.8} />
        <ellipse cx="75"  cy="55" rx="58"  ry="38" fill={fill} fillOpacity={opacity * 0.8} />
        <ellipse cx="145" cy="50" rx="55"  ry="35" fill={fill} fillOpacity={opacity * 0.8} />
        <ellipse cx="108" cy="40" rx="44"  ry="32" fill={fill} fillOpacity={opacity * 0.8} />
      </svg>

      {/* Small cloud */}
      <svg className="cloud-3 absolute top-48 left-1/3" width="160" height="80" viewBox="0 0 160 80" fill="none">
        <ellipse cx="80"  cy="58" rx="72"  ry="30" fill={fill} fillOpacity={opacity * 0.6} />
        <ellipse cx="55"  cy="42" rx="42"  ry="30" fill={fill} fillOpacity={opacity * 0.6} />
        <ellipse cx="105" cy="40" rx="40"  ry="28" fill={fill} fillOpacity={opacity * 0.6} />
        <ellipse cx="79"  cy="30" rx="34"  ry="26" fill={fill} fillOpacity={opacity * 0.6} />
      </svg>
    </div>
  );
}

// ─── Thunder / Lightning ─────────────────────────────────────────────────────
function ThunderLayer() {
  return (
    <>
      <RainLayer />
      <div className="lightning-overlay" />
    </>
  );
}

// ─── Stars for clear night ───────────────────────────────────────────────────
function StarsLayer() {
  const [stars, setStars] = useState([]);
  
  useEffect(() => {
    setTimeout(() => {
      setStars(Array.from({ length: 80 }, (_, i) => ({
        id:   i,
        top:  `${Math.random() * 60}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2.5 + 1}px`,
        anim: `${Math.random() * 3 + 1}s`,
      })));
    }, 0);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-pulse-slow"
          style={{
            top:             s.top,
            left:            s.left,
            width:           s.size,
            height:          s.size,
            animationDuration: s.anim,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function WeatherBackground({ animation, isDay }) {
  const bgClass = getBgClass(animation, isDay);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${animation}-${isDay}`}
        className={`fixed inset-0 ${bgClass} bg-transition -z-10`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  );

  // Note: Particle layers rendered separately in App.jsx
  // to avoid being clipped by the motion container
}

/**
 * WeatherParticles — rendered at root level so they cover the whole screen.
 * Separated from WeatherBackground so AnimatePresence doesn't cut them off.
 */
export function WeatherParticles({ animation, isDay }) {
  if (animation === 'rain')   return <RainLayer />;
  if (animation === 'snow')   return <SnowLayer />;
  if (animation === 'thunder') return <ThunderLayer />;
  if (animation === 'sunny' && isDay)  return <SunLayer />;
  if (animation === 'sunny' && !isDay) return <StarsLayer />;
  if (animation === 'cloudy') return <CloudLayer isDay={isDay} />;
  return null;
}
