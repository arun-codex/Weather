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

const RECENT_SEARCHES_KEY = 'weather.recentSearches';
const MAX_RECENT = 5;

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

export function useSearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // For debouncing and request cancellation
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  const lastQueryRef = useRef('');

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = safeLocalStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery) => {
    // Cancel previous request if still in flight
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller for this request
    abortController.current = new AbortController();

    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    // Prevent duplicate requests
    if (lastQueryRef.current === searchQuery) {
      return;
    }
    lastQueryRef.current = searchQuery;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const cities = await searchCity(searchQuery);

      // Check if this request was aborted (newer request came in)
      if (abortController.current?.signal.aborted) {
        return;
      }

      setResults(cities || []);
      if (cities.length === 0) {
        setError(`No cities found matching "${searchQuery}"`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setError('Failed to search cities. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new debounced search
      debounceTimer.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // Add city to recent searches
  const addToRecent = useCallback((city) => {
    try {
      setRecentSearches((prev) => {
        // Remove if already exists, then add to top
        const filtered = prev.filter(
          (c) =>
            c.name.toLowerCase() !== city.name.toLowerCase() ||
            c.country !== city.country
        );
        const updated = [city, ...filtered].slice(0, MAX_RECENT);
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
    setResults([]);
    setError(null);
    setHasSearched(false);
    lastQueryRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
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
    setQuery,
  };
}
