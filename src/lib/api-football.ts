// Server-only API-Football v3 client for golify-web SSR content.
// Mirrors the app's auth scheme (x-apisports-key). Adds Next.js fetch caching
// so content pages render fast and crawlers always get fresh-enough facts.
// Server-only by convention: only import from Server Components / route
// handlers.
//
// Quota: the plan allows 450 requests/minute and 75k/day, SHARED with the app.
// Every page render here is a cost the app pays for, so:
//   - cache long anything that does not change during a match (squads,
//     transfers, careers, venues, history: hours to days);
//   - never fan out per item when one call covers the list;
//   - a per-instance concurrency cap keeps a crawler burst from turning one
//     render into dozens of parallel calls.

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY ?? '';

// Cache windows (seconds), named by how fast the data moves.
export const TTL = {
  live: 30,
  day: 300, // today's fixtures, standings during a matchday
  standings: 600,
  hours: 3600 * 6, // squads, coaches, season fixtures of past rounds
  daily: 86400, // leagues, venues, careers, transfers, history
  weekly: 86400 * 7,
} as const;

interface ApiResponse<T> {
  response?: T | T[];
  results?: number;
  errors?: unknown;
  paging?: { current: number; total: number };
}

export class ApiFootballError extends Error {}

// ---- Concurrency cap -------------------------------------------------------
const MAX_CONCURRENT = 6;
let active = 0;
const queue: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((r) => queue.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

interface GetOptions {
  revalidate?: number;
  /** NEVER from an ISR page (a dynamic-param page with generateStaticParams
   *  returning []): the uncached retry is a `no-store` fetch, which flips a
   *  statically cached route to dynamic at runtime and errors. ISR pages use
   *  `strict` instead: a failure throws (Next keeps the last good copy),
   *  a genuinely empty answer returns null (→ notFound()).
   *
   *  For lookups where an empty array means "the request failed" rather than
   *  "there is nothing to show" (a league or a team that we know exists). An
   *  empty response that lands in the fetch cache would otherwise keep the
   *  page broken for the whole revalidate window, so we re-ask uncached. */
  retryUncachedIfEmpty?: boolean;
  /** Throw instead of returning [] when the API fails. Use in sitemaps and
   *  other ISR outputs: a thrown regeneration keeps the previous good copy,
   *  a returned empty list would replace it. */
  strict?: boolean;
}

async function request<T>(
  endpoint: string,
  params: Record<string, string | number>,
  cached: boolean,
  revalidate: number,
): Promise<{ rows: T[]; paging?: ApiResponse<T>['paging'] } | null> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.append(k, String(v));

  return withSlot(async () => {
    // A burst (a build rendering many pages, or a crawler hitting several
    // boards at once) can get a 429, so one short retry rides it out.
    for (let attempt = 0; attempt < 2; attempt++) {
      let res: Response;
      try {
        res = await fetch(url.toString(), {
          headers: { 'x-apisports-key': API_KEY },
          ...(cached ? { next: { revalidate } } : { cache: 'no-store' as const }),
        });
      } catch {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        return null;
      }

      if (res.ok) {
        const json: ApiResponse<T> = await res.json();
        // API-Football reports quota/plan problems as 200 + `errors`.
        const errs = json.errors;
        const hasErrors = Array.isArray(errs) ? errs.length > 0 : !!errs && Object.keys(errs).length > 0;
        if (hasErrors) return null;
        const r = json.response;
        const rows = Array.isArray(r) ? r : r != null ? [r as T] : [];
        return { rows, paging: json.paging };
      }

      // 4xx other than "too many requests" will not fix itself — give up.
      if (res.status !== 429 && res.status < 500) return null;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
    }
    return null;
  });
}

/** Generic cached GET for endpoints this module has no named fetcher for.
 *  Same caching, retry, concurrency cap and `strict` semantics. */
export async function apiFootballGet<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  opts: GetOptions = {},
): Promise<T[]> {
  return apiGet<T>(endpoint, params, opts);
}

async function apiGet<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  opts: GetOptions | number = {},
): Promise<T[]> {
  const o: GetOptions = typeof opts === 'number' ? { revalidate: opts } : opts;
  const revalidate = o.revalidate ?? 60;

  if (!API_KEY) {
    if (o.strict) throw new ApiFootballError('API_FOOTBALL_KEY missing');
    return [];
  }

  const first = await request<T>(endpoint, params, true, revalidate);
  if (first && first.rows.length > 0) return first.rows;
  if (!o.retryUncachedIfEmpty) {
    if (!first && o.strict) throw new ApiFootballError(`API-Football ${endpoint} failed`);
    return first?.rows ?? [];
  }

  const fresh = await request<T>(endpoint, params, false, revalidate);
  if (!fresh && !first && o.strict) throw new ApiFootballError(`API-Football ${endpoint} failed`);
  return fresh?.rows ?? first?.rows ?? [];
}

/** Every page of a paginated endpoint (players lists page by 20). */
async function apiGetAllPages<T>(
  endpoint: string,
  params: Record<string, string | number>,
  opts: GetOptions & { maxPages?: number } = {},
): Promise<T[]> {
  const revalidate = opts.revalidate ?? TTL.daily;
  if (!API_KEY) {
    if (opts.strict) throw new ApiFootballError('API_FOOTBALL_KEY missing');
    return [];
  }
  const first = await request<T>(endpoint, { ...params, page: 1 }, true, revalidate);
  if (!first) {
    if (opts.strict) throw new ApiFootballError(`API-Football ${endpoint} failed`);
    return [];
  }
  const total = Math.min(first.paging?.total ?? 1, opts.maxPages ?? 60);
  const rows = [...first.rows];
  // Sequential on purpose: a league's player list is ~30 pages, and firing
  // them all at once is exactly the burst the shared quota cannot take.
  for (let page = 2; page <= total; page++) {
    const next = await request<T>(endpoint, { ...params, page }, true, revalidate);
    if (!next) {
      if (opts.strict) throw new ApiFootballError(`API-Football ${endpoint} page ${page} failed`);
      break;
    }
    rows.push(...next.rows);
  }
  return rows;
}

// ---- Types (projection of what content pages render) ----------------------

export interface TeamRef {
  id: number;
  name: string;
  logo: string;
}

export interface Fixture {
  fixture: {
    id: number;
    referee?: string | null;
    date: string;
    timezone: string;
    timestamp?: number;
    status: { long: string; short: string; elapsed: number | null; extra?: number | null };
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
    home: TeamRef & { winner: boolean | null };
    away: TeamRef & { winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface FixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: TeamRef;
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  /** "Goal" | "Card" | "subst" | "Var" */
  type: string;
  /** "Normal Goal" | "Own Goal" | "Penalty" | "Missed Penalty" | "Yellow Card" | "Red Card" | "Substitution 1" … */
  detail: string;
  comments: string | null;
}

export interface LineupPlayer {
  player: { id: number; name: string; number: number | null; pos: string | null; grid: string | null };
}

export interface Lineup {
  team: TeamRef & { colors?: unknown };
  formation: string | null;
  coach: { id: number | null; name: string | null; photo?: string | null };
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface TeamStatistics {
  team: TeamRef;
  statistics: { type: string; value: number | string | null }[];
}

export interface FixturePlayerStats {
  player: { id: number; name: string; photo: string };
  statistics: {
    games: { minutes: number | null; number: number | null; position: string | null; rating: string | null; captain: boolean; substitute: boolean };
    shots: { total: number | null; on: number | null };
    goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
    passes: { total: number | null; key: number | null; accuracy: string | number | null };
    cards: { yellow: number; red: number };
  }[];
}

export interface FixtureDetail extends Fixture {
  events: FixtureEvent[];
  lineups: Lineup[];
  statistics: TeamStatistics[];
  players: { team: TeamRef; players: FixturePlayerStats[] }[];
}

export interface LeagueInfo {
  league: { id: number; name: string; type: string; logo: string };
  country: { name: string; code: string | null; flag: string | null };
  seasons: {
    year: number;
    start: string;
    end: string;
    current: boolean;
    coverage?: {
      standings?: boolean;
      players?: boolean;
      top_scorers?: boolean;
      top_assists?: boolean;
      top_cards?: boolean;
      injuries?: boolean;
      fixtures?: { events?: boolean; lineups?: boolean; statistics_fixtures?: boolean; statistics_players?: boolean };
    };
  }[];
}

export interface StandingRow {
  rank: number;
  team: TeamRef;
  points: number;
  goalsDiff: number;
  group: string | null;
  form: string | null;
  /** Qualification/relegation zone as the provider words it
   *  ("Promotion - Libertadores (Group Stage)", "Relegation - Serie B"). */
  description?: string | null;
  status?: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home?: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away?: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

export interface StandingsGroup {
  name: string;
  rows: StandingRow[];
}

export interface TeamInfo {
  team: { id: number; name: string; code: string | null; country: string; founded: number | null; logo: string; national?: boolean };
  venue: {
    id?: number | null;
    name: string | null;
    city: string | null;
    capacity: number | null;
    address?: string | null;
    surface?: string | null;
    image?: string | null;
  };
}

export interface SquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  /** "Goalkeeper" | "Defender" | "Midfielder" | "Attacker" */
  position: string | null;
  photo: string;
}

export interface PlayerBio {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: { date: string | null; place: string | null; country: string | null };
  nationality: string | null;
  height: string | null;
  weight: string | null;
  injured?: boolean;
  photo: string;
  number?: number | null;
  position?: string | null;
}

export interface PlayerSeasonStats {
  team: TeamRef;
  league: { id: number | null; name: string; country: string | null; logo: string | null; flag?: string | null; season: number };
  games: { appearences: number | null; lineups: number | null; minutes: number | null; number: number | null; position: string | null; rating: string | null; captain: boolean };
  substitutes?: { in: number | null; out: number | null; bench: number | null };
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles?: { total: number | null; blocks: number | null; interceptions: number | null };
  duels?: { total: number | null; won: number | null };
  dribbles?: { attempts: number | null; success: number | null; past: number | null };
  fouls?: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; yellowred: number | null; red: number | null };
  penalty?: { won: number | null; commited: number | null; scored: number | null; missed: number | null; saved: number | null };
}

export interface PlayerWithStats {
  player: PlayerBio;
  statistics: PlayerSeasonStats[];
}

export interface Transfer {
  date: string;
  type: string | null;
  teams: { in: TeamRef; out: TeamRef };
}

export interface PlayerTransfers {
  player: { id: number; name: string };
  update: string;
  transfers: Transfer[];
}

export interface Coach {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: { date: string | null; place: string | null; country: string | null };
  nationality: string | null;
  photo: string;
  team: TeamRef;
  career: { team: TeamRef; start: string | null; end: string | null }[];
}

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  surface: string | null;
  image: string | null;
}

export interface Injury {
  player: { id: number; name: string; photo: string; type: string; reason: string };
  team: TeamRef;
  fixture: { id: number; date: string };
  league: { id: number; season: number };
}

export interface Trophy {
  league: string;
  country: string;
  season: string;
  place: string;
}

// ---- Fixtures ---------------------------------------------------------------

export async function getFixtureById(id: number): Promise<Fixture | null> {
  // Live/near matches change fast; short revalidate keeps facts current.
  const rows = await apiGet<Fixture>('/fixtures', { id }, TTL.live);
  return rows[0] ?? null;
}

/** Full match: events, lineups, team stats and player ratings in one call
 *  (the single-fixture response carries all of them). */
export async function getFixtureDetail(id: number, opts: { strict?: boolean; revalidate?: number } = {}): Promise<FixtureDetail | null> {
  const rows = await apiGet<FixtureDetail>('/fixtures', { id }, { revalidate: opts.revalidate ?? TTL.live, strict: opts.strict });
  const f = rows[0];
  if (!f) return null;
  return { ...f, events: f.events ?? [], lineups: f.lineups ?? [], statistics: f.statistics ?? [], players: f.players ?? [] };
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

/** Every fixture kicking off on `date` (YYYY-MM-DD, UTC day unless `timezone`
 *  is given), narrowed to the leagues we track and ordered the way the league
 *  chips are ordered on Home. One API call covers the whole day worldwide. */
export async function getFixturesByDate(
  date: string,
  leagueIds: readonly number[],
  timezone?: string,
  opts: { strict?: boolean } = {},
): Promise<Fixture[]> {
  const params: Record<string, string> = { date };
  if (timezone) params.timezone = timezone;
  const rows = await apiGet<Fixture>('/fixtures', params, { revalidate: TTL.day, strict: opts.strict });
  const order = new Map(leagueIds.map((id, i) => [id, i]));
  return rows
    .filter((f) => order.has(f.league.id))
    .sort(
      (a, b) =>
        order.get(a.league.id)! - order.get(b.league.id)! ||
        a.fixture.date.localeCompare(b.fixture.date),
    );
}

export async function getLeagueFixtures(
  league: number,
  season: number,
  window: { next?: number; last?: number },
): Promise<Fixture[]> {
  const params: Record<string, string | number> = { league, season };
  if (window.next) params.next = window.next;
  if (window.last) params.last = window.last;
  return apiGet<Fixture>('/fixtures', params, TTL.day);
}

/** Every fixture of a league season, oldest first. One call per season —
 *  the base for season pages, round pages, calendars and sitemaps. */
export async function getSeasonFixtures(
  league: number,
  season: number,
  opts: { strict?: boolean; revalidate?: number } = {},
): Promise<Fixture[]> {
  const rows = await apiGet<Fixture>('/fixtures', { league, season }, { revalidate: opts.revalidate ?? TTL.standings, strict: opts.strict });
  return rows.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
}

/** Kept for the World Cup archive (full 104-match list, now fixed history). */
export async function getTournamentFixtures(league: number, season: number): Promise<Fixture[]> {
  return getSeasonFixtures(league, season, { revalidate: TTL.daily });
}

export async function getRounds(league: number, season: number): Promise<string[]> {
  return apiGet<string>('/fixtures/rounds', { league, season }, TTL.hours);
}

export async function getCurrentRound(league: number, season: number): Promise<string | null> {
  const rows = await apiGet<string>('/fixtures/rounds', { league, season, current: 'true' }, TTL.standings);
  return rows[0] ?? null;
}

export async function getTeamFixtures(team: number, window: { next?: number; last?: number }): Promise<Fixture[]> {
  const params: Record<string, string | number> = { team };
  if (window.next) params.next = window.next;
  if (window.last) params.last = window.last;
  return apiGet<Fixture>('/fixtures', params, TTL.day);
}

export async function getTeamSeasonFixtures(team: number, season: number): Promise<Fixture[]> {
  const rows = await apiGet<Fixture>('/fixtures', { team, season }, TTL.standings);
  return rows.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
}

/** Last meetings between two teams, newest first. */
export async function getHeadToHead(a: number, b: number, last = 10): Promise<Fixture[]> {
  const [x, y] = a < b ? [a, b] : [b, a];
  const rows = await apiGet<Fixture>('/fixtures/headtohead', { h2h: `${x}-${y}`, last }, TTL.hours);
  return rows.sort((p, q) => q.fixture.date.localeCompare(p.fixture.date));
}

export async function getVenueSeasonFixtures(venue: number, season: number): Promise<Fixture[]> {
  const rows = await apiGet<Fixture>('/fixtures', { venue, season }, TTL.hours);
  return rows.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
}

export async function getInjuries(fixture: number): Promise<Injury[]> {
  return apiGet<Injury>('/injuries', { fixture }, TTL.hours);
}

// ---- Leagues & standings ------------------------------------------------------

/** Cache-first, with one uncached retry when the answer comes back empty. Use
 *  from request-time rendering, where a poisoned cache entry would otherwise
 *  keep a league page broken. */
export async function getLeagueInfo(id: number, opts: { strict?: boolean } = {}): Promise<LeagueInfo | null> {
  const rows = await apiGet<LeagueInfo>('/leagues', { id }, opts.strict ? { revalidate: TTL.daily, strict: true } : { revalidate: TTL.daily, retryUncachedIfEmpty: true });
  return rows[0] ?? null;
}

/** Cache-only variant. Sitemaps must stay cacheable: a `no-store` fetch
 *  anywhere inside them would make the route dynamic. */
export async function getLeagueInfoCached(id: number, opts: { strict?: boolean } = {}): Promise<LeagueInfo | null> {
  const rows = await apiGet<LeagueInfo>('/leagues', { id }, { revalidate: TTL.daily, strict: opts.strict });
  return rows[0] ?? null;
}

/** The season a league is currently playing. Leagues straddle calendar years
 *  (Premier League 2026/27) and others run inside one (Brasileirão), so we ask
 *  the API instead of guessing from the date. */
export function currentSeason(info: LeagueInfo): number | null {
  const current = info.seasons.find((s) => s.current);
  return current?.year ?? info.seasons.at(-1)?.year ?? null;
}

/** Competitions a team plays this season (league + cups). */
export async function getTeamLeagues(team: number): Promise<LeagueInfo[]> {
  return apiGet<LeagueInfo>('/leagues', { team, current: 'true' }, TTL.daily);
}

/** Standings, flattened to one entry per group (a league has a single group;
 *  cups like Libertadores have several). */
export async function getStandings(league: number, season: number, opts: { strict?: boolean } = {}): Promise<StandingsGroup[]> {
  const rows = await apiGet<{ league: { standings: StandingRow[][] } }>(
    '/standings',
    { league, season },
    { revalidate: TTL.standings, strict: opts.strict },
  );
  const groups = rows[0]?.league?.standings ?? [];
  return groups
    .filter((g) => g.length > 0)
    // Each row carries its own group label ("Group A"); a domestic league
    // reports the league name there, which we drop so the table renders
    // without a redundant heading.
    .map((g) => ({ name: g[0].group ?? '', rows: g }));
}

export async function getTopScorers(league: number, season: number): Promise<PlayerWithStats[]> {
  return apiGet<PlayerWithStats>('/players/topscorers', { league, season }, TTL.hours);
}

export async function getTopAssists(league: number, season: number): Promise<PlayerWithStats[]> {
  return apiGet<PlayerWithStats>('/players/topassists', { league, season }, TTL.hours);
}

export async function getTopYellowCards(league: number, season: number): Promise<PlayerWithStats[]> {
  return apiGet<PlayerWithStats>('/players/topyellowcards', { league, season }, TTL.hours);
}

export async function getTopRedCards(league: number, season: number): Promise<PlayerWithStats[]> {
  return apiGet<PlayerWithStats>('/players/topredcards', { league, season }, TTL.hours);
}

// ---- Teams ------------------------------------------------------------------

export async function getTeam(id: number, opts: { strict?: boolean } = {}): Promise<TeamInfo | null> {
  const rows = await apiGet<TeamInfo>('/teams', { id }, opts.strict ? { revalidate: TTL.daily, strict: true } : { revalidate: TTL.daily, retryUncachedIfEmpty: true });
  return rows[0] ?? null;
}

/** Every team in a league season, with its venue. One call per league. */
export async function getLeagueTeams(league: number, season: number, opts: { strict?: boolean } = {}): Promise<TeamInfo[]> {
  return apiGet<TeamInfo>('/teams', { league, season }, { revalidate: TTL.daily, strict: opts.strict });
}

export async function getSquad(team: number): Promise<SquadPlayer[]> {
  const rows = await apiGet<{ team: TeamRef; players: SquadPlayer[] }>('/players/squads', { team }, TTL.hours);
  return rows[0]?.players ?? [];
}

/** Season stats of every player of a team (2–3 pages). */
export async function getTeamPlayers(team: number, season: number): Promise<PlayerWithStats[]> {
  return apiGetAllPages<PlayerWithStats>('/players', { team, season }, { revalidate: TTL.hours, maxPages: 5 });
}

export async function getCoach(team: number): Promise<Coach | null> {
  const rows = await apiGet<Coach>('/coachs', { team }, TTL.daily);
  // The endpoint returns every coach who ever managed the team; the current
  // one is the career entry for this team with no end date.
  const current = rows.find((c) => c.career?.some((k) => k.team?.id === team && !k.end));
  return current ?? null;
}

export async function getTeamTransfers(team: number): Promise<PlayerTransfers[]> {
  return apiGet<PlayerTransfers>('/transfers', { team }, TTL.daily);
}

export async function getTeamSeasons(team: number): Promise<number[]> {
  return apiGet<number>('/teams/seasons', { team }, TTL.weekly);
}

// ---- Players ----------------------------------------------------------------

export async function getPlayer(id: number, season: number, opts: { strict?: boolean } = {}): Promise<PlayerWithStats | null> {
  const rows = await apiGet<PlayerWithStats>('/players', { id, season }, { revalidate: TTL.hours, strict: opts.strict });
  return rows[0] ?? null;
}

export async function getPlayerProfile(id: number, opts: { strict?: boolean } = {}): Promise<PlayerBio | null> {
  const rows = await apiGet<{ player: PlayerBio }>('/players/profiles', { player: id }, { revalidate: TTL.daily, strict: opts.strict });
  return rows[0]?.player ?? null;
}

export async function getPlayerSeasons(id: number): Promise<number[]> {
  return apiGet<number>('/players/seasons', { player: id }, TTL.weekly);
}

export async function getPlayerTransfers(id: number): Promise<Transfer[]> {
  const rows = await apiGet<PlayerTransfers>('/transfers', { player: id }, TTL.daily);
  return rows[0]?.transfers ?? [];
}

export async function getPlayerTrophies(id: number): Promise<Trophy[]> {
  return apiGet<Trophy>('/trophies', { player: id }, TTL.weekly);
}

/** Every player with stats in a league season (~25–35 pages for a top
 *  league). Expensive: call from cached sitemap/listing outputs only. */
export async function getLeaguePlayers(
  league: number,
  season: number,
  opts: { strict?: boolean } = {},
): Promise<PlayerWithStats[]> {
  return apiGetAllPages<PlayerWithStats>('/players', { league, season }, { revalidate: TTL.weekly, strict: opts.strict });
}

// ---- Venues -----------------------------------------------------------------

export async function getVenue(id: number, opts: { strict?: boolean } = {}): Promise<Venue | null> {
  const rows = await apiGet<Venue>('/venues', { id }, { revalidate: TTL.weekly, strict: opts.strict });
  return rows[0] ?? null;
}

// ---- Search -----------------------------------------------------------------

export async function searchTeams(q: string): Promise<TeamInfo[]> {
  if (q.trim().length < 3) return [];
  return apiGet<TeamInfo>('/teams', { search: q.trim() }, TTL.daily);
}

export async function searchPlayers(q: string): Promise<{ player: PlayerBio }[]> {
  if (q.trim().length < 3) return [];
  return apiGet<{ player: PlayerBio }>('/players/profiles', { search: q.trim() }, TTL.daily);
}

// ---- Status helpers -----------------------------------------------------------

export const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

export function fixturePhase(f: Fixture): 'scheduled' | 'live' | 'finished' | 'off' {
  const s = f.fixture.status.short;
  if (LIVE_STATUSES.includes(s)) return 'live';
  if (FINISHED_STATUSES.includes(s)) return 'finished';
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP'].includes(s)) return 'off';
  return 'scheduled';
}
