// Data layer shared by the team page and its three sub-pages.
//
// Every fetcher here goes through the cached API-Football client and reuses
// the exact endpoint + params of the named fetchers where one exists, so the
// team page, its sub-pages and the other sections of the site share one cache
// entry per resource instead of paying for it several times against the quota
// the app also lives on.
//
// Two rules the pages rely on:
//   - The primary entity of each page is loaded with `strict`: an API failure
//     throws (ISR keeps the last good copy) and only a genuinely empty answer
//     turns into a 404 / a noindex. A failed call is never rendered as "this
//     team has no fixtures".
//   - Secondary blocks use the tolerant fetchers and simply do not render when
//     their data is missing.

import { localizeDeep } from '@/lib/nations';
import {
  TTL,
  apiFootballGet,
  getTeam,
  type Coach,
  type Fixture,
  type LeagueInfo,
  type PlayerSeasonStats,
  type PlayerTransfers,
  type PlayerWithStats,
  type SquadPlayer,
  type StandingRow,
  type StandingsGroup,
  type TeamInfo,
} from '@/lib/api-football';
import {
  COMPETITIONS,
  competitionById,
  competitionName,
  isCovered,
  parseRound,
  seasonSlug,
  type Competition,
  type Phase,
} from '@/lib/competitions';
import { teamSlugId, type RouteLocale } from '@/lib/routes';
import { idFromSlug } from '@/lib/slug';

// ---- Current competitions -------------------------------------------------

export interface CurrentComp {
  id: number;
  name: string;
  logo: string;
  type: string;
  country: string;
  /** API season the team plays in this competition right now. */
  year: number;
  start: string;
  end: string;
  /** In the site's coverage registry (has its own hub/season pages). */
  competition: Competition | null;
}

export interface TeamCore {
  info: TeamInfo;
  /** Reader's locale: national-team names are translated for display. */
  locale: RouteLocale;
  /** Every competition the team has ever played, with the seasons it played. */
  history: LeagueInfo[];
  /** Competitions of the current season, covered first, league before cups. */
  current: CurrentComp[];
  /** The domestic league (or the best stand-in) that frames the season. */
  main: CurrentComp | null;
  /** API season used for the team's fixtures / players / statistics. */
  season: number | null;
  /** Plan A4 threshold for the main page: plays a covered competition now. */
  playsCovered: boolean;
}

const DAY = 86_400_000;

// "Friendlies Clubs" comes back flagged as a current competition for every
// club; it is not a competition anyone follows a team through.
const IGNORED_LEAGUES = new Set([667, 10]);

const REGISTRY_ORDER = new Map(COMPETITIONS.map((c, i) => [c.id, i]));

/** Wall clock, isolated so render functions stay pure for the linter. */
export function nowMs(): number {
  return Date.now();
}

function currentComps(history: LeagueInfo[], now: number): CurrentComp[] {
  const out: CurrentComp[] = [];
  for (const l of history) {
    if (isFriendly(l.league)) continue;
    const s = l.seasons.find((x) => x.current);
    if (!s) continue;
    // A discontinued cup keeps its last edition flagged as current forever
    // (Copa MX 2019). Anything that ended more than half a year ago is not
    // "this season".
    const end = Date.parse(s.end);
    if (Number.isFinite(end) && end < now - 180 * DAY) continue;
    out.push({
      id: l.league.id,
      name: l.league.name,
      logo: l.league.logo,
      type: l.league.type,
      country: l.country.name,
      year: s.year,
      start: s.start,
      end: s.end,
      competition: competitionById(l.league.id),
    });
  }
  const rank = (c: CurrentComp) =>
    (c.competition ? 0 : 1000) + (c.type === 'League' ? 0 : 100) + (REGISTRY_ORDER.get(c.id) ?? 99);
  return out.sort((a, b) => rank(a) - rank(b));
}

/** Resolve the team behind a `{slug}-{id}` param. null → 404. Throws when the
 *  API fails, so ISR keeps serving the last good render. */
export async function loadTeam(slugParam: string, locale: RouteLocale = 'en'): Promise<TeamCore | null> {
  const id = idFromSlug(slugParam);
  if (!id) return null;
  const info = await getTeam(id, { strict: true });
  if (!info) return null;

  // One call answers both "what does it play this season" and "which seasons
  // has it played": the team-filtered /leagues lists only the seasons this
  // team took part in. Strict, because it decides whether the page indexes.
  const history = await apiFootballGet<LeagueInfo>('/leagues', { team: id }, { revalidate: TTL.daily, strict: true });
  const current = currentComps(history, nowMs());
  const main =
    current.find((c) => c.type === 'League' && c.competition) ??
    current.find((c) => c.type === 'League') ??
    current[0] ??
    null;
  return {
    info: localizeDeep(info, locale),
    locale,
    history,
    current,
    main,
    season: main?.year ?? null,
    playsCovered: current.some((c) => isCovered(c.id)),
  };
}

export function teamRef(core: TeamCore): { id: number; name: string } {
  return { id: core.info.team.id, name: core.info.team.name };
}

/** The canonical `{slug}-{id}` for this team. */
export function canonicalSlug(core: TeamCore): string {
  return teamSlugId(teamRef(core));
}

// ---- Coach ----------------------------------------------------------------

/** Current coach. `/coachs?team=` returns every coach the club ever had; the
 *  current one is the open-ended spell at this club that started last (the
 *  provider leaves some old spells open, so "first open spell" is wrong). */
export async function loadCoach(teamId: number): Promise<{ coach: Coach; since: string | null } | null> {
  const rows = await apiFootballGet<Coach>('/coachs', { team: teamId }, { revalidate: TTL.daily });
  let best: { coach: Coach; since: string | null } | null = null;
  for (const c of rows) {
    for (const k of c.career ?? []) {
      if (k.team?.id !== teamId || k.end) continue;
      if (!best || (k.start ?? '') > (best.since ?? '')) best = { coach: c, since: k.start };
    }
  }
  return best;
}

// ---- Fixtures -------------------------------------------------------------

export function sortFixtures(rows: Fixture[]): Fixture[] {
  return [...rows].sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
}

/** Every fixture of the team's season, all competitions. Same request as
 *  getTeamSeasonFixtures (shared cache entry); `strict` for the calendar. */
export async function loadSeasonFixtures(teamId: number, season: number, strict = false): Promise<Fixture[]> {
  const rows = await apiFootballGet<Fixture>('/fixtures', { team: teamId, season }, { revalidate: TTL.standings, strict });
  return sortFixtures(rows);
}

const FINISHED = new Set(['FT', 'AET', 'PEN']);
const UPCOMING = new Set(['NS', 'TBD']);

export function isFinished(f: Fixture): boolean {
  return FINISHED.has(f.fixture.status.short);
}

export function isUpcoming(f: Fixture): boolean {
  return UPCOMING.has(f.fixture.status.short);
}

export type Outcome = 'W' | 'D' | 'L';

/** Result from the team's point of view. Penalty shoot-outs count as the
 *  provider's `winner` says (the goals are level). */
export function outcomeFor(f: Fixture, teamId: number): Outcome | null {
  if (!isFinished(f)) return null;
  const home = f.teams.home.id === teamId;
  const side = home ? f.teams.home : f.teams.away;
  if (side.winner === true) return 'W';
  if (side.winner === false) return 'L';
  const gh = f.goals.home ?? 0;
  const ga = f.goals.away ?? 0;
  if (gh === ga) return 'D';
  return (gh > ga) === home ? 'W' : 'L';
}

export function opponentOf(f: Fixture, teamId: number) {
  return f.teams.home.id === teamId ? f.teams.away : f.teams.home;
}

/** Run of identical-kind results counted back from the latest match. */
export function currentRun(results: Outcome[], pred: (o: Outcome) => boolean): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0 && pred(results[i]); i--) n++;
  return n;
}

// ---- Season labels & competition links ------------------------------------

const FRIENDLIES: Record<RouteLocale, string> = { es: 'Amistosos de clubes', pt: 'Amistosos de clubes', en: 'Club friendlies' };

export function isFriendly(league: { id: number; name: string }): boolean {
  return IGNORED_LEAGUES.has(league.id) || /friendl/i.test(league.name);
}

/** The name we print for a fixture's competition: the registry's localized
 *  name for covered ones (the provider calls the Brasileirão "Serie A" and
 *  the Concacaf Champions Cup by its old name), the provider's otherwise. */
export function leagueLabel(league: { id: number; name: string }, locale: RouteLocale): string {
  const c = competitionById(league.id);
  if (c) return competitionName(c, locale);
  if (isFriendly(league)) return FRIENDLIES[locale];
  return league.name;
}

/** "2026" for single/split seasons, "2026/27" across two years. Outside the
 *  registry the format is unknown, so the season's own dates decide (the
 *  J1 League's 2026/27 season is API season 2027, not "2027"). */
export function seasonYearLabel(comp: Competition | null, year: number, range?: { start: string; end: string }): string {
  if (comp) return comp.format === 'cross' ? `${year}/${String(year + 1).slice(2)}` : String(year);
  const a = Number(range?.start.slice(0, 4));
  const b = Number(range?.end.slice(0, 4));
  if (Number.isInteger(a) && Number.isInteger(b) && b === a + 1) return `${a}/${String(b).slice(2)}`;
  return String(year);
}

/** Season label of the team's main competition ("2026", "2026/27"). */
export function mainSeasonLabel(core: TeamCore): string {
  const m = core.main;
  return m ? seasonYearLabel(m.competition, m.year, m) : '';
}

/** The tournament a split league is in right now, read from the round names
 *  of the team's league fixtures ("Apertura - 12"): the upcoming one if any,
 *  else the last played. */
export function currentPhase(fixtures: Fixture[], leagueId: number, now: number): Phase | null {
  const league = fixtures.filter((f) => f.league.id === leagueId);
  const next = league.find((f) => Date.parse(f.fixture.date) >= now);
  const ref = next ?? league.at(-1);
  return ref ? parseRound(ref.league.round).phase : null;
}

/** Season slug of a covered competition for linking to its season hub. */
export function compSeasonSlug(comp: Competition, year: number, phase: Phase | null): string {
  return seasonSlug(comp, { apiSeason: year, phase: comp.format === 'split' ? phase : null });
}

// ---- Standings ------------------------------------------------------------

export function findStanding(groups: StandingsGroup[], teamId: number): { group: StandingsGroup; row: StandingRow } | null {
  for (const g of groups) {
    const row = g.rows.find((r) => r.team.id === teamId);
    if (row) return { group: g, row };
  }
  return null;
}

// ---- Players --------------------------------------------------------------

export interface SeasonLine {
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  /** Shirt number / position as the provider reports them in the stats. */
  number: number | null;
  position: string | null;
}

/** A player's season with THIS team: sums every competition row whose team
 *  is this club (a mid-season transfer also carries rows of the old club),
 *  optionally narrowed to one league. */
export function seasonLine(p: PlayerWithStats, teamId: number, leagueId?: number): SeasonLine {
  const rows: PlayerSeasonStats[] = p.statistics.filter(
    (s) => s.team?.id === teamId && (leagueId == null || s.league?.id === leagueId),
  );
  const n = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const line: SeasonLine = { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, number: null, position: null };
  for (const s of rows) {
    line.apps += n(s.games?.appearences);
    line.starts += n(s.games?.lineups);
    line.minutes += n(s.games?.minutes);
    line.goals += n(s.goals?.total);
    line.assists += n(s.goals?.assists);
    line.yellow += n(s.cards?.yellow) + n(s.cards?.yellowred);
    line.red += n(s.cards?.red);
    line.number ??= s.games?.number ?? null;
    line.position ??= s.games?.position ?? null;
  }
  return line;
}

export interface Leader {
  id: number;
  name: string;
  photo: string;
  value: number;
  apps: number;
}

/** Top N of the squad by a season-line metric, ties broken by fewer games. */
export function leaders(
  players: PlayerWithStats[],
  teamId: number,
  metric: (l: SeasonLine) => number,
  limit = 5,
  leagueId?: number,
): Leader[] {
  return players
    .map((p) => {
      const line = seasonLine(p, teamId, leagueId);
      return { id: p.player.id, name: p.player.name, photo: p.player.photo, value: metric(line), apps: line.apps };
    })
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value || a.apps - b.apps || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Current squad (same request as getSquad). */
export async function loadSquad(teamId: number, strict = false): Promise<SquadPlayer[]> {
  const rows = await apiFootballGet<{ players: SquadPlayer[] }>('/players/squads', { team: teamId }, { revalidate: TTL.hours, strict });
  return rows[0]?.players ?? [];
}

export const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'] as const;
export type Position = (typeof POSITIONS)[number];

export function groupByPosition<T extends { position: string | null }>(rows: T[]): { position: Position | null; rows: T[] }[] {
  const groups: { position: Position | null; rows: T[] }[] = POSITIONS.map((p) => ({ position: p, rows: [] as T[] }));
  const other: T[] = [];
  for (const r of rows) {
    const g = groups.find((x) => x.position === r.position);
    if (g) g.rows.push(r);
    else other.push(r);
  }
  if (other.length) groups.push({ position: null, rows: other });
  return groups.filter((g) => g.rows.length > 0);
}

// ---- Transfers ------------------------------------------------------------

export interface TeamTransfer {
  playerId: number;
  playerName: string;
  date: string;
  type: string | null;
  direction: 'in' | 'out';
  other: { id: number; name: string; logo: string };
}

/** The team's moves in the last `days`. The provider lists the same move
 *  several times (a day apart, under two spellings of the other club) and
 *  sometimes a club "transferring" to itself; one row per player and
 *  direction survives, the latest. */
export function recentTransfers(rows: PlayerTransfers[], teamId: number, now: number, days = 365): TeamTransfer[] {
  const since = now - days * DAY;
  const seen = new Map<string, TeamTransfer>();
  for (const p of rows) {
    for (const t of p.transfers ?? []) {
      const tIn = t.teams?.in;
      const tOut = t.teams?.out;
      if (!tIn || !tOut || tIn.id === tOut.id) continue;
      const direction = tIn.id === teamId ? 'in' : tOut.id === teamId ? 'out' : null;
      if (!direction) continue;
      const when = Date.parse(t.date);
      if (!Number.isFinite(when) || when < since || when > now + 90 * DAY) continue;
      const key = `${p.player.id}:${direction}`;
      const prev = seen.get(key);
      if (prev && prev.date >= t.date) continue;
      const other = direction === 'in' ? tOut : tIn;
      seen.set(key, {
        playerId: p.player.id,
        playerName: p.player.name,
        date: t.date,
        type: t.type && t.type !== '-' && t.type !== 'N/A' ? t.type : null,
        direction,
        other: { id: other.id, name: other.name, logo: other.logo },
      });
    }
  }
  // A loan return is often filed twice, once in each direction, a few days
  // apart (Toluca → Mazatlán "return from loan", then Mazatlán → Toluca).
  // When the same player moves both ways within a month, only the later
  // move describes where he ended up.
  const byPlayer = new Map<number, TeamTransfer[]>();
  for (const t of seen.values()) byPlayer.set(t.playerId, [...(byPlayer.get(t.playerId) ?? []), t]);
  const out: TeamTransfer[] = [];
  for (const list of byPlayer.values()) {
    if (list.length === 2 && Math.abs(Date.parse(list[0].date) - Date.parse(list[1].date)) <= 31 * DAY) {
      out.push(list[0].date >= list[1].date ? list[0] : list[1]);
    } else {
      out.push(...list);
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadTransfers(teamId: number): Promise<PlayerTransfers[]> {
  return apiFootballGet<PlayerTransfers>('/transfers', { team: teamId }, { revalidate: TTL.daily });
}

// ---- Team statistics (/teams/statistics) -----------------------------------

type Split = { home: number | null; away: number | null; total: number | null };
type MinuteBuckets = Record<string, { total: number | null; percentage: string | null }>;

export interface TeamSeasonStats {
  league: { id: number; name: string; season: number; logo: string };
  form: string | null;
  fixtures: { played: Split; wins: Split; draws: Split; loses: Split };
  goals: {
    for: { total: Split; average: { home: string | null; away: string | null; total: string | null }; minute?: MinuteBuckets };
    against: { total: Split; average: { home: string | null; away: string | null; total: string | null }; minute?: MinuteBuckets };
  };
  biggest: {
    streak: { wins: number | null; draws: number | null; loses: number | null };
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
    goals: { for: { home: number | null; away: number | null }; against: { home: number | null; away: number | null } };
  };
  clean_sheet: Split;
  failed_to_score: Split;
  penalty: { scored: { total: number | null; percentage: string | null }; missed: { total: number | null; percentage: string | null }; total: number | null };
  lineups: { formation: string; played: number }[];
  cards: { yellow: MinuteBuckets; red: MinuteBuckets };
}

/** Season statistics of the team in one competition. `strict` on the stats
 *  page (its primary data). Returns null when the provider has none. */
export async function loadTeamStats(
  teamId: number,
  leagueId: number,
  season: number,
  strict = false,
): Promise<TeamSeasonStats | null> {
  const rows = await apiFootballGet<TeamSeasonStats>(
    '/teams/statistics',
    { team: teamId, league: leagueId, season },
    { revalidate: TTL.hours, strict },
  );
  const s = rows[0];
  if (!s || !s.fixtures?.played) return null;
  return s;
}

export function mostUsedFormation(s: TeamSeasonStats | null): { formation: string; played: number } | null {
  const l = s?.lineups?.filter((x) => x.formation && x.played > 0) ?? [];
  if (!l.length) return null;
  return [...l].sort((a, b) => b.played - a.played)[0];
}

// ---- Local-time zone for copy ---------------------------------------------

/** A fixed zone for sentences that need a written time (FAQ answers): the
 *  team's own country when it is one of our markets, else UTC. The visible
 *  kickoff rows cover every market separately. */
const COUNTRY_ZONE: Record<string, { zone: string; label: Record<RouteLocale, string> }> = {
  Mexico: { zone: 'America/Mexico_City', label: { es: 'hora del centro de México', pt: 'horário da Cidade do México', en: 'Mexico City time' } },
  Brazil: { zone: 'America/Sao_Paulo', label: { es: 'hora de Brasilia', pt: 'horário de Brasília', en: 'Brasília time' } },
  Argentina: { zone: 'America/Argentina/Buenos_Aires', label: { es: 'hora de Argentina', pt: 'horário da Argentina', en: 'Argentina time' } },
  Colombia: { zone: 'America/Bogota', label: { es: 'hora de Colombia', pt: 'horário da Colômbia', en: 'Colombia time' } },
  Chile: { zone: 'America/Santiago', label: { es: 'hora de Chile', pt: 'horário do Chile', en: 'Chile time' } },
  Peru: { zone: 'America/Lima', label: { es: 'hora de Perú', pt: 'horário do Peru', en: 'Peru time' } },
  Ecuador: { zone: 'America/Guayaquil', label: { es: 'hora de Ecuador', pt: 'horário do Equador', en: 'Ecuador time' } },
  USA: { zone: 'America/New_York', label: { es: 'hora del Este de EE. UU.', pt: 'horário da costa leste dos EUA', en: 'US Eastern time' } },
  Spain: { zone: 'Europe/Madrid', label: { es: 'hora de España', pt: 'horário da Espanha', en: 'Spain time' } },
  England: { zone: 'Europe/London', label: { es: 'hora de Londres', pt: 'horário de Londres', en: 'UK time' } },
  Italy: { zone: 'Europe/Rome', label: { es: 'hora de Italia', pt: 'horário da Itália', en: 'Italy time' } },
  Germany: { zone: 'Europe/Berlin', label: { es: 'hora de Alemania', pt: 'horário da Alemanha', en: 'Germany time' } },
  France: { zone: 'Europe/Paris', label: { es: 'hora de Francia', pt: 'horário da França', en: 'France time' } },
  Portugal: { zone: 'Europe/Lisbon', label: { es: 'hora de Portugal', pt: 'horário de Portugal', en: 'Portugal time' } },
};

// API-Football names countries in English. For es/pt copy we translate the
// ones our audience actually meets through the region names the runtime
// already ships (Intl.DisplayNames); anything unmapped stays as provided.
const COUNTRY_ISO: Record<string, string> = {
  Mexico: 'MX', Brazil: 'BR', Argentina: 'AR', Colombia: 'CO', Chile: 'CL', Peru: 'PE', Ecuador: 'EC',
  Uruguay: 'UY', Paraguay: 'PY', Bolivia: 'BO', Venezuela: 'VE', USA: 'US', Canada: 'CA', 'Costa-Rica': 'CR',
  Spain: 'ES', England: 'GB-ENG', Italy: 'IT', Germany: 'DE', France: 'FR', Portugal: 'PT', Netherlands: 'NL',
  'Saudi-Arabia': 'SA', Belgium: 'BE', Scotland: 'GB-SCT', Turkey: 'TR', Greece: 'GR',
};

const ENGLAND: Record<RouteLocale, string> = { es: 'Inglaterra', pt: 'Inglaterra', en: 'England' };
const SCOTLAND: Record<RouteLocale, string> = { es: 'Escocia', pt: 'Escócia', en: 'Scotland' };

export function countryName(apiName: string, locale: RouteLocale): string {
  const iso = COUNTRY_ISO[apiName];
  if (!iso) return apiName.replace(/-/g, ' ');
  if (iso === 'GB-ENG') return ENGLAND[locale];
  if (iso === 'GB-SCT') return SCOTLAND[locale];
  try {
    return new Intl.DisplayNames([locale === 'pt' ? 'pt-BR' : locale === 'en' ? 'en-US' : 'es-MX'], { type: 'region' }).of(iso) ?? apiName;
  } catch {
    return apiName;
  }
}

export function zoneForCountry(country: string, locale: RouteLocale): { zone: string; label: string } {
  const z = COUNTRY_ZONE[country];
  return z ? { zone: z.zone, label: z.label[locale] } : { zone: 'UTC', label: 'UTC' };
}
