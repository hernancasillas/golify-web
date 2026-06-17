// Server-only API-Football v3 client for golify-web SSR content.
// Mirrors the app's auth scheme (x-apisports-key). Adds Next.js fetch caching
// so content pages render fast and crawlers always get fresh-enough facts.
// Server-only by convention: only import from Server Components.

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
