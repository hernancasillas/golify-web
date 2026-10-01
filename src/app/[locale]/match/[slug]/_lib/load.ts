// Everything the match page needs, loaded once per request.
//
// Wrapped in React `cache` so generateMetadata and the page share one load:
// the robots meta depends on which data blocks exist (plan A4 threshold), so
// metadata has to see exactly the data the page renders.
//
// Quota budget (API-Football is shared with the app): at most 8 calls per
// render, all cached — the fixture itself (events, lineups, stats and player
// ratings come in that one response), standings, head-to-head, the day's
// fixtures (in the reader's zone), the league's next fixtures, and before kickoff the two teams'
// last five plus the injury list. Nothing fans out per player or per match.

import { cache } from 'react';
import { localizeDeep } from '@/lib/nations';
import type { RouteLocale } from '@/lib/routes';
import {
  TTL,
  apiFootballGet,
  fixturePhase,
  getFixtureDetail,
  getFixturesByDate,
  getStandings,
  FINISHED_STATUSES,
  type Fixture,
  type FixtureDetail,
  type Injury,
  type StandingsGroup,
} from '@/lib/api-football';
import { COVERED_IDS, competitionById, isCovered, parseRound, type Competition, type ParsedRound } from '@/lib/competitions';
import { getPickSplit, type PickSplit } from '@/lib/community';
import { broadcastsFor, type BroadcastEntry } from '@/data/broadcasters';
import { WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON } from '@/lib/site';
import { isoDateIn } from '@/lib/timezones';

export type Phase = ReturnType<typeof fixturePhase>;

export interface StandingsExcerpt {
  group: StandingsGroup;
  /** Row indexes to show, in order; `null` marks a gap ("…"). */
  rows: (number | null)[];
}

export interface MatchModel {
  f: FixtureDetail;
  phase: Phase;
  /** Before kickoff (or postponed/cancelled): the preview layout. */
  preview: boolean;
  competition: Competition | null;
  covered: boolean;
  isWorldCup: boolean;
  round: ParsedRound;
  standings: StandingsExcerpt | null;
  /** Finished meetings, newest first, this fixture excluded (max 5). */
  h2h: Fixture[];
  /** Finished fixtures, newest first (preview only). */
  formHome: Fixture[];
  formAway: Fixture[];
  injuries: Injury[];
  /** Kickoff date in the locale's main zone; "other matches" are that day's. */
  localDate: string;
  sameDay: Fixture[];
  nextInLeague: Fixture[];
  split: PickSplit | null;
  broadcasts: BroadcastEntry[];
  /** Which data blocks render — the indexing threshold counts them. */
  blocks: {
    standings: boolean;
    form: boolean;
    h2h: boolean;
    lineups: boolean;
    events: boolean;
    stats: boolean;
    community: boolean;
  };
  blockCount: number;
  indexable: boolean;
}

// ---- Strict variants of the named fetchers --------------------------------
// Same endpoints and parameter order as getHeadToHead / getTeamFixtures /
// getLeagueFixtures / getInjuries in api-football.ts, so they share the fetch
// cache entries with every other page, but with `strict`: a failed call
// throws instead of looking like "no data".

async function headToHeadStrict(a: number, b: number): Promise<Fixture[]> {
  const [x, y] = a < b ? [a, b] : [b, a];
  const rows = await apiFootballGet<Fixture>('/fixtures/headtohead', { h2h: `${x}-${y}`, last: 10 }, { revalidate: TTL.hours, strict: true });
  return rows.sort((p, q) => q.fixture.date.localeCompare(p.fixture.date));
}

async function teamLastStrict(team: number): Promise<Fixture[]> {
  const rows = await apiFootballGet<Fixture>('/fixtures', { team, last: 5 }, { revalidate: TTL.day, strict: true });
  return rows.sort((p, q) => q.fixture.date.localeCompare(p.fixture.date));
}

async function leagueNextStrict(league: number, season: number): Promise<Fixture[]> {
  return apiFootballGet<Fixture>('/fixtures', { league, season, next: 5 }, { revalidate: TTL.day, strict: true });
}

async function injuriesStrict(fixture: number): Promise<Injury[]> {
  return apiFootballGet<Injury>('/injuries', { fixture }, { revalidate: TTL.hours, strict: true });
}

type Soft<T> = { ok: true; value: T } | { ok: false; value: T };

async function soft<T>(fn: () => Promise<T>, fallback: T): Promise<Soft<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch {
    return { ok: false, value: fallback };
  }
}

const skip = <T,>(value: T): Promise<Soft<T>> => Promise.resolve({ ok: true, value });

// ---- Standings excerpt -------------------------------------------------------

function standingsExcerpt(groups: StandingsGroup[], f: Fixture, round: ParsedRound): StandingsExcerpt | null {
  const ids = [f.teams.home.id, f.teams.away.id];
  const withBoth = groups.filter((g) => ids.every((id) => g.rows.some((r) => r.team.id === id)));
  // A split league reports one group per tournament ("Liga MX: Apertura");
  // prefer the one this match belongs to.
  const byPhase = round.phase ? withBoth.find((g) => g.name.toLowerCase().includes(round.phase!)) : undefined;
  const group = byPhase ?? withBoth[0];
  if (!group) return null;

  const idx = ids.map((id) => group.rows.findIndex((r) => r.team.id === id));
  const n = group.rows.length;
  if (n <= 10) return { group, rows: group.rows.map((_, i) => i) };

  // Each team with its neighbours, merged; gaps become a "…" row.
  const keep = new Set<number>();
  for (const i of idx) for (let k = i - 1; k <= i + 1; k++) if (k >= 0 && k < n) keep.add(k);
  const sorted = [...keep].sort((a, b) => a - b);
  const rows: (number | null)[] = [];
  sorted.forEach((i, j) => {
    if (j > 0 && i - sorted[j - 1] > 1) rows.push(null);
    rows.push(i);
  });
  return { group, rows };
}

// ---- Loader --------------------------------------------------------------

const finished = (x: Fixture) => FINISHED_STATUSES.includes(x.fixture.status.short);

// `zone` is the locale's main time zone (CDMX / Brasília / ET): "other
// matches of the day" means that reader's calendar day, so the list and its
// heading agree (a 21:10 CDMX kickoff is already tomorrow in UTC).
const loadMatchRaw = cache(async (id: number, zone: string): Promise<MatchModel | null> => {
  // Primary entity: strict. A failed call throws (Next keeps the last good
  // copy of the page); a genuinely unknown id comes back null → 404.
  const f = await getFixtureDetail(id, { strict: true });
  if (!f) return null;

  const phase = fixturePhase(f);
  const preview = phase === 'scheduled' || phase === 'off';
  const leagueId = f.league.id;
  const season = f.league.season;
  const home = f.teams.home.id;
  const away = f.teams.away.id;
  const round = parseRound(f.league.round ?? '');
  const localDate = isoDateIn(new Date(f.fixture.date), zone);

  const [standingsR, h2hR, formHomeR, formAwayR, injuriesR, sameDayR, nextR, split] = await Promise.all([
    soft(() => getStandings(leagueId, season, { strict: true }), [] as StandingsGroup[]),
    soft(() => headToHeadStrict(home, away), [] as Fixture[]),
    preview ? soft(() => teamLastStrict(home), [] as Fixture[]) : skip([] as Fixture[]),
    preview ? soft(() => teamLastStrict(away), [] as Fixture[]) : skip([] as Fixture[]),
    preview ? soft(() => injuriesStrict(id), [] as Injury[]) : skip([] as Injury[]),
    soft(() => getFixturesByDate(localDate, COVERED_IDS, zone, { strict: true }), [] as Fixture[]),
    soft(() => leagueNextStrict(leagueId, season), [] as Fixture[]),
    getPickSplit(id),
  ]);

  const degraded = [standingsR, h2hR, formHomeR, formAwayR, injuriesR].some((r) => !r.ok);

  const standings = standingsExcerpt(standingsR.value, f, round);
  const h2h = h2hR.value.filter((x) => x.fixture.id !== id && finished(x)).slice(0, 5);
  const formHome = formHomeR.value.filter(finished).slice(0, 5);
  const formAway = formAwayR.value.filter(finished).slice(0, 5);
  const injuries = injuriesR.value.filter((i) => i.team.id === home || i.team.id === away);

  // Same league first: the reader of a Liga MX match most likely wants the
  // rest of that round, then the other leagues of the day.
  const sameDay = sameDayR.value
    .filter((x) => x.fixture.id !== id)
    .sort((a, b) => Number(b.league.id === leagueId) - Number(a.league.id === leagueId))
    .slice(0, 8);
  const nextInLeague = nextR.value.filter((x) => x.fixture.id !== id).slice(0, 5);

  const blocks = {
    standings: standings != null,
    form: preview && (formHome.length > 0 || formAway.length > 0),
    h2h: h2h.length > 0,
    lineups: f.lineups.some((l) => l.startXI.length > 0),
    events: f.events.length > 0,
    stats: f.statistics.some((s) => s.statistics.length > 0),
    community: split != null,
  };
  const blockCount = Object.values(blocks).filter(Boolean).length;

  const covered = isCovered(leagueId);
  const isWorldCup = leagueId === WORLD_CUP_LEAGUE_ID;
  // The 2026 World Cup archive was indexed before this template existed and
  // stays that way; everything else has to pass the plan A4 threshold.
  const indexable = (isWorldCup && season === WORLD_CUP_SEASON) || (covered && blockCount >= 2);

  // A secondary call failed and, without it, the page would drop below the
  // threshold and flip to noindex. That would be rendering a failure as if
  // the data were empty — throw instead, so ISR keeps the last good copy.
  if (degraded && covered && !indexable) {
    throw new Error(`match ${id}: secondary API-Football data unavailable`);
  }

  return {
    f,
    phase,
    preview,
    competition: competitionById(leagueId),
    covered,
    isWorldCup,
    round,
    standings,
    h2h,
    formHome,
    formAway,
    injuries,
    localDate,
    sameDay,
    nextInLeague,
    split,
    broadcasts: broadcastsFor(leagueId),
    blocks,
    blockCount,
    indexable,
  };
});

/** Match model with national-team names in the reader's language (display
 *  only; slugs map back to the provider's English names). */
export async function loadMatch(id: number, zone: string, locale: RouteLocale): Promise<MatchModel | null> {
  const m = await loadMatchRaw(id, zone);
  return m && locale !== 'en' ? localizeDeep(m, locale) : m;
}
