import React from 'react';
import { describe, it, expect } from 'vitest';
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
      // show a readable summary for debugging
      const summary = blocking.map(b => ({ id: b.id, impact: b.impact, nodes: b.nodes.length }));
      console.error('Axe blocking violations:', summary);
    }

    expect(blocking.length).toBe(0);
  });
});
