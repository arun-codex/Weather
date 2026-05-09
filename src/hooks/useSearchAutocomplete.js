/**
 * useSearchAutocomplete.js
 * -------------------------
 * Production-ready search hook with:
 * - Debounced API calls (300ms)
 * - AbortController for request cancellation
 * - Recent searches (localStorage)
 * - Loading & error states
 * - Stale response prevention
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchCity } from '../api/weather';
import {
  getCityIdentityKey,
  normalizeCityResult,
  normalizeSearchQuery,
  rankCityResults,
} from '../utils/searchRanking';

const RECENT_SEARCHES_KEY = 'weather.recentSearches';
const MAX_RECENT = 5;
const SEARCH_DEBOUNCE_MS = 300;
const SLOW_SEARCH_MS = 500;

// Safe localStorage wrapper
const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Ignore errors
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && window.localStorage.setItem) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore errors (test environment, quota exceeded, etc.)
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore errors
    }
  },
};

function loadRecentSearches() {
  try {
    const stored = safeLocalStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((city, index) => normalizeCityResult(city, index))
      .filter((city) => city.name && city.lat !== null && city.lon !== null)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || error?.message === 'canceled';
}

export function useSearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
  const [loading, setLoading] = useState(false);
  const [showSlowLoading, setShowSlowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // For debouncing and request cancellation
  const debounceTimer = useRef(null);
  const slowSearchTimer = useRef(null);
  const abortController = useRef(null);
  const requestId = useRef(0);
  const lastResolvedQuery = useRef('');

  const abortActiveSearch = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    if (slowSearchTimer.current) {
      clearTimeout(slowSearchTimer.current);
      slowSearchTimer.current = null;
    }
  }, []);

  const resetSearchState = useCallback(() => {
    abortActiveSearch();
    requestId.current += 1;
    lastResolvedQuery.current = '';
    setResults([]);
    setLoading(false);
    setShowSlowLoading(false);
    setError(null);
    setHasSearched(false);
  }, [abortActiveSearch]);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery) => {
    const normalizedQuery = normalizeSearchQuery(searchQuery);
    if (!normalizedQuery) {
      resetSearchState();
      return;
    }

    abortActiveSearch();
    const activeRequestId = requestId.current + 1;
    requestId.current = activeRequestId;
    abortController.current = new AbortController();

    setLoading(true);
    setShowSlowLoading(false);
    setError(null);

    slowSearchTimer.current = setTimeout(() => {
      if (requestId.current === activeRequestId) {
        setShowSlowLoading(true);
      }
    }, SLOW_SEARCH_MS);

    try {
      const cities = await searchCity(normalizedQuery, {
        signal: abortController.current.signal,
        count: 50,
      });

      if (requestId.current !== activeRequestId) {
        return;
      }

      const ranked = rankCityResults(normalizedQuery, cities, recentSearches, 8);
      lastResolvedQuery.current = normalizedQuery;
      setResults(ranked);
      setHasSearched(true);
      setError(null);
    } catch (err) {
      if (isAbortError(err) || requestId.current !== activeRequestId) {
        return;
      }
      setError('Search unavailable.\nCheck connection.');
      setResults([]);
      setHasSearched(true);
    } finally {
      if (requestId.current === activeRequestId) {
        if (slowSearchTimer.current) {
          clearTimeout(slowSearchTimer.current);
          slowSearchTimer.current = null;
        }
        setLoading(false);
        setShowSlowLoading(false);
      }
    }
  }, [abortActiveSearch, recentSearches, resetSearchState]);

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (value) => {
      const nextQuery = String(value ?? '').slice(0, 80);
      const normalizedQuery = normalizeSearchQuery(nextQuery);
      setQuery(nextQuery);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      if (!normalizedQuery) {
        resetSearchState();
        return;
      }

      if (normalizedQuery !== lastResolvedQuery.current) {
        setResults([]);
        setHasSearched(false);
      }

      debounceTimer.current = setTimeout(() => {
        performSearch(normalizedQuery);
      }, SEARCH_DEBOUNCE_MS);
    },
    [performSearch, resetSearchState]
  );

  // Add city to recent searches
  const addToRecent = useCallback((city) => {
    try {
      setRecentSearches((prev) => {
        const normalizedCity = normalizeCityResult(city);
        const cityKey = getCityIdentityKey(normalizedCity);
        const filtered = prev.filter((recent) => getCityIdentityKey(recent) !== cityKey);
        const updated = [normalizedCity, ...filtered].slice(0, MAX_RECENT);
        safeLocalStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore errors
    }
  }, []);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    try {
      setRecentSearches([]);
      safeLocalStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Clear all search state
  const clearSearch = useCallback(() => {
    setQuery('');
    resetSearchState();
  }, [resetSearchState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      abortActiveSearch();
    };
  }, [abortActiveSearch]);

  return {
    query,
    results,
    recentSearches,
    loading,
    showSlowLoading,
    error,
    hasSearched,
    searchReady: Boolean(normalizeSearchQuery(query)),
    handleQueryChange,
    addToRecent,
    clearRecent,
    clearSearch,
    setQuery,
  };
}
