import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SavedCities from '../../src/components/SavedCities';

describe('SavedCities', () => {
  beforeEach(() => {
    // Ensure a working localStorage mock for the test environment
    if (typeof localStorage === 'undefined' || !localStorage.removeItem) {
      globalThis.localStorage = {
        _store: {},
        getItem(key) { return this._store[key] ?? null; },
        setItem(key, value) { this._store[key] = String(value); },
        removeItem(key) { delete this._store[key]; },
        clear() { this._store = {}; },
      };
    } else {
      localStorage.removeItem('weather.savedCities');
    }
  });

  it('saves current city and persists to localStorage', () => {
    const currentCoords = { lat: 10.123, lon: 20.456 };
    render(<SavedCities currentCity="My City" currentCoords={currentCoords} onCitySelect={() => {}} />);

    // Click the save button (it is the only button with title attribute)
    const saveBtn = screen.queryByTitle(/Save current city/i) || screen.queryByRole('button');
    expect(saveBtn).toBeTruthy();
    fireEvent.click(saveBtn);

    // localStorage should now have an entry
    const stored = JSON.parse(localStorage.getItem('weather.savedCities'));
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].name).toMatch(/My City/);
  });
});
