// Data layer for the competition pages (hub, season, sections, round).
// Server-only by convention: import from Server Components.
//
// Three things live here so every page answers them the same way:
//   1. Which season a URL means. `/liga-mx/apertura-2026` is API season 2026
//      filtered to the "Apertura - …" rounds; `/premier-league/2026-2027` is
//      API season 2026; `/liga-mx/2026` (a split league's bare year) is not a
//      page of its own but a redirect to the phase that season is playing.
//   2. Which standings belong to that season. For split leagues the provider
//      serves the phase being played; a past phase is rebuilt from its own
//      finished fixtures when (and only when) that can be done correctly.
//   3. Quota. A render reads one league info, one season fixture list and at
//      most a handful of lists. Everything else (rounds, current round, round
//      dates, streaks) is derived from the fixture list already in hand.

import { localizeFixtures, localizeGroups } from '@/lib/nations';
import { cache } from 'react';
import {
  apiFootballGet,
  fixturePhase,
  getLeagueInfo,
  getSeasonFixtures,
  TTL,
  type Fixture,
  type LeagueInfo,
  type PlayerWithStats,
  type StandingRow,
  type StandingsGroup,
} from '@/lib/api-football';
import {
  competitionById,
  competitionBySlug,
  parseRound,
  parseSeasonSlug,
  roundLabel,
  roundWord,
  seasonLabel,
  seasonSlug,
  type Competition,
  type Phase,
  type SeasonRef,
} from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';
import { idFromSlug, isBareId, slugify } from '@/lib/slug';
import { KICKOFF_ZONES, type ZoneRow } from '@/lib/timezones';

export type LeagueSeason = LeagueInfo['seasons'][number];

// ---- Competition param ---------------------------------------------------

export type CompetitionParam =
  | { kind: 'ok'; comp: Competition }
  /** Legacy `/es/league/262`: the page redirects to the hub. */
  | { kind: 'legacy'; comp: Competition }
  | { kind: 'none' };

export function resolveCompetitionParam(slug: string): CompetitionParam {
  if (isBareId(slug)) {
    const id = idFromSlug(slug);
    const comp = id ? competitionById(id) : null;
    return comp ? { kind: 'legacy', comp } : { kind: 'none' };
  }
  const comp = competitionBySlug(slug);
  return comp ? { kind: 'ok', comp } : { kind: 'none' };
}

// ---- Cached loaders (React cache dedupes metadata + page in one render) ---

/** The league row. Strict: a failed call throws (ISR keeps the last good
 *  copy); null means the provider really has no such league. */
export const loadLeague = cache(async (id: number): Promise<LeagueInfo | null> => {
  return getLeagueInfo(id, { strict: true });
});

export const loadSeasonFixtures = cache(
  async (id: number, season: number, revalidate: number): Promise<Fixture[]> => {
    return getSeasonFixtures(id, season, { strict: true, revalidate });
  },
);

/** Standings with a caller-chosen TTL (past seasons are cached for a day),
 *  flattened the same way getStandings does. */
export const loadStandings = cache(
  async (id: number, season: number, revalidate: number, strict: boolean): Promise<StandingsGroup[]> => {
    const rows = await apiFootballGet<{ league: { standings: StandingRow[][] } }>(
      '/standings',
      { league: id, season },
      { revalidate, strict },
    );
    const groups = rows[0]?.league?.standings ?? [];
    return groups.filter((g) => g.length > 0).map((g) => ({ name: g[0].group ?? '', rows: g }));
  },
);

export type TopKind = 'scorers' | 'assists' | 'cards';

const TOP_ENDPOINT: Record<TopKind, string> = {
  scorers: '/players/topscorers',
  assists: '/players/topassists',
  cards: '/players/topyellowcards',
};

export const loadTopList = cache(
  async (kind: TopKind, id: number, season: number, revalidate: number, strict: boolean): Promise<PlayerWithStats[]> => {
    return apiFootballGet<PlayerWithStats>(TOP_ENDPOINT[kind], { league: id, season }, { revalidate, strict });
  },
);

// ---- Rounds ----------------------------------------------------------------

export interface RoundGroup {
  /** Provider round string ("Apertura - 12"). */
  raw: string;
  number: number | null;
  stage: string;
  /** Anchor id on the calendar page. */
  anchor: string;
  fixtures: Fixture[];
  /** Earliest kickoff in the round (ISO). */
  first: string;
  last: string;
}

/** Fixtures grouped by round, rounds ordered by their first kickoff (the
 *  provider's round list is not in playing order: "Apertura - 9" can come
 *  after 16 when a matchday was rescheduled). */
export function groupRounds(fixtures: Fixture[]): RoundGroup[] {
  const map = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const k = f.league.round;
    const list = map.get(k);
    if (list) list.push(f);
    else map.set(k, [f]);
  }
  const out: RoundGroup[] = [];
  for (const [raw, list] of map) {
    list.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
    const r = parseRound(raw);
    // "Championship Group - 3" (LigaPro's second stage) parses as round 3
    // and would collide with "Regular Season - 3": only the main numbered
    // rounds get a round page; second-stage groups are stages.
    const number = SECOND_STAGE.test(r.stage) ? null : r.number;
    out.push({
      raw,
      number,
      stage: r.stage,
      anchor: number != null ? `r-${number}` : slugify(r.stage),
      fixtures: list,
      first: list[0].fixture.date,
      last: list[list.length - 1].fixture.date,
    });
  }
  // Numbered rounds keep their number order among themselves (a rescheduled
  // matchday should not jump the list); stages sit where they are played.
  return out.sort((a, b) => {
    if (a.number != null && b.number != null) return a.number - b.number;
    return a.first.localeCompare(b.first);
  });
}

const SECOND_STAGE = /^(Championship|Relegation|Placement) Group\s*-\s*\d+$/i;

const GROUP_STAGE_NAMES: Record<string, Record<RouteLocale, string>> = {
  championship: { es: 'Grupo campeonato', pt: 'Grupo do título', en: 'Championship group' },
  relegation: { es: 'Grupo por la permanencia', pt: 'Grupo do rebaixamento', en: 'Relegation group' },
  placement: { es: 'Grupo de ubicación', pt: 'Grupo de classificação', en: 'Placement group' },
};

/** Stage names the shared round labels do not translate yet (provider
 *  strings seen across the 21 covered competitions). */
function localStage(stage: string, locale: RouteLocale, comp: Competition): string | null {
  let m = /^(Championship|Relegation|Placement) Group\s*-\s*(\d+)$/i.exec(stage);
  if (m) return `${GROUP_STAGE_NAMES[m[1].toLowerCase()][locale]} · ${roundWord(comp, locale)} ${m[2]}`;
  m = /^Qualification Round (\d+)$/i.exec(stage) ?? /^(\d+)(?:st|nd|rd|th) Qualifying Round$/i.exec(stage);
  if (m) return locale === 'es' ? `Fase previa ${m[1]}` : locale === 'pt' ? `Fase preliminar ${m[1]}` : `Qualifying round ${m[1]}`;
  m = /^Round of (\d+)$/i.exec(stage);
  if (m && m[1] !== '16' && m[1] !== '32') {
    return locale === 'es' ? `Ronda de ${m[1]}` : locale === 'pt' ? `Fase de ${m[1]}` : `Round of ${m[1]}`;
  }
  m = /^1\/(\d+)-finals$/i.exec(stage);
  if (m) return locale === 'en' ? `1/${m[1]} finals` : `1/${m[1]} de final`;
  if (/^group stage$/i.test(stage)) return locale === 'en' ? 'Group stage' : 'Fase de grupos';
  if (/^third place$/i.test(stage)) return locale === 'es' ? 'Tercer lugar' : locale === 'pt' ? 'Terceiro lugar' : 'Third place';
  return null;
}

export function roundName(r: RoundGroup, locale: RouteLocale, comp: Competition): string {
  return localStage(r.stage, locale, comp) ?? roundLabel(r.raw, locale, comp);
}

function started(f: Fixture): boolean {
  const p = fixturePhase(f);
  return p === 'live' || p === 'finished';
}

export function isDone(f: Fixture): boolean {
  const p = fixturePhase(f);
  return p === 'finished' || p === 'off';
}

/** The round being played or next up: the first round (in order) that still
 *  has a match to play; past seasons fall back to their last round. */
export function currentRound(rounds: RoundGroup[], now: number = Date.now()): RoundGroup | null {
  if (rounds.length === 0) return null;
  const live = rounds.find((r) => r.fixtures.some((f) => fixturePhase(f) === 'live'));
  if (live) return live;
  // A single postponed match must not pin the "current" round weeks back:
  // a round with matches left counts only if it started in the last ten
  // days (or has not started). A half-played weekend still qualifies.
  const DAY = 86_400_000;
  const open = rounds
    .filter((r) => r.fixtures.some((f) => !isDone(f)) && Date.parse(r.first) > now - 10 * DAY)
    .sort((a, b) => a.first.localeCompare(b.first));
  return open[0] ?? rounds[rounds.length - 1];
}

// ---- Seasons ---------------------------------------------------------------

/** The phase a split league's API season is on: the phase of its latest
 *  started match; before kickoff, the phase of its first scheduled match. */
export function activePhase(fixtures: Fixture[]): Phase | null {
  for (let i = fixtures.length - 1; i >= 0; i--) {
    if (started(fixtures[i])) {
      const p = parseRound(fixtures[i].league.round).phase;
      if (p) return p;
    }
  }
  for (const f of fixtures) {
    const p = parseRound(f.league.round).phase;
    if (p) return p;
  }
  return null;
}

export interface SeasonCtx {
  /** Reader's locale: national-team names are translated for display. */
  locale: RouteLocale;
  comp: Competition;
  info: LeagueInfo;
  ref: SeasonRef;
  slug: string;
  meta: LeagueSeason;
  /** The provider's current season, and (split) the phase it is playing. */
  isCurrent: boolean;
  /** Fixtures of this season (split: this phase only), oldest first. */
  fixtures: Fixture[];
  /** Every fixture of the API season (split: both phases). */
  apiFixtures: Fixture[];
  rounds: RoundGroup[];
  /** Split league whose other phase in the same API season already has
   *  finished matches: the provider's top lists then mix both tournaments. */
  mixedTopLists: boolean;
  /** Fetch TTL for this season's data: live seasons move, past ones do not. */
  ttl: number;
}

export function seasonTtl(isCurrent: boolean): number {
  return isCurrent ? TTL.standings : TTL.daily;
}

export function currentApiSeason(info: LeagueInfo): LeagueSeason | null {
  return info.seasons.find((s) => s.current) ?? info.seasons.at(-1) ?? null;
}

function buildCtx(comp: Competition, info: LeagueInfo, meta: LeagueSeason, phase: Phase | null, rawFixtures: Fixture[], locale: RouteLocale): SeasonCtx {
  const apiFixtures = localizeFixtures(rawFixtures, locale);
  const ref: SeasonRef = { apiSeason: meta.year, phase };
  const fixtures = phase ? apiFixtures.filter((f) => parseRound(f.league.round).phase === phase) : apiFixtures;
  const other = phase === 'apertura' ? 'clausura' : phase === 'clausura' ? 'apertura' : null;
  const mixedTopLists =
    !!other && apiFixtures.some((f) => parseRound(f.league.round).phase === other && started(f));
  const current = currentApiSeason(info);
  const isCurrentApi = !!current && current.year === meta.year && current.current;
  const isCurrent = isCurrentApi && (!phase || activePhase(apiFixtures) === phase);
  return {
    locale,
    comp,
    info,
    ref,
    slug: seasonSlug(comp, ref),
    meta,
    isCurrent,
    fixtures,
    apiFixtures,
    rounds: groupRounds(fixtures),
    mixedTopLists,
    ttl: seasonTtl(isCurrentApi),
  };
}

/** The season the hub shows: the provider's current API season, and for a
 *  split league the phase it is playing. */
export async function loadCurrentSeason(comp: Competition, info: LeagueInfo, locale: RouteLocale = 'en'): Promise<SeasonCtx | null> {
  const meta = currentApiSeason(info);
  if (!meta) return null;
  const apiFixtures = await loadSeasonFixtures(comp.id, meta.year, seasonTtl(meta.current));
  const phase = comp.format === 'split' ? activePhase(apiFixtures) : null;
  if (comp.format === 'split' && !phase) return null;
  return buildCtx(comp, info, meta, phase, apiFixtures, locale);
}

export type SeasonResolution =
  | { kind: 'ok'; ctx: SeasonCtx }
  | { kind: 'redirect'; slug: string }
  | { kind: 'notfound' };

export async function resolveSeason(comp: Competition, info: LeagueInfo, param: string, locale: RouteLocale = 'en'): Promise<SeasonResolution> {
  const ref = parseSeasonSlug(comp, param);
  if (!ref) return { kind: 'notfound' };
  const meta = info.seasons.find((s) => s.year === ref.apiSeason);
  if (!meta) return { kind: 'notfound' };
  const current = currentApiSeason(info);
  const isCurrentApi = !!current && current.year === meta.year && current.current;
  const apiFixtures = await loadSeasonFixtures(comp.id, meta.year, seasonTtl(isCurrentApi));

  if (comp.format === 'split') {
    if (!ref.phase) {
      // Bare year of a split league → the tournament that season is on.
      const phase = activePhase(apiFixtures);
      if (!phase) return { kind: 'notfound' };
      return { kind: 'redirect', slug: seasonSlug(comp, { apiSeason: meta.year, phase }) };
    }
    const hasPhase = apiFixtures.some((f) => parseRound(f.league.round).phase === ref.phase);
    if (!hasPhase) return { kind: 'notfound' };
  } else if (apiFixtures.length === 0) {
    return { kind: 'notfound' };
  }

  const ctx = buildCtx(comp, info, meta, ref.phase, apiFixtures, locale);
  // Any other spelling of the same season (never expected, but cheap to
  // guarantee) goes to the one canonical slug.
  if (ctx.slug !== param) return { kind: 'redirect', slug: ctx.slug };
  return { kind: 'ok', ctx };
}

/** Seasons to link from the hub: the current one and the two before it. For
 *  a split league those are tournaments (Apertura 2026, Clausura 2026,
 *  Apertura 2025), which needs no extra call: the phases of a split API
 *  season are known from the registry. Only phases that already exist are
 *  listed, so every link lands on a real page. */
export function recentSeasons(current: SeasonCtx, limit = 3): SeasonRef[] {
  const { comp, info } = current;
  const years = info.seasons.map((s) => s.year).filter((y) => y <= current.ref.apiSeason).sort((a, b) => b - a);
  const out: SeasonRef[] = [];
  if (comp.format === 'split') {
    // Current API season: its phases up to the one being played.
    const phases: Phase[] = current.ref.phase === 'clausura' ? ['clausura', 'apertura'] : ['apertura'];
    for (const p of phases) out.push({ apiSeason: current.ref.apiSeason, phase: p });
    for (const y of years) {
      if (y === current.ref.apiSeason) continue;
      out.push({ apiSeason: y, phase: 'clausura' }, { apiSeason: y, phase: 'apertura' });
      if (out.length >= limit) break;
    }
  } else {
    for (const y of years) out.push({ apiSeason: y, phase: null });
  }
  return out.slice(0, limit);
}

export function seasonName(ctx: SeasonCtx, locale: RouteLocale): string {
  return seasonLabel(ctx.comp, ctx.ref, locale);
}

// ---- Standings ---------------------------------------------------------------

export interface StandingsResult {
  groups: StandingsGroup[];
  /** Rebuilt from finished fixtures (no provider zones). */
  computed: boolean;
}

const PHASE_RE = /\b(apertura|clausura)\b/i;

function phaseOfGroup(name: string): Phase | null {
  const m = PHASE_RE.exec(name);
  return m ? (m[1].toLowerCase() as Phase) : null;
}

/** "Apertura - Group A" → "Group A"; "Liga MX: Apertura" → "". */
export function cleanGroupName(name: string, comp: Competition, info: LeagueInfo): string {
  let n = name
    .replace(/\b(apertura|clausura)\b(\s*\d{4})?/gi, '')
    .replace(new RegExp(info.league.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
    .replace(new RegExp(comp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
  n = n.replace(/^[\s,:\-–]+|[\s,:\-–]+$/g, '').trim();
  return n;
}

export async function seasonStandings(ctx: SeasonCtx, strict: boolean): Promise<StandingsResult> {
  const coverage = ctx.meta.coverage?.standings;
  if (coverage === false) return { groups: [], computed: false };
  const api = localizeGroups(await loadStandings(ctx.comp.id, ctx.ref.apiSeason, ctx.ttl, strict), ctx.locale);
  const phase = ctx.ref.phase;
  if (!phase) return { groups: api, computed: false };

  const tagged = api.map((g) => ({ g, phase: phaseOfGroup(g.name) }));
  if (tagged.some((t) => t.phase)) {
    const mine = tagged.filter((t) => t.phase === phase).map((t) => t.g);
    if (mine.length > 0) return { groups: mine, computed: false };
  } else if (api.length > 0 && activePhase(ctx.apiFixtures) === phase) {
    // Untagged table: the provider serves the phase being played.
    return { groups: api, computed: false };
  }

  // A past phase the provider no longer serves. Rebuild it only for a
  // single-table league: a league played in zones (Argentina's Group A/B)
  // cannot be reconstructed from results without knowing the zones.
  if (api.length > 1) return { groups: [], computed: false };
  const rows = computeTable(ctx.fixtures);
  return rows.length > 0 ? { groups: [{ name: '', rows }], computed: true } : { groups: [], computed: false };
}

type Line = { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
const emptyLine = (): Line => ({ played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } });

function addResult(l: Line, gf: number, ga: number) {
  l.played++;
  l.goals.for += gf;
  l.goals.against += ga;
  if (gf > ga) l.win++;
  else if (gf === ga) l.draw++;
  else l.lose++;
}

/** Table from the finished regular-season matches of one phase. Tiebreaks:
 *  points, goal difference, goals for (as far as we know the provider's
 *  order; head-to-head and fair-play rules are not applied). */
export function computeTable(fixtures: Fixture[]): StandingRow[] {
  const teams = new Map<number, { team: Fixture['teams']['home']; all: Line; home: Line; away: Line; results: { date: string; r: string }[] }>();
  const get = (t: Fixture['teams']['home']) => {
    let e = teams.get(t.id);
    if (!e) {
      e = { team: t, all: emptyLine(), home: emptyLine(), away: emptyLine(), results: [] };
      teams.set(t.id, e);
    }
    return e;
  };
  for (const f of fixtures) {
    if (parseRound(f.league.round).number == null) continue;
    if (fixturePhase(f) !== 'finished') continue;
    const gh = f.goals.home;
    const ga = f.goals.away;
    if (gh == null || ga == null) continue;
    const h = get(f.teams.home);
    const a = get(f.teams.away);
    addResult(h.all, gh, ga);
    addResult(h.home, gh, ga);
    addResult(a.all, ga, gh);
    addResult(a.away, ga, gh);
    const rh = gh > ga ? 'W' : gh === ga ? 'D' : 'L';
    const ra = gh < ga ? 'W' : gh === ga ? 'D' : 'L';
    h.results.push({ date: f.fixture.date, r: rh });
    a.results.push({ date: f.fixture.date, r: ra });
  }
  const pts = (l: Line) => l.win * 3 + l.draw;
  const list = [...teams.values()].sort((x, y) => {
    const d =
      pts(y.all) - pts(x.all) ||
      y.all.goals.for - y.all.goals.against - (x.all.goals.for - x.all.goals.against) ||
      y.all.goals.for - x.all.goals.for;
    return d || x.team.name.localeCompare(y.team.name);
  });
  return list.map((e, i) => ({
    rank: i + 1,
    team: { id: e.team.id, name: e.team.name, logo: e.team.logo },
    points: pts(e.all),
    goalsDiff: e.all.goals.for - e.all.goals.against,
    group: null,
    // Provider convention: most recent result first.
    form: e.results
      .sort((p, q) => q.date.localeCompare(p.date))
      .slice(0, 5)
      .map((x) => x.r)
      .join(''),
    description: null,
    all: e.all,
    home: e.home,
    away: e.away,
  }));
}

// ---- Top lists ------------------------------------------------------------------

export interface TopListResult {
  rows: PlayerWithStats[];
  /** The provider's list covers the whole API season (both tournaments of a
   *  split league), not just the phase in the URL. */
  mixed: boolean;
}

export async function seasonTopList(ctx: SeasonCtx, kind: TopKind, strict: boolean): Promise<TopListResult> {
  const cov = ctx.meta.coverage;
  const flag = kind === 'scorers' ? cov?.top_scorers : kind === 'assists' ? cov?.top_assists : cov?.top_cards;
  if (flag === false) return { rows: [], mixed: false };
  const rows = await loadTopList(kind, ctx.comp.id, ctx.ref.apiSeason, ctx.ttl, strict);
  return { rows, mixed: ctx.mixedTopLists };
}

/** The stat line for this competition (a player's list carries one entry
 *  per competition he played). */
export function statFor(p: PlayerWithStats, leagueId: number) {
  return p.statistics.find((s) => s.league.id === leagueId) ?? p.statistics[0] ?? null;
}

export function topValue(p: PlayerWithStats, kind: TopKind, leagueId: number): number {
  const s = statFor(p, leagueId);
  if (!s) return 0;
  if (kind === 'scorers') return s.goals.total ?? 0;
  if (kind === 'assists') return s.goals.assists ?? 0;
  return s.cards.yellow ?? 0;
}

// ---- Zones -------------------------------------------------------------------

/** Distinct zone descriptions in table order, each with a color token.
 *  Nothing is hardcoded about which ranks qualify: the provider's own
 *  per-row description drives both the row marker and the legend. */
export interface Zone {
  description: string;
  className: string;
}

const PROMO_COLORS = ['bg-primary', 'bg-gold', 'bg-chart-3', 'bg-foreground/60', 'bg-muted-foreground/60', 'bg-chart-2'];

export function zonesFor(groups: StandingsGroup[]): Map<string, Zone> {
  const map = new Map<string, Zone>();
  let promo = 0;
  for (const g of groups) {
    for (const r of g.rows) {
      const d = r.description?.trim();
      if (!d || map.has(d)) continue;
      const relegation = /^relegation/i.test(d);
      map.set(d, {
        description: d,
        className: relegation ? 'bg-destructive' : PROMO_COLORS[promo++ % PROMO_COLORS.length],
      });
    }
  }
  return map;
}

const STAGE_WORDS: [RegExp, Record<RouteLocale, string>][] = [
  [/play[- ]?offs?:\s*1\/8-finals|1\/8-finals/i, { es: 'octavos de final', pt: 'oitavas de final', en: 'round of 16' }],
  [/play[- ]?offs?:\s*1\/16-finals|1\/16-finals/i, { es: 'dieciseisavos de final', pt: 'fase de 32', en: 'round of 32' }],
  [/quarter-finals/i, { es: 'cuartos de final', pt: 'quartas de final', en: 'quarter-finals' }],
  [/semi-finals/i, { es: 'semifinales', pt: 'semifinais', en: 'semi-finals' }],
  [/play-?in/i, { es: 'play-in', pt: 'play-in', en: 'play-in' }],
  [/group stage/i, { es: 'fase de grupos', pt: 'fase de grupos', en: 'group stage' }],
  [/league stage/i, { es: 'fase de liga', pt: 'fase de liga', en: 'league stage' }],
  [/qualification|qualifying|preliminary/i, { es: 'fase previa', pt: 'fase preliminar', en: 'qualifying' }],
  [/knockout/i, { es: 'fase final', pt: 'mata-mata', en: 'knockout stage' }],
  [/play[- ]?offs?|post season/i, { es: 'fase final', pt: 'mata-mata', en: 'play-offs' }],
];

function stageWord(s: string, locale: RouteLocale): string | null {
  for (const [re, w] of STAGE_WORDS) if (re.test(s)) return w[locale];
  return null;
}

/** Provider zone text in the reader's language, e.g.
 *  "Promotion - Copa Libertadores (Group Stage)" → "Copa Libertadores (fase de grupos)".
 *  Anything we do not recognise is shown as the provider wrote it. */
export function zoneLabel(description: string, locale: RouteLocale): string {
  const m = /^(promotion|relegation)\s*-\s*(.+?)(?:\s*\((.+)\))?$/i.exec(description.trim());
  if (!m) {
    const w = stageWord(description, locale);
    if (!w) return description;
    return locale === 'es' ? `Clasifica a ${w}` : locale === 'pt' ? `Classifica para ${w}` : `Qualifies for ${w}`;
  }
  const [, kind, target, stage] = m;
  if (/relegation/i.test(kind)) {
    return locale === 'es' ? `Descenso a ${target}` : locale === 'pt' ? `Rebaixamento para ${target}` : `Relegation to ${target}`;
  }
  const st = stage ? stageWord(stage.replace(/^(apertura|clausura)\s*-\s*/i, ''), locale) ?? stage : null;
  // "Promotion - Liga MX (Play Offs: Quarter-finals)": the target is the
  // league's own play-offs, so say that instead of "qualifies for Liga MX".
  if (stage && /play[- ]?offs?/i.test(stage)) {
    const fin = locale === 'es' ? 'Clasifica a la fase final' : locale === 'pt' ? 'Classifica para o mata-mata' : 'Qualifies for the play-offs';
    const sub = stageWord(stage.replace(/^.*play[- ]?offs?:?\s*/i, ''), locale);
    return sub && sub !== stageWord('play-offs', locale) ? `${fin} (${sub})` : fin;
  }
  const base = locale === 'es' ? `Clasifica a ${target}` : locale === 'pt' ? `Classifica para ${target}` : `Qualifies for ${target}`;
  return st ? `${base} (${st})` : base;
}

// ---- Kickoff zones ---------------------------------------------------------------

const LOCALE_FALLBACK: Record<RouteLocale, string> = { es: 'mx', pt: 'br', en: 'us-et' };

/** The zone a competition's times are printed in: the market it is played
 *  for (Brazil for a Portuguese reader when Brazil is one of them), else the
 *  reader's usual market. */
export function referenceZone(comp: Competition, locale: RouteLocale): ZoneRow {
  if (locale === 'pt' && comp.countries.includes('br')) return KICKOFF_ZONES.find((z) => z.key === 'br')!;
  const hit = KICKOFF_ZONES.find((z) => comp.countries.includes(z.country));
  return hit ?? KICKOFF_ZONES.find((z) => z.key === LOCALE_FALLBACK[locale])!;
}

/** Markets a reader of each language most likely watches from, used to
 *  fill the per-country line after the competition's own markets. */
const READER_ZONES: Record<RouteLocale, string[]> = {
  es: ['mx', 'co', 'ar', 'es'],
  pt: ['br'],
  en: ['us-et', 'us-pt'],
};

/** Up to four zones for a round's per-country kickoff line: the
 *  competition's own markets first, then the reader's. */
export function roundZones(comp: Competition, locale: RouteLocale): ZoneRow[] {
  const out: ZoneRow[] = [referenceZone(comp, locale)];
  const add = (z: ZoneRow | undefined) => {
    if (!z || out.length >= 4 || out.includes(z)) return;
    // One US row is enough on a compact line.
    if (z.key === 'us-pt' && out.some((o) => o.key === 'us-et')) return;
    out.push(z);
  };
  for (const z of KICKOFF_ZONES) if ((comp.countries as readonly string[]).includes(z.country)) add(z);
  for (const key of READER_ZONES[locale]) add(KICKOFF_ZONES.find((z) => z.key === key));
  return out;
}

/** Kickoff not yet fixed by the organiser (the provider parks a date). */
export function timeUnknown(f: Fixture): boolean {
  return f.fixture.status.short === 'TBD';
}
