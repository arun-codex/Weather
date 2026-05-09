import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useWeather } from '../../src/hooks/useWeather';
import { useStore } from '../../src/store/useStore';

function TestComponent({ coords }) {
  const { data, cityName, loading } = useWeather(coords);
  return (
    <div>
      <div data-testid="city">{cityName}</div>
      <div data-testid="loading">{loading ? '1' : '0'}</div>
      <div data-testid="has-data">{data ? '1' : '0'}</div>
    </div>
  );
}

describe('useWeather hook', () => {
  beforeEach(() => {
    // reset store
    useStore.setState({ coords: null, weatherData: null, aqiData: null, cityName: '', loading: false, error: null, lastRefresh: null });
  });

  it('calls setCoords when coords prop changes and triggers fetchData', async () => {
    const mockFetch = vi.fn(async () => {});
    const mockSetCoords = vi.fn();
    // replace functions on the store
    useStore.setState({ fetchData: mockFetch, setCoords: mockSetCoords });

    const { rerender } = render(<TestComponent coords={null} />);

    // update props to a valid coords -> hook should call setCoords and fetchData
    await act(async () => {
      rerender(<TestComponent coords={{ lat: 1.23, lon: 4.56 }} />);
    });

    expect(mockSetCoords).toHaveBeenCalled();
    // fetchData will be invoked asynchronously; give microtask to run
    await act(async () => Promise.resolve());
    expect(mockFetch).toHaveBeenCalled();
  });
});
