import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import SearchBar from '../../src/components/SearchBar';

const apiMocks = vi.hoisted(() => ({
  searchCity: vi.fn(),
}));

vi.mock('../../src/api/weather', () => ({
  searchCity: apiMocks.searchCity,
}));

const city = (name, country, lat, lon, population, extra = {}) => ({
  id: `${name}-${country}-${lat}`,
  name,
  country,
  country_code: extra.country_code ?? country.slice(0, 2).toUpperCase(),
  latitude: lat,
  longitude: lon,
  population,
  feature_code: extra.feature_code ?? 'PPL',
  admin1: extra.admin1 ?? '',
});

function mockSearchResults(query) {
  if (query === 'sur') {
    return [
      city('Sur', 'Oman', 22.56, 59.52, 71152, { feature_code: 'PPLA' }),
      city('Surabaya', 'Indonesia', -7.24, 112.75, 2874314),
      city('Surat', 'India', 21.19, 72.83, 4591246),
      city('Suriname', 'Suriname', 3.91, -56.02, 575991, { feature_code: 'PCLI' }),
      city('Surrey', 'Canada', 49.1, -122.82, 568322),
    ];
  }

  if (query === 'lon') {
    return [
      city('London', 'Canada', 42.98, -81.23, 422324, { admin1: 'Ontario' }),
      city('London', 'United Kingdom', 51.5, -0.12, 8961989, {
        admin1: 'England',
        feature_code: 'PPLC',
        country_code: 'GB',
      }),
    ];
  }

  if (query === 'tok') {
    return [
      city('Tok', 'United States', 63.33, -142.98, 1258, { admin1: 'Alaska' }),
      city('Tokyo', 'Japan', 35.68, 139.69, 9733276, { feature_code: 'PPLC', country_code: 'JP' }),
    ];
  }

  return [];
}

async function typeSearch(value) {
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  await act(async () => {
    vi.advanceTimersByTime(320);
    await Promise.resolve();
    await Promise.resolve();
  });
  await act(async () => {
    vi.advanceTimersByTime(20);
  });
  return input;
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    apiMocks.searchCity.mockReset();
    apiMocks.searchCity.mockImplementation(async (query) => mockSearchResults(query));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['sur', 'Surat'],
    ['lon', 'London'],
    ['tok', 'Tokyo'],
  ])('renders ranked dropdown results for %s', async (query, expectedTopResult) => {
    render(<SearchBar onSelectCity={() => {}} onGpsClick={() => {}} currentCity="" />);

    await typeSearch(query);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent(expectedTopResult);
  });

  it('selects the active result with keyboard navigation', async () => {
    const onSelect = vi.fn();
    render(<SearchBar onSelectCity={onSelect} onGpsClick={() => {}} currentCity="" />);

    const input = await typeSearch('sur');
    expect(screen.getByText('Surat')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Surat', country: 'India' }));
  });

  it('distinguishes duplicate city names by region and country code', async () => {
    render(<SearchBar onSelectCity={() => {}} onGpsClick={() => {}} currentCity="" />);

    await typeSearch('lon');
    const londonOptions = screen.getAllByRole('option', { name: /London/i });

    expect(londonOptions).toHaveLength(2);
    expect(within(londonOptions[0]).getByText('England, United Kingdom')).toBeInTheDocument();
    expect(within(londonOptions[1]).getByText('Ontario, Canada')).toBeInTheDocument();
  });

  it('shows slow-search copy only after 500ms', async () => {
    apiMocks.searchCity.mockReturnValue(new Promise(() => {}));
    render(<SearchBar onSelectCity={() => {}} onGpsClick={() => {}} currentCity="" />);

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'slow' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Searching cities...')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(520);
    });
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    expect(screen.getAllByText('Searching cities...').length).toBeGreaterThan(0);
  });

  it('shows production network failure copy', async () => {
    apiMocks.searchCity.mockRejectedValue(new Error('offline'));
    render(<SearchBar onSelectCity={() => {}} onGpsClick={() => {}} currentCity="" />);

    await typeSearch('fail');

    expect(screen.getByText('Search unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Check connection.')).toBeInTheDocument();
  });
});
