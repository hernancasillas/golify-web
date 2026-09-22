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
  // For lookups where an empty array means "the request failed" rather than
  // "there is nothing to show" (a league or a team that we know exists). An
  // empty response that lands in the fetch cache would otherwise keep the page
  // broken for the whole revalidate window, so we re-ask, bypassing the cache.
  retryUncachedIfEmpty = false,
): Promise<T[]> {
  if (!API_KEY) return [];

  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, String(v));
  }

  // The plan allows 450 requests/minute and we share that budget with the app.
  // A burst (a build rendering many pages, or a crawler hitting several boards
  // at once) can get a 429, so one short retry rides it out.
  async function once(cached: boolean): Promise<T[] | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(url.toString(), {
        headers: { 'x-apisports-key': API_KEY },
        ...(cached ? { next: { revalidate } } : { cache: 'no-store' as const }),
      });

      if (res.ok) {
        const json: ApiResponse<T> = await res.json();
        return json.response ?? [];
      }

      // 4xx other than "too many requests" will not fix itself — give up.
      if (res.status !== 429 && res.status < 500) return null;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
    }
    return null;
  }

  const cachedRows = await once(true);
  if (cachedRows && cachedRows.length > 0) return cachedRows;
  if (!retryUncachedIfEmpty) return cachedRows ?? [];

  const freshRows = await once(false);
  return freshRows ?? cachedRows ?? [];
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

// Single `live=all` call covers every live match worldwide — cheaper than
// fan-out per league, and Next's fetch cache dedupes it across concurrent
// requests within the revalidate window, so client polling never multiplies
// the cost against the (shared with the app) API-Football quota.
export async function getLiveFixtures(leagueIds: readonly number[]): Promise<Fixture[]> {
  const rows = await apiGet<Fixture>('/fixtures', { live: 'all' }, 15);
  const order = new Map(leagueIds.map((id, i) => [id, i]));
  return rows
    .filter((f) => order.has(f.league.id))
    .sort((a, b) => order.get(a.league.id)! - order.get(b.league.id)!);
}


// ---- Extra types for the content pages (standings, teams, leagues) ----

export interface LeagueInfo {
  league: { id: number; name: string; type: string; logo: string };
  country: { name: string; code: string | null; flag: string | null };
  seasons: { year: number; start: string; end: string; current: boolean }[];
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string | null;
  form: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

export interface StandingsGroup {
  name: string;
  rows: StandingRow[];
}

export interface TeamInfo {
  team: { id: number; name: string; code: string | null; country: string; founded: number | null; logo: string };
  venue: { name: string | null; city: string | null; capacity: number | null };
}

// ---- Fetchers ----

/** Every fixture kicking off on `date` (YYYY-MM-DD), narrowed to the leagues we
 *  track and ordered the way the league chips are ordered on Home. One API call
 *  covers the whole day worldwide, which is far cheaper than one call per league. */
export async function getFixturesByDate(
  date: string,
  leagueIds: readonly number[],
): Promise<Fixture[]> {
  const rows = await apiGet<Fixture>('/fixtures', { date }, 300);
  const order = new Map(leagueIds.map((id, i) => [id, i]));
  return rows
    .filter((f) => order.has(f.league.id))
    .sort(
      (a, b) =>
        order.get(a.league.id)! - order.get(b.league.id)! ||
        a.fixture.date.localeCompare(b.fixture.date),
    );
}

export async function getLeagueInfo(id: number): Promise<LeagueInfo | null> {
  const rows = await apiGet<LeagueInfo>('/leagues', { id }, 86400, true);
  return rows[0] ?? null;
}

/** The season a league is currently playing. Leagues straddle calendar years
 *  (Premier League 2026/27) and others run inside one (Brasileirão), so we ask
 *  the API instead of guessing from the date. */
export function currentSeason(info: LeagueInfo): number | null {
  const current = info.seasons.find((s) => s.current);
  return current?.year ?? info.seasons.at(-1)?.year ?? null;
}

/** Standings, flattened to one entry per group (a league has a single group;
 *  cups like Libertadores have several). */
export async function getStandings(
  league: number,
  season: number,
): Promise<StandingsGroup[]> {
  const rows = await apiGet<{ league: { standings: StandingRow[][] } }>(
    '/standings',
    { league, season },
    600,
  );
  const groups = rows[0]?.league?.standings ?? [];
  return groups
    .filter((g) => g.length > 0)
    // Each row carries its own group label ("Group A"); a domestic league
    // reports the league name there, which we drop so the table renders
    // without a redundant heading.
    .map((g) => ({ name: g[0].group ?? '', rows: g }));
}

export async function getLeagueFixtures(
  league: number,
  season: number,
  window: { next?: number; last?: number },
): Promise<Fixture[]> {
  const params: Record<string, string | number> = { league, season };
  if (window.next) params.next = window.next;
  if (window.last) params.last = window.last;
  return apiGet<Fixture>('/fixtures', params, 300);
}

export async function getTeam(id: number): Promise<TeamInfo | null> {
  const rows = await apiGet<TeamInfo>('/teams', { id }, 86400, true);
  return rows[0] ?? null;
}

export async function getTeamFixtures(
  team: number,
  window: { next?: number; last?: number },
): Promise<Fixture[]> {
  const params: Record<string, string | number> = { team };
  if (window.next) params.next = window.next;
  if (window.last) params.last = window.last;
  return apiGet<Fixture>('/fixtures', params, 300);
}

/** Every fixture of a tournament season, oldest first. Used by the World Cup
 *  archive, where the full 104-match list is now fixed history. */
export async function getTournamentFixtures(
  league: number,
  season: number,
): Promise<Fixture[]> {
  const rows = await apiGet<Fixture>('/fixtures', { league, season }, 86400);
  return rows.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
}
