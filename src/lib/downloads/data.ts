// Data behind every download. The page and the generated file call the same
// loader, so the HTML table a crawler reads and the PDF a fan prints can never
// disagree.
//
// Quota (shared with the app): a league season is ONE fixtures call (plus the
// cached league info and one standings call where a table is printed). Rounds,
// calendars and brackets are all cut from that list instead of asking the API
// per round or per team. Primary entities load with `strict`: an API failure
// throws (ISR keeps the last good copy), a genuinely missing entity is null.

import { cache } from 'react';
import {
  TTL,
  apiFootballGet,
  currentSeason,
  fixturePhase,
  getCurrentRound,
  getLeagueInfoCached,
  getSeasonFixtures,
  getStandings,
  type Fixture,
  type LeagueInfo,
  type StandingsGroup,
} from '@/lib/api-football';
import {
  competitionById,
  parseRound,
  parseSeasonSlug,
  seasonSlug as buildSeasonSlug,
  type Competition,
  type Phase,
  type SeasonRef,
} from '@/lib/competitions';
import { supabase } from '@/lib/supabase-server';
import { hasPlayIn, knockoutStagesIn, projectedBracket, realBracket, type Bracket } from './bracket';

// ---- League season -------------------------------------------------------

export interface LeagueSeason {
  competition: Competition;
  info: LeagueInfo;
  ref: SeasonRef;
  seasonSlug: string;
  /** Every fixture of the API season (both tournaments of a split league). */
  fixtures: Fixture[];
  /** Fixtures of this tournament only. */
  phaseFixtures: Fixture[];
  /** Numbered rounds (jornada/fecha/rodada) of this tournament. */
  rounds: Map<number, Fixture[]>;
  /** Numbered round being played now; null in a knockout stage or between seasons. */
  currentRound: number | null;
  nextRound: number | null;
}

function phaseOf(f: Fixture): Phase | null {
  return parseRound(f.league.round).phase;
}

function pending(f: Fixture): boolean {
  const p = fixturePhase(f);
  return p === 'scheduled' || p === 'live';
}

function numberedRounds(fixtures: Fixture[]): Map<number, Fixture[]> {
  const out = new Map<number, Fixture[]>();
  for (const f of fixtures) {
    const n = parseRound(f.league.round).number;
    if (n == null) continue;
    const list = out.get(n) ?? [];
    list.push(f);
    out.set(n, list);
  }
  for (const list of out.values()) list.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  return new Map([...out.entries()].sort((a, b) => a[0] - b[0]));
}

/** Round being played: the provider's answer when it has one, otherwise the
 *  first round where most matches are still to be played. */
function pickCurrentRound(rounds: Map<number, Fixture[]>, hint: string | null, phase: Phase | null): number | null {
  if (hint) {
    const r = parseRound(hint);
    if (r.number != null && r.phase === phase && rounds.has(r.number)) return r.number;
    if (r.number == null && r.phase === phase) return null; // knockout stage
  }
  for (const [n, list] of rounds) {
    const open = list.filter(pending).length;
    if (open > 0 && open * 2 >= list.length) return n;
  }
  return null;
}

function seasonFrom(c: Competition, info: LeagueInfo, apiSeason: number, fixtures: Fixture[], hint: string | null, phaseWanted?: Phase | null): LeagueSeason {
  let phase: Phase | null = null;
  if (c.format === 'split') {
    if (phaseWanted !== undefined) phase = phaseWanted;
    else {
      phase = hint ? parseRound(hint).phase : null;
      if (!phase) phase = phaseOf(fixtures.find(pending) ?? fixtures[fixtures.length - 1]);
    }
  }
  const phaseFixtures = phase ? fixtures.filter((f) => phaseOf(f) === phase) : fixtures;
  const rounds = numberedRounds(phaseFixtures);
  const currentRound = pickCurrentRound(rounds, hint, phase);
  const nextRound = currentRound != null && rounds.has(currentRound + 1) ? currentRound + 1 : null;
  const ref: SeasonRef = { apiSeason, phase };
  return {
    competition: c,
    info,
    ref,
    seasonSlug: buildSeasonSlug(c, ref),
    fixtures,
    phaseFixtures,
    rounds,
    currentRound,
    nextRound,
  };
}

/** The tournament a league is playing now. Null when the league is not
 *  covered or the provider has no season/fixtures for it. */
export const loadCurrentSeason = cache(async (leagueId: number): Promise<LeagueSeason | null> => {
  const c = competitionById(leagueId);
  if (!c) return null;
  const info = await getLeagueInfoCached(leagueId, { strict: true });
  if (!info) return null;
  const apiSeason = currentSeason(info);
  if (apiSeason == null) return null;
  const [fixtures, hint] = await Promise.all([
    getSeasonFixtures(leagueId, apiSeason, { strict: true }),
    // Hint only (not strict): without it the round is computed from fixtures.
    getCurrentRound(leagueId, apiSeason),
  ]);
  if (fixtures.length === 0) return null;
  return seasonFrom(c, info, apiSeason, fixtures, hint);
});

export type SeasonLookup =
  | { status: 'ok'; season: LeagueSeason }
  | { status: 'redirect'; seasonSlug: string }
  | { status: 'missing' };

/** A season named by its public slug. A split league's bare year resolves to
 *  the tournament being played (or the last one) via a redirect. */
export const loadSeasonBySlug = cache(async (leagueId: number, slug: string): Promise<SeasonLookup> => {
  const c = competitionById(leagueId);
  if (!c) return { status: 'missing' };
  const ref = parseSeasonSlug(c, slug);
  if (!ref) return { status: 'missing' };
  const current = await loadCurrentSeason(leagueId);
  if (!current) return { status: 'missing' };

  if (c.format === 'split' && ref.phase === null) {
    if (ref.apiSeason !== current.ref.apiSeason) return { status: 'missing' };
    return { status: 'redirect', seasonSlug: current.seasonSlug };
  }
  if (ref.apiSeason === current.ref.apiSeason) {
    if (ref.phase === current.ref.phase) return { status: 'ok', season: current };
    const other = seasonFrom(c, current.info, ref.apiSeason, current.fixtures, null, ref.phase);
    return other.phaseFixtures.length ? { status: 'ok', season: other } : { status: 'missing' };
  }
  // Another API season (archive): one more fixtures call, long TTL.
  const fixtures = await getSeasonFixtures(leagueId, ref.apiSeason, { strict: true, revalidate: TTL.daily });
  if (fixtures.length === 0) return { status: 'missing' };
  const s = seasonFrom(c, current.info, ref.apiSeason, fixtures, null, ref.phase);
  return s.phaseFixtures.length ? { status: 'ok', season: s } : { status: 'missing' };
});

/** Standings groups of a tournament (a split league reports both tournaments
 *  of the API season; only the matching one is kept). */
export const loadTable = cache(async (season: LeagueSeason): Promise<StandingsGroup[]> => {
  const groups = await getStandings(season.competition.id, season.ref.apiSeason, { strict: true });
  const phase = season.ref.phase;
  if (!phase) return groups;
  const tagged = groups.filter((g) => /apertura|clausura/i.test(g.name));
  if (tagged.length === 0) return groups;
  return tagged.filter((g) => new RegExp(phase, 'i').test(g.name));
});

// ---- Quiniela ----------------------------------------------------------------

export interface QuinielaData {
  season: LeagueSeason;
  round: number;
  fixtures: Fixture[];
  /** API round string ("Apertura - 12"). */
  roundName: string;
  isCurrent: boolean;
  isNext: boolean;
}

export const loadQuiniela = cache(async (leagueId: number, round: number): Promise<QuinielaData | null> => {
  const season = await loadCurrentSeason(leagueId);
  if (!season) return null;
  const fixtures = season.rounds.get(round);
  if (!fixtures?.length) return null;
  return {
    season,
    round,
    fixtures,
    roundName: fixtures[0].league.round,
    isCurrent: season.currentRound === round,
    isNext: season.nextRound === round,
  };
});

// ---- Team calendar -------------------------------------------------------------

export interface CalendarData {
  team: { id: number; name: string; logo: string };
  competition: Competition;
  ref: SeasonRef;
  seasonSlug: string;
  fixtures: Fixture[];
}

export type CalendarLookup =
  | { status: 'ok'; data: CalendarData }
  | { status: 'redirect'; seasonSlug: string; teamName: string }
  | { status: 'missing' };

interface TeamLeagueRow {
  league: { id: number; type: string };
}

export const loadCalendar = cache(async (teamId: number, slug: string): Promise<CalendarLookup> => {
  // Which covered domestic league the team plays decides how the season slug
  // reads (Apertura/Clausura, 2026, 2026-2027).
  const leagues = await apiFootballGet<TeamLeagueRow>('/leagues', { team: teamId, current: 'true' }, { revalidate: TTL.daily, strict: true });
  const domestic = leagues
    .map((l) => competitionById(l.league.id))
    .filter((c): c is Competition => !!c && c.kind === 'league')[0];
  if (!domestic) return { status: 'missing' };

  const ref = parseSeasonSlug(domestic, slug);
  if (!ref) return { status: 'missing' };

  const all = await apiFootballGet<Fixture>('/fixtures', { team: teamId, season: ref.apiSeason }, { revalidate: TTL.standings, strict: true });
  all.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  const me = all.flatMap((f) => [f.teams.home, f.teams.away]).find((t) => t.id === teamId);
  if (!me) return { status: 'missing' };

  if (domestic.format === 'split' && ref.phase === null) {
    // Bare year on a split league: send to the tournament being played.
    const league = all.filter((f) => f.league.id === domestic.id);
    const anchor = league.find(pending) ?? league[league.length - 1];
    const phase = anchor ? parseRound(anchor.league.round).phase : null;
    if (!phase) return { status: 'missing' };
    return { status: 'redirect', seasonSlug: buildSeasonSlug(domestic, { apiSeason: ref.apiSeason, phase }), teamName: me.name };
  }

  let fixtures = all;
  if (domestic.format === 'split' && ref.phase) {
    // League matches of this tournament, plus every other competition the
    // team plays inside the tournament's dates (cups, continental).
    const league = all.filter((f) => f.league.id === domestic.id && parseRound(f.league.round).phase === ref.phase);
    if (league.length === 0) return { status: 'missing' };
    const from = league[0].fixture.date;
    const to = league[league.length - 1].fixture.date;
    const ids = new Set(league.map((f) => f.fixture.id));
    fixtures = all.filter(
      (f) => ids.has(f.fixture.id) || (f.league.id !== domestic.id && f.fixture.date >= from && f.fixture.date <= to),
    );
  }
  if (fixtures.length === 0) return { status: 'missing' };
  return {
    status: 'ok',
    data: {
      team: { id: me.id, name: me.name, logo: me.logo },
      competition: domestic,
      ref,
      seasonSlug: buildSeasonSlug(domestic, ref),
      fixtures,
    },
  };
});

// ---- Bracket -------------------------------------------------------------------

export interface BracketData {
  season: LeagueSeason;
  bracket: Bracket | null;
}

export const loadBracket = cache(async (season: LeagueSeason): Promise<BracketData> => {
  const real = realBracket(season.fixtures, season.ref.phase);
  if (real) return { season, bracket: real };

  // Projection: only for a league tournament that is being played now, with a
  // single table, and whose knockout size we can read from its last
  // completed knockout stage.
  const c = season.competition;
  const current = await loadCurrentSeason(c.id);
  const isCurrent = current && current.ref.apiSeason === season.ref.apiSeason && current.ref.phase === season.ref.phase;
  if (c.kind !== 'league' || !isCurrent) return { season, bracket: null };

  let model: Fixture[] = [];
  let modelPhase: Phase | null = null;
  if (c.format === 'split' && season.ref.phase) {
    const other: Phase = season.ref.phase === 'apertura' ? 'clausura' : 'apertura';
    if (knockoutStagesIn(season.fixtures, other).length) {
      model = season.fixtures;
      modelPhase = other;
    }
  }
  if (!model.length) {
    const prev = await getSeasonFixtures(c.id, season.ref.apiSeason - 1, { strict: true, revalidate: TTL.daily });
    if (c.format === 'split') {
      // Same-named tournament first (Apertura ↔ Apertura), then the other.
      for (const ph of [season.ref.phase, season.ref.phase === 'apertura' ? 'clausura' : 'apertura'] as Phase[]) {
        if (knockoutStagesIn(prev, ph).length) {
          model = prev;
          modelPhase = ph;
          break;
        }
      }
    } else if (knockoutStagesIn(prev, null).length) model = prev;
  }
  const stages = model.length ? knockoutStagesIn(model, modelPhase) : [];
  if (!stages.length) return { season, bracket: null };

  const groups = await loadTable(season);
  if (groups.length !== 1) return { season, bracket: null };
  return {
    season,
    bracket: projectedBracket(groups[0].rows, stages[0], hasPlayIn(model, modelPhase)),
  };
});

// ---- Album checklist -------------------------------------------------------------

export interface Sticker {
  sticker_id: string;
  country: string;
  number: number;
  name: string;
  type: string;
}

/** The album catalogue the app uses (public, read-only). Two pages of 1000
 *  because PostgREST caps a response at 1000 rows. */
export const loadStickers = cache(async (): Promise<Sticker[]> => {
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL missing');
  const out: Sticker[] = [];
  for (let from = 0; from < 5000; from += 1000) {
    const { data, error } = await supabase
      .from('sticker_catalog')
      .select('sticker_id,country,number,name,type')
      .eq('album_id', 'fifa-wc-2026')
      .order('sticker_id')
      .range(from, from + 999);
    if (error) throw new Error(`sticker_catalog: ${error.message}`);
    const rows = (data ?? []) as Sticker[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
});
