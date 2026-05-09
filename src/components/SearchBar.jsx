/**
 * SearchBar.jsx (Enhanced with Autocomplete)
 * -------------------------------------------
 * Production-ready search component with:
 * - Real-time autocomplete suggestions
 * - Recent searches (localStorage persistence)
 * - Debounced API calls (300ms)
 * - Request cancellation (AbortController)
 * - Loading & error states
 * - Full keyboard navigation
 * - Mobile-optimized UI
 * - Atomic state updates
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Search, MapPin, X, Loader2, Clock, Trash2 } from 'lucide-react';
import { useSearchAutocomplete } from '../hooks/useSearchAutocomplete';

export default function SearchBar({ onSelectCity, onGpsClick, currentCity }) {
  const {
    query,
    results,
    recentSearches,
    loading,
    error,
    hasSearched,
    handleQueryChange,
    addToRecent,
    clearRecent,
    clearSearch,
  } = useSearchAutocomplete();

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const itemsToShow = results.length > 0 ? results : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, itemsToShow.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && itemsToShow[activeIndex]) {
        handleSelectCity(itemsToShow[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  // Handle city selection with atomic updates
  const handleSelectCity = (city) => {
    // Add to recent searches
    addToRecent(city);

    // Clear local state
    clearSearch();
    setActiveIndex(-1);
    setFocused(false);
    inputRef.current?.blur();

    // Trigger parent callback (atomic store update)
    onSelectCity(city);
  };

  const handleClear = () => {
    clearSearch();
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results.length, recentSearches.length]);

  // Mobile detection
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Determine what to show in dropdown
  const showSearchResults = focused && query.length >= 2 && results.length > 0;
  const showRecentSearches = focused && query.length === 0 && recentSearches.length > 0;
  const showLoadingState = focused && query.length >= 2 && loading;
  const showErrorState = focused && query.length >= 2 && hasSearched && !loading && error;
  const showNoResultsState = focused && query.length >= 2 && hasSearched && !loading && results.length === 0 && !error;

  // Render result/recent item
  const ResultItem = ({ item, index, isActive, isRecent }) => (
    <motion.button
      type="button"
      whileHover={{ x: 4 }}
      role="option"
      aria-selected={isActive}
      tabIndex={-1}
      id={`search-item-${index}`}
      onMouseDown={() => handleSelectCity(item)}
      onMouseEnter={() => setActiveIndex(index)}
      className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-3 transition-all border-b border-white/5 last:border-0 ${
        isActive ? 'bg-white/15' : 'hover:bg-white/10'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isRecent ? (
          <Clock size={16} className="text-white/40" />
        ) : (
          <MapPin size={16} className="text-white/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm sm:text-base font-medium text-white">{item.name}</p>
        <p className="text-xs sm:text-sm text-white/50 mt-0.5">
          {[item.admin1, item.country].filter(Boolean).join(', ')}
        </p>
      </div>
    </motion.button>
  );

  return (
    <div
      ref={wrapperRef}
      className="w-full max-w-2xl mx-auto relative"
      role="combobox"
      aria-haspopup="listbox"
      aria-owns="search-dropdown"
      aria-expanded={focused && (results.length > 0 || recentSearches.length > 0)}
    >
      {/* Input row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex-shrink-0"
            size={18}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            aria-autocomplete="list"
            aria-controls={focused ? 'search-dropdown' : undefined}
            aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
            placeholder={currentCity || 'Search city…'}
            className="
              w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-full text-sm sm:text-base text-white
              glass placeholder-white/40 outline-none border border-white/10
              focus:ring-2 focus:ring-white/40 focus:border-white/20 transition-all
              focus:bg-white/12
            "
          />

          {/* Loading / Clear indicator */}
          {(query.length > 0 || loading) && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
              aria-label={loading ? 'Searching...' : 'Clear search'}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <X size={18} />
              )}
            </motion.button>
          )}
        </div>

        {/* GPS button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={onGpsClick}
          title="Use my location"
          className="
            p-2.5 sm:p-3 rounded-full glass text-white/70 hover:text-white border border-white/10
            hover:bg-white/15 hover:border-white/20 transition-all flex-shrink-0
          "
        >
          <MapPin size={20} />
        </motion.button>
      </div>

      {/* Dropdown: Search Results / Recent / Loading / Error / Empty */}
      <AnimatePresence>
        {focused && (showSearchResults || showRecentSearches || showLoadingState || showErrorState || showNoResultsState) && (
          (() => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            const baseStyle = rect
              ? {
                  position: 'fixed',
                  left: rect.left + 'px',
                  top: (rect.bottom + 12) + 'px',
                  width: rect.width + 'px',
                  zIndex: 9999,
                }
              : { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50 };

            const mobileStyle = isMobile
              ? {
                  position: 'fixed',
                  left: 8 + 'px',
                  right: 8 + 'px',
                  top: (rect?.bottom ?? 0) + 12 + 'px',
                  zIndex: 9999,
                  maxHeight: '60vh',
                }
              : baseStyle;

            return createPortal(
              <motion.div
                id="search-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={mobileStyle}
                className="glass rounded-2xl overflow-hidden shadow-glass border border-white/10 max-h-96 overflow-y-auto"
                role="listbox"
              >
                {/* Search Results */}
                {showSearchResults && (
                  <>
                    {results.map((city, i) => (
                      <ResultItem
                        key={`result-${city.id ?? i}`}
                        item={city}
                        index={i}
                        isActive={activeIndex === i}
                        isRecent={false}
                      />
                    ))}
                  </>
                )}

                {/* Recent Searches */}
                {showRecentSearches && (
                  <>
                    <div className="sticky top-0 px-4 sm:px-5 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-white/50" />
                        <p className="text-xs text-white/50 uppercase tracking-wider font-medium">Recent</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((city, i) => (
                      <ResultItem
                        key={`recent-${city.id ?? i}`}
                        item={city}
                        index={i}
                        isActive={activeIndex === i}
                        isRecent={true}
                      />
                    ))}
                  </>
                )}

                {/* Loading State */}
                {showLoadingState && (
                  <div className="px-4 sm:px-5 py-8 flex flex-col items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={24} className="text-white/50" />
                    </motion.div>
                    <p className="text-sm text-white/50">Searching cities…</p>
                  </div>
                )}

                {/* Error State */}
                {showErrorState && (
                  <div className="px-4 sm:px-5 py-6 text-center">
                    <p className="text-sm text-white/50 mb-3">{error}</p>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      Try a different search
                    </button>
                  </div>
                )}

                {/* No Results State */}
                {showNoResultsState && (
                  <div className="px-4 sm:px-5 py-6 text-center">
                    <p className="text-sm text-white/60 font-medium mb-1">No cities found</p>
                    <p className="text-xs text-white/40">Try searching for a different city name</p>
                  </div>
                )}
              </motion.div>,
              document.body
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}
