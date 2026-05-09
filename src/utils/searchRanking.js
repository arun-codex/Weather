const MAX_QUERY_LENGTH = 80;
const DISPLAY_LIMIT = 8;
const LETTER_OR_NUMBER_RE = /[\p{L}\p{N}]/u;
const DIACRITICS_RE = /[\u0300-\u036f]/g;

const CITY_FEATURES = new Set(['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC']);
const NON_CITY_FEATURES = new Set(['AIRP', 'AIRH', 'MT', 'MTS', 'PK', 'RGN', 'PCLI', 'ADM1', 'ADM2', 'ADM3', 'ADM4']);

function asText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function foldSearchText(value) {
  return asText(value)
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase();
}

export function normalizeSearchQuery(value) {
  const query = asText(value).slice(0, MAX_QUERY_LENGTH);
  if (query.length < 2 || !LETTER_OR_NUMBER_RE.test(query)) return '';
  return query;
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildResultId(result, index, lat, lon) {
  if (result?.id) return String(result.id);
  return [
    result?.name ?? 'city',
    result?.country_code ?? result?.countryCode ?? '',
    lat ?? '',
    lon ?? '',
    index,
  ].join('-');
}

export function normalizeCityResult(result, index = 0) {
  const lat = toFiniteNumber(result?.latitude ?? result?.lat);
  const lon = toFiniteNumber(result?.longitude ?? result?.lon);
  const population = Math.max(0, toFiniteNumber(result?.population) ?? 0);

  return {
    id: buildResultId(result, index, lat, lon),
    name: asText(result?.name),
    admin1: asText(result?.admin1),
    admin2: asText(result?.admin2),
    admin3: asText(result?.admin3),
    admin4: asText(result?.admin4),
    country: asText(result?.country),
    country_code: asText(result?.country_code ?? result?.countryCode).toUpperCase(),
    lat,
    lon,
    population,
    timezone: asText(result?.timezone),
    feature_code: asText(result?.feature_code ?? result?.featureCode).toUpperCase(),
    raw: result,
  };
}

export function formatCitySubtitle(city) {
  const parts = [city?.admin1, city?.country].filter(Boolean);
  return parts.join(', ');
}

export function getCityIdentityKey(city) {
  const normalized = normalizeCityResult(city);
  const lat = normalized.lat === null ? '' : normalized.lat.toFixed(3);
  const lon = normalized.lon === null ? '' : normalized.lon.toFixed(3);
  return [
    foldSearchText(normalized.name),
    foldSearchText(normalized.admin1),
    foldSearchText(normalized.country),
    lat,
    lon,
  ].join('|');
}

function getRecentBoost(city, recentSearches) {
  const cityName = foldSearchText(city.name);
  const cityCountry = foldSearchText(city.country);

  for (const recent of recentSearches) {
    const normalizedRecent = normalizeCityResult(recent);
    const sameCoords =
      city.lat !== null &&
      city.lon !== null &&
      normalizedRecent.lat !== null &&
      normalizedRecent.lon !== null &&
      Math.abs(city.lat - normalizedRecent.lat) < 0.01 &&
      Math.abs(city.lon - normalizedRecent.lon) < 0.01;

    if (sameCoords) return 450;

    const sameName = cityName && cityName === foldSearchText(normalizedRecent.name);
    const sameCountry = cityCountry && cityCountry === foldSearchText(normalizedRecent.country);
    if (sameName && sameCountry) return 250;
  }

  return 0;
}

function getFeatureBoost(featureCode) {
  if (featureCode === 'PPLC') return 120;
  if (featureCode === 'PPLA') return 60;
  if (featureCode === 'PPLA2') return 30;
  return 0;
}

function scoreCity(city, foldedQuery, recentSearches, hasCityResults) {
  const foldedName = foldSearchText(city.name);
  let score = Math.log10(city.population + 1) * 80;

  if (city.population >= 4_000_000) {
    score += 20;
  }

  if (foldedName === foldedQuery) {
    score += foldedQuery.length >= 4 ? 350 : 40;
  }

  if (foldedName.startsWith(foldedQuery)) {
    score += 250;
    if (foldedQuery.length >= 3 && foldedName.length > foldedQuery.length) {
      score += 120;
    }
  }

  score += getFeatureBoost(city.feature_code);
  score += getRecentBoost(city, recentSearches);

  if (hasCityResults && NON_CITY_FEATURES.has(city.feature_code)) {
    score -= 500;
  }

  return score;
}

export function rankCityResults(query, results, recentSearches = [], limit = DISPLAY_LIMIT) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const foldedQuery = foldSearchText(normalizedQuery);
  const normalizedResults = (Array.isArray(results) ? results : [])
    .map((result, index) => normalizeCityResult(result, index))
    .filter((city) => city.name && city.lat !== null && city.lon !== null);

  const uniqueResults = [];
  const seen = new Set();
  for (const city of normalizedResults) {
    const key = getCityIdentityKey(city);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(city);
    }
  }

  const hasCityResults = uniqueResults.some((city) => CITY_FEATURES.has(city.feature_code));

  return uniqueResults
    .map((city, index) => ({
      city,
      index,
      score: scoreCity(city, foldedQuery, recentSearches, hasCityResults),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.city.population !== a.city.population) return b.city.population - a.city.population;
      return a.index - b.index;
    })
    .slice(0, limit)
    .map(({ city }) => city);
}
