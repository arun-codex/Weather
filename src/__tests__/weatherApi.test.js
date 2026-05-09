import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { clearSearchCache, searchCity } from '../api/weather';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const apiResult = (name, country, latitude, longitude, population = 1000) => ({
  id: `${name}-${country}`,
  name,
  country,
  country_code: country.slice(0, 2).toUpperCase(),
  latitude,
  longitude,
  population,
  feature_code: 'PPL',
});

describe('weather API search cache', () => {
  beforeEach(() => {
    clearSearchCache();
    axios.get.mockReset();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Open-Meteo name parameter and caches repeated searches for five minutes', async () => {
    axios.get.mockResolvedValueOnce({
      data: { results: [apiResult('Surat', 'India', 21.19, 72.83, 4591246)] },
    });

    const first = await searchCity(' surat ');
    const second = await searchCity('surat');

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get.mock.calls[0][1].params).toMatchObject({
      name: 'surat',
      count: 50,
      language: 'en',
      format: 'json',
    });
    expect(first[0].name).toBe('Surat');
    expect(second).toBe(first);
  });

  it('coalesces identical in-flight searches', async () => {
    let resolveRequest;
    axios.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const first = searchCity('tok');
    const second = searchCity('tok');
    expect(axios.get).toHaveBeenCalledTimes(1);

    resolveRequest({ data: { results: [apiResult('Tokyo', 'Japan', 35.68, 139.69, 9733276)] } });

    const [firstResults, secondResults] = await Promise.all([first, second]);
    expect(secondResults).toBe(firstResults);
  });

  it('expires cached results after the ttl', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T10:00:00Z'));

    axios.get
      .mockResolvedValueOnce({ data: { results: [apiResult('London', 'United Kingdom', 51.5, -0.12)] } })
      .mockResolvedValueOnce({ data: { results: [apiResult('London', 'Canada', 42.98, -81.23)] } });

    await searchCity('lon');
    vi.setSystemTime(new Date('2026-05-09T10:04:59Z'));
    await searchCity('lon');
    expect(axios.get).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-05-09T10:05:01Z'));
    await searchCity('lon');
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});