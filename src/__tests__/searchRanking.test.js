import { describe, expect, it } from 'vitest';
import { normalizeSearchQuery, rankCityResults } from '../utils/searchRanking';

const city = (name, country, population, featureCode, lat, lon, extra = {}) => ({
  name,
  country,
  population,
  feature_code: featureCode,
  latitude: lat,
  longitude: lon,
  ...extra,
});

describe('search ranking', () => {
  it('normalizes invalid and noisy queries', () => {
    expect(normalizeSearchQuery('   ')).toBe('');
    expect(normalizeSearchQuery('☁️☀️')).toBe('');
    expect(normalizeSearchQuery('  New    York  ')).toBe('New York');
    expect(normalizeSearchQuery('a'.repeat(120))).toHaveLength(80);
  });

  it('ranks sur by prefix completion and population', () => {
    const ranked = rankCityResults('sur', [
      city('Sur', 'Oman', 71152, 'PPLA', 22.56, 59.52),
      city('Surabaya', 'Indonesia', 2874314, 'PPLA2', -7.24, 112.75),
      city('Surat', 'India', 4591246, 'PPL', 21.19, 72.83),
      city('Suriname', 'Suriname', 575991, 'PCLI', 3.91, -56.02),
      city('Surrey', 'Canada', 568322, 'PPL', 49.1, -122.82),
    ]);

    expect(ranked.slice(0, 3).map((result) => `${result.name}, ${result.country}`)).toEqual([
      'Surat, India',
      'Surabaya, Indonesia',
      'Surrey, Canada',
    ]);
  });

  it('keeps duplicate city names distinguishable while ranking the major match first', () => {
    const ranked = rankCityResults('lon', [
      city('London', 'Canada', 422324, 'PPL', 42.98, -81.23, { admin1: 'Ontario' }),
      city('London', 'United Kingdom', 8961989, 'PPLC', 51.5, -0.12, { admin1: 'England' }),
      city('Loni', 'India', 516082, 'PPL', 28.75, 77.29),
    ]);

    expect(ranked[0].country).toBe('United Kingdom');
    expect(ranked.map((result) => result.admin1)).toContain('Ontario');
  });

  it('ranks Tokyo first for tok', () => {
    const ranked = rankCityResults('tok', [
      city('Tok', 'United States', 1258, 'PPL', 63.33, -142.98),
      city('Tokyo', 'Japan', 9733276, 'PPLC', 35.68, 139.69),
      city('Tokushima', 'Japan', 267345, 'PPLA', 34.06, 134.56),
    ]);

    expect(`${ranked[0].name}, ${ranked[0].country}`).toBe('Tokyo, Japan');
  });

  it('boosts exact recent selections over larger same-name cities', () => {
    const texas = city('Paris', 'United States', 25171, 'PPL', 33.66, -95.55, { admin1: 'Texas' });
    const ranked = rankCityResults('paris', [
      city('Paris', 'France', 2138551, 'PPLC', 48.85, 2.35),
      texas,
    ], [texas]);

    expect(ranked[0].admin1).toBe('Texas');
  });
});

