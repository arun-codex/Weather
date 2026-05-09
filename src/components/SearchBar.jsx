/**
 * SearchBar.jsx
 * ---------------
 * Provides two ways to set location:
 *  1. GPS button (📍) — re-triggers geolocation
 *  2. City search — calls Open-Meteo geocoding, shows dropdown
 *
 * Props:
 *  - onSelectCity(city): called with geocoding result object { lat, lon, name, admin1, country }
 *  - onGpsClick(): called to refresh GPS location
 *  - currentCity: string shown in input when not focused
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { searchCity } from '../api/weather';

export default function SearchBar({ onSelectCity, onGpsClick, currentCity }) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused]     = useState(false);
  const debounceTimer = useRef(null);
  const inputRef      = useRef(null);
  const wrapperRef    = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Debounced search — waits 350ms after user stops typing
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(debounceTimer.current);
    if (value.length < 2) { setResults([]); return; }

    debounceTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const cities = await searchCity(value);
        setResults(cities);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleSelect = (city) => {
    setQuery('');
    setResults([]);
    setFocused(false);
    inputRef.current?.blur();
    onSelectCity(city);
  };

  const handleKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = results[activeIndex >= 0 ? activeIndex : 0];
      if (sel) handleSelect(sel);
    } else if (e.key === 'Escape') {
      setFocused(false);
      setResults([]);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setFocused(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    // When results change, default to first item for easier keyboard navigation
    setActiveIndex(results.length > 0 ? 0 : -1);
  }, [results.length]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="search-wrapper relative w-full max-w-sm mx-auto"
      role="combobox"
      aria-haspopup="listbox"
      aria-owns="search-results"
      aria-expanded={focused && results.length > 0}
    >
      {/* Input row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
            size={16}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
            placeholder={currentCity || 'Search city…'}
            className="
              w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm text-white
              glass placeholder-white/40 outline-none
              focus:ring-2 focus:ring-white/30 transition-all
            "
          />
          {/* Clear / loading indicator */}
          {query.length > 0 && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            >
              {searching
                ? <Loader2 size={14} className="animate-spin" />
                : <X size={14} />
              }
            </button>
          )}
        </div>

        {/* GPS button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onGpsClick}
          title="Use my location"
          className="
            p-2.5 rounded-2xl glass text-white/70 hover:text-white
            hover:bg-white/15 transition-all
          "
        >
          <MapPin size={18} />
        </motion.button>
      </div>

      {/* Dropdown results */}
      <AnimatePresence>
        {focused && results.length > 0 && (() => {
          const rect = wrapperRef.current?.getBoundingClientRect();
          const baseStyle = rect
            ? { position: 'fixed', left: rect.left + 'px', top: (rect.bottom + 8) + 'px', width: rect.width + 'px', zIndex: 9999 }
            : { position: 'absolute', top: '100%', left: 0, right: 0 };

          const mobileStyle = isMobile
            ? { position: 'fixed', left: 8 + 'px', right: 8 + 'px', top: (rect?.bottom ?? 0) + 8 + 'px', zIndex: 9999 }
            : baseStyle;

          const itemBaseClasses = 'w-full text-left px-4 py-3 flex items-center gap-3 text-white transition-colors border-b border-white/5 last:border-0';
          const itemActive = 'bg-white/12';
          const itemHover = 'hover:bg-white/10';

          return createPortal(
            <motion.div
              id="search-results"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y:  4, scale: 1 }}
              exit={{    opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={isMobile ? mobileStyle : baseStyle}
              className={`glass rounded-2xl overflow-hidden shadow-2xl ${isMobile ? 'text-base' : 'text-sm'}`}
              role="listbox"
            >
              {results.map((city, i) => (
                <button
                  role="option"
                  aria-selected={i === activeIndex}
                  tabIndex={-1}
                  id={`search-item-${i}`}
                  key={`${city.id ?? i}`}
                  onMouseDown={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`${itemBaseClasses} ${i === activeIndex ? itemActive : itemHover} ${isMobile ? 'px-5 py-4' : ''}`}
                >
                  <MapPin size={16} className="text-white/40 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{city.name}</p>
                    <p className="text-xs text-white/50">{[city.admin1, city.country].filter(Boolean).join(', ')}</p>
                  </div>
                </button>
              ))}
            </motion.div>,
            document.body
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
