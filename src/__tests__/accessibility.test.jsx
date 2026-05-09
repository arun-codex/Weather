import React from 'react';
import { beforeEach, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import SearchBar from '../../src/components/SearchBar';
import SavedCities from '../../src/components/SavedCities';

describe('Accessibility audit', () => {
  beforeEach(() => {
    // ensure a working localStorage polyfill in case environment lacks it
    if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.setItem) {
      globalThis.localStorage = (function () {
        let store = {};
        return {
          getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
          setItem(key, value) { store[key] = String(value); },
          removeItem(key) { delete store[key]; },
          clear() { store = {}; },
        };
      })();
    }
  });

  it('SearchBar + SavedCities have no serious or critical violations', async () => {
    render(<div><SearchBar onSelectCity={() => {}} onGpsClick={() => {}} currentCity="" /><SavedCities currentCity="" currentCoords={{ lat: 0, lon: 0 }} onCitySelect={() => {}} /></div>);

    // Run axe on the document
    const results = await axe.run(document);

    const blocking = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    if (blocking.length > 0) {
      console.error('Axe detailed violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(blocking.length).toBe(0);
  });
});
