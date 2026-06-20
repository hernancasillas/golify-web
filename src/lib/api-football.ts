// Server-only API-Football v3 client for golify-web SSR content.
// Mirrors the app's auth scheme (x-apisports-key). Adds Next.js fetch caching
// so content pages render fast and crawlers always get fresh-enough facts.
// Server-only by convention: only import from Server Components.

import type {
  APIFootballFixture,
  APIFootballStanding,
} from './api-football.types';

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY ?? '';

interface ApiResponse<T> {
  response?: T[];
  results?: number;
  paging?: { current: number; total: number };
}

async function apiGet<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  revalidate = 60,
): Promise<T[]> {
  if (!API_KEY) return [];

  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
    next: { revalidate },
  });

  if (!res.ok) return [];
  const json: ApiResponse<T> = await res.json();
  return json.response ?? [];
}

// ---- Types (minimal projection of what content pages render) ----

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    timezone: string;
    status: { long: string; short: string; elapsed: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

// ---- Public fetchers ----

export async function getFixtureById(id: number): Promise<Fixture | null> {
  // Live/near matches change fast; short revalidate keeps facts current.
  const rows = await apiGet<Fixture>('/fixtures', { id }, 30);
  return rows[0] ?? null;
}

export async function getWorldCupFixtures(
  leagueId: number,
  season: number,
): Promise<Fixture[]> {
  // Whole-tournament schedule. Evergreen-ish — revalidate hourly.
  return apiGet<Fixture>('/fixtures', { league: leagueId, season }, 3600);
}

// ---- Bracket data ----
// The bracket engine (src/lib/bracket) reads the fuller API-Football shapes
// (APIFootballStanding / APIFootballFixture), so these fetchers type their
// responses against those rather than the trimmed `Fixture`.

interface StandingsEnvelope {
  league: { standings: APIFootballStanding[][] };
}

/**
 * Flat standings for every group of the tournament (A–L). The /standings
 * endpoint nests rows as standings[group][row]; we flatten so the engine can
 * bucket by each row's `group` field. Short-ish revalidate so the projected
 * bracket tracks results within a few minutes.
 */
export async function getWorldCupStandings(
  leagueId: number,
  season: number,
): Promise<APIFootballStanding[]> {
  const rows = await apiGet<StandingsEnvelope>(
    '/standings',
    { league: leagueId, season },
    300,
  );
  return rows[0]?.league.standings.flat() ?? [];
}

/**
 * Full fixture list typed for the engine (live overlay + clinch detection).
 * Same endpoint as getWorldCupFixtures; the engine needs the richer type.
 */
export async function getWorldCupFixturesForBracket(
  leagueId: number,
  season: number,
): Promise<APIFootballFixture[]> {
  return apiGet<APIFootballFixture>(
    '/fixtures',
    { league: leagueId, season },
    300,
  );
}
