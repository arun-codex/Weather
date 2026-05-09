/**
 * SearchBar.jsx
 * -------------
 * Autocomplete search with ranked city results, recents, keyboard support,
 * pointer-safe mobile dropdown behavior, and ARIA combobox semantics.
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Search, MapPin, X, Loader2, Clock, Trash2 } from 'lucide-react';
import { useSearchAutocomplete } from '../hooks/useSearchAutocomplete';
import { formatCitySubtitle } from '../utils/searchRanking';

const DROPDOWN_GAP = 12;
const MOBILE_EDGE_GAP = 8;
const DEFAULT_DROPDOWN_STYLE = {
  position: 'fixed',
  left: `${MOBILE_EDGE_GAP}px`,
  right: `${MOBILE_EDGE_GAP}px`,
  top: '72px',
  maxHeight: '60vh',
  zIndex: 9999,
};

export default function SearchBar({ onSelectCity, onGpsClick, currentCity }) {
  const {
    query,
    results,
    recentSearches,
    loading,
    showSlowLoading,
    error,
    hasSearched,
    searchReady,
    handleQueryChange,
    addToRecent,
    clearRecent,
    clearSearch,
  } = useSearchAutocomplete();

  const reactId = useId();
  const listboxId = `${reactId}-search-dropdown`;
  const statusId = `${reactId}-search-status`;
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState(DEFAULT_DROPDOWN_STYLE);

  const showSearchResults = focused && searchReady && results.length > 0;
  const showRecentSearches = focused && !searchReady && query.trim().length === 0 && recentSearches.length > 0;
  const showLoadingState = focused && searchReady && showSlowLoading;
  const showErrorState = focused && searchReady && hasSearched && !loading && Boolean(error);
  const showNoResultsState =
    focused && searchReady && hasSearched && !loading && results.length === 0 && !error;
  const shouldShowDropdown =
    showSearchResults || showRecentSearches || showLoadingState || showErrorState || showNoResultsState;

  const itemsToShow = showSearchResults ? results : showRecentSearches ? recentSearches : [];
  const activeOptionId =
    activeIndex >= 0 && activeIndex < itemsToShow.length ? `${listboxId}-option-${activeIndex}` : undefined;

  const statusMessage = useMemo(() => {
    if (showLoadingState) return 'Searching cities...';
    if (showErrorState) return 'Search unavailable. Check connection.';
    if (showNoResultsState) return 'No cities found.';
    if (showSearchResults) return `${results.length} cities available.`;
    if (showRecentSearches) return `${recentSearches.length} recent searches available.`;
    return '';
  }, [
    recentSearches.length,
    results.length,
    showErrorState,
    showLoadingState,
    showNoResultsState,
    showRecentSearches,
    showSearchResults,
  ]);

  const updateDropdownPosition = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportTop = viewport?.offsetTop ?? 0;
    const isMobile = viewportWidth <= 640;
    const top = rect.bottom + DROPDOWN_GAP;
    const availableHeight = Math.max(180, viewportTop + viewportHeight - top - MOBILE_EDGE_GAP);

    if (isMobile) {
      setDropdownStyle({
        position: 'fixed',
        left: `${MOBILE_EDGE_GAP}px`,
        right: `${MOBILE_EDGE_GAP}px`,
        top: `${top}px`,
        maxHeight: `${Math.min(availableHeight, viewportHeight * 0.62)}px`,
        zIndex: 9999,
      });
      return;
    }

    setDropdownStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${top}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(384, availableHeight)}px`,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!shouldShowDropdown) return undefined;

    let frame = window.requestAnimationFrame(updateDropdownPosition);
    const updateOnFrame = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateDropdownPosition);
    };

    window.addEventListener('resize', updateOnFrame);
    window.addEventListener('scroll', updateOnFrame, true);
    window.visualViewport?.addEventListener('resize', updateOnFrame);
    window.visualViewport?.addEventListener('scroll', updateOnFrame);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateOnFrame);
      window.removeEventListener('scroll', updateOnFrame, true);
      window.visualViewport?.removeEventListener('resize', updateOnFrame);
      window.visualViewport?.removeEventListener('scroll', updateOnFrame);
    };
  }, [shouldShowDropdown, updateDropdownPosition]);

  useEffect(() => {
    if (!focused) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideWrapper && !insideDropdown) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [focused]);

  const selectCity = useCallback(
    (city) => {
      addToRecent(city);
      clearSearch();
      setActiveIndex(-1);
      setFocused(false);
      inputRef.current?.blur();
      onSelectCity(city);
    },
    [addToRecent, clearSearch, onSelectCity]
  );

  const handleClear = () => {
    clearSearch();
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (event) => {
    setActiveIndex(-1);
    handleQueryChange(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocused(true);
      setActiveIndex((index) => Math.min(index + 1, itemsToShow.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      if (activeIndex >= 0 && itemsToShow[activeIndex]) {
        event.preventDefault();
        selectCity(itemsToShow[activeIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      setFocused(false);
      setActiveIndex(-1);
    }
  };

  const ResultItem = ({ item, index, isActive, isRecent }) => {
    const subtitle = formatCitySubtitle(item);
    const optionId = `${listboxId}-option-${index}`;
    const countryCode = item.country_code || '';
    const label = [item.name, subtitle, countryCode].filter(Boolean).join(', ');

    return (
      <motion.button
        type="button"
        whileHover={{ x: 4 }}
        role="option"
        aria-selected={isActive}
        aria-label={label}
        tabIndex={-1}
        id={optionId}
        onPointerDown={(event) => {
          event.preventDefault();
          selectCity(item);
        }}
        onMouseEnter={() => setActiveIndex(index)}
        className={`w-full min-h-[52px] text-left px-4 sm:px-5 py-3.5 flex items-start gap-3 transition-all border-b border-white/5 last:border-0 ${
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
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm sm:text-base font-medium text-white">{item.name}</p>
            {countryCode ? (
              <span className="flex-shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-white/55">
                {countryCode}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-0.5 truncate text-xs sm:text-sm text-white/50">{subtitle}</p> : null}
        </div>
      </motion.button>
    );
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto relative">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex-shrink-0"
            size={18}
          />
          <input
            ref={inputRef}
            type="search"
            name="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="search"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            role="combobox"
            aria-label="Search city"
            aria-haspopup="listbox"
            aria-expanded={shouldShowDropdown}
            aria-autocomplete="list"
            aria-controls={shouldShowDropdown ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            aria-describedby={statusId}
            placeholder={currentCity || 'Search city...'}
            className="
              w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-full text-sm sm:text-base text-white
              glass placeholder-white/40 outline-none border border-white/10
              focus:ring-2 focus:ring-white/40 focus:border-white/20 transition-all
              focus:bg-white/12
            "
          />

          {(query.length > 0 || loading) && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
              aria-label={loading ? 'Cancel search' : 'Clear search'}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            </motion.button>
          )}
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={onGpsClick}
          title="Use my location"
          aria-label="Use my location"
          className="
            p-2.5 sm:p-3 rounded-full glass text-white/70 hover:text-white border border-white/10
            hover:bg-white/15 hover:border-white/20 transition-all flex-shrink-0
          "
        >
          <MapPin size={20} />
        </motion.button>
      </div>

      <div id={statusId} className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      {shouldShowDropdown
        ? createPortal(
            <motion.div
                ref={dropdownRef}
                id={listboxId}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={dropdownStyle}
                className="glass rounded-2xl overflow-hidden shadow-glass border border-white/10 overflow-y-auto overscroll-contain touch-pan-y"
                role="listbox"
              >
                {showSearchResults
                  ? results.map((city, index) => (
                      <ResultItem
                        key={`result-${city.id ?? index}`}
                        item={city}
                        index={index}
                        isActive={activeIndex === index}
                        isRecent={false}
                      />
                    ))
                  : null}

                {showRecentSearches ? (
                  <>
                    <div className="sticky top-0 px-4 sm:px-5 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-white/50" />
                        <p className="text-xs text-white/50 uppercase tracking-wider font-medium">Recent</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearRecent}
                        aria-label="Clear recent searches"
                        className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((city, index) => (
                      <ResultItem
                        key={`recent-${city.id ?? index}`}
                        item={city}
                        index={index}
                        isActive={activeIndex === index}
                        isRecent={true}
                      />
                    ))}
                  </>
                ) : null}

                {showLoadingState ? (
                  <div className="px-4 sm:px-5 py-8 flex flex-col items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={24} className="text-white/50" />
                    </motion.div>
                    <p className="text-sm text-white/50">Searching cities...</p>
                  </div>
                ) : null}

                {showErrorState ? (
                  <div className="px-4 sm:px-5 py-6 text-center">
                    <p className="text-sm text-white/60 font-medium">Search unavailable.</p>
                    <p className="text-xs text-white/45 mt-1 mb-4">Check connection.</p>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      Try a different search
                    </button>
                  </div>
                ) : null}

                {showNoResultsState ? (
                  <div className="px-4 sm:px-5 py-6 text-center">
                    <p className="text-sm text-white/60 font-medium mb-1">No cities found</p>
                    <p className="text-xs text-white/40">Try searching for a different city name</p>
                  </div>
                ) : null}
            </motion.div>,
            document.body
          )
        : null}
    </div>
  );
}
