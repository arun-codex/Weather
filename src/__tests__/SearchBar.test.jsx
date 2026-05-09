import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from '../../src/components/SearchBar';

// Mock API
vi.mock('../../src/api/weather', () => ({
  searchCity: async (q) => {
    if (!q) return [];
    return [
      { id: '1', name: 'Testville', admin1: 'State', country: 'Country', latitude: 10.1, longitude: 20.2 },
      { id: '2', name: 'Sampletown', admin1: 'Region', country: 'Nation', latitude: 30.3, longitude: 40.4 },
    ];
  },
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('shows dropdown and allows keyboard selection', async () => {
    const onSelect = vi.fn();
    render(<SearchBar onSelectCity={onSelect} onGpsClick={() => {}} currentCity="" />);

    const input = screen.getByPlaceholderText(/Search city/i);
    // type to trigger debounce search
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test' } });
      // wait for debounce (350ms)
      await new Promise((r) => setTimeout(r, 380));
    });

    // Dropdown should appear; press ArrowDown then Enter
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalled();
  });
});
