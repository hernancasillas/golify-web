// The site's own child sitemaps (plan A2). Each child is a named list of
// SitemapEntry; xml.ts expands every entry to one <url> per locale.
//
// Rules shared by every child:
//  - only URLs whose page passes its indexing threshold (plan A4). When the
//    threshold needs data we cannot get cheaply, the URL stays out;
//  - every path comes from a routes.ts builder;
//  - strict fetchers: a failed API call throws, so ISR keeps the last good
//    file instead of publishing an empty one;
//  - lastmod only when it is a real content date — never "now".
//
// Quota: everything below reuses one call per league for the season info,
// fixtures and teams (shared with the pages through the fetch cache). Only
// the jugadores-* children page through /players, and only on demand.

import {
  getLeagueInfoCached,
  currentSeason,
  getSeasonFixtures,
  getLeagueTeams,
  getLeaguePlayers,
  fixturePhase,
  TTL,
  type Fixture,
  type LeagueInfo,
} from '@/lib/api-football';
import { COMPETITIONS, parseRound, seasonSlug, type Competition, type Phase } from '@/lib/competitions';
import {
  HUB_COUNTRIES,
  competitionPath,
  datePath,
  h2hPath,
  homePath,
  hubPath,
  matchPath,
  playerPath,
  sectionPath,
  stadiumPath,
  teamPath,
  type RouteLocale,
  type SectionKey,
} from '@/lib/routes';
import { WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON } from '@/lib/site';
import type { SitemapEntry } from './types';
import { dedupe } from './xml';

const DOMESTIC = COMPETITIONS.filter((c) => c.kind === 'league');

/** Leagues whose players get a jugadores-{slug} file: domestic leagues plus
 *  the two continental cups people search players from. */
export const PLAYER_LEAGUES = COMPETITIONS.filter((c) => c.kind === 'league' || c.id === 13 || c.id === 2);

/** H2H pages noindex pairs with < 3 meetings. Checking that per pair is one
 *  call each, so we only list pairs from leagues with long shared history and
 *  leave out MLS and the Saudi league, where recent expansion clubs and
 *  promoted sides have met only once or twice. */
export const H2H_LEAGUES = DOMESTIC.filter((c) => c.market !== 'us' && c.market !== 'mundo');

// ---- Shared season data -------------------------------------------------

async function seasonOf(c: Competition): Promise<{ season: number; info: LeagueInfo } | null> {
  const info = await getLeagueInfoCached(c.id, { strict: true });
  const season = info ? currentSeason(info) : null;
  return info && season ? { season, info } : null;
}

async function seasonFixtures(c: Competition): Promise<{ season: number; info: LeagueInfo; fixtures: Fixture[] } | null> {
  const s = await seasonOf(c);
  if (!s) return null;
  const fixtures = await getSeasonFixtures(c.id, s.season, { strict: true, revalidate: TTL.hours });
  return { ...s, fixtures };
}

const entry = (path: (l: RouteLocale) => string, lastmod?: string): SitemapEntry =>
  lastmod ? { path, lastmod } : { path };

// ---- static.xml ---------------------------------------------------------

/** Pages that predate the localized scheme and keep the same segment in
 *  every locale. routes.ts has no builder for them (see sharedRequests). */
const LEGACY_STATIC = ['world-cup', 'world-cup/bracket', 'features'];

const STATIC_SECTIONS: SectionKey[] = [
  'today',
  'live',
  'leagues',
  'pool',
  'downloads',
  'guides',
  'news',
  'contact',
  'editorialPolicy',
  'privacy',
  'terms',
  'cookies',
  'advertise',
  'about',
];

export async function staticEntries(): Promise<SitemapEntry[]> {
  return [
    entry((l) => homePath(l)),
    ...STATIC_SECTIONS.map((k) => entry((l) => sectionPath(k, l))),
    ...LEGACY_STATIC.map((p) => entry((l) => `${homePath(l)}/${p}`)),
  ];
}

// ---- hubs-pais.xml / fechas.xml -------------------------------------------

export async function hubEntries(): Promise<SitemapEntry[]> {
  return HUB_COUNTRIES.map((cc) => entry((l) => hubPath(l, cc)));
}

/** Date archive: last 30 days + next 7 (UTC dates). */
export async function dateEntries(now = new Date()): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  for (let d = -30; d <= 7; d++) {
    const iso = new Date(now.getTime() + d * 86400_000).toISOString().slice(0, 10);
    out.push(entry((l) => datePath(l, iso)));
  }
  return out;
}

// ---- partidos-YYYY-MM.xml ----------------------------------------------

/** Month files the index advertises: 3 months back to 2 ahead. Computed from
 *  the date alone so the index never waits on the API. */
export function matchMonths(now = new Date()): string[] {
  const out: string[] = [];
  for (let m = -3; m <= 2; m++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

const monthOf = (f: Fixture) => new Date(f.fixture.date).toISOString().slice(0, 7);

/** Finished match → the result was final ~3 h after kickoff (that is when the
 *  page stops changing). Scheduled/live pages get no lastmod. */
function matchLastmod(f: Fixture): string | undefined {
  if (fixturePhase(f) !== 'finished') return undefined;
  const t = new Date(f.fixture.date).getTime() + 3 * 3600_000;
  return t < Date.now() ? new Date(t).toISOString() : undefined;
}

export async function matchEntries(month: string): Promise<SitemapEntry[]> {
  const lists = await Promise.all(COMPETITIONS.map((c) => seasonFixtures(c).then((s) => s?.fixtures ?? [])));
  // The 2026 World Cup (June–July 2026) is fixed history: one weekly-cached call.
  if (month >= `${WORLD_CUP_SEASON}-06` && month <= `${WORLD_CUP_SEASON}-07`) {
    lists.push(await getSeasonFixtures(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON, { strict: true, revalidate: TTL.weekly }));
  }
  const out: SitemapEntry[] = [];
  const seen = new Set<number>();
  for (const f of lists.flat()) {
    if (seen.has(f.fixture.id) || monthOf(f) !== month) continue;
    // Postponed/cancelled matches have no scoreboard and no result to show.
    if (fixturePhase(f) === 'off') continue;
    seen.add(f.fixture.id);
    out.push(entry((l) => matchPath(l, f), matchLastmod(f)));
  }
  return out;
}

// ---- equipos.xml -------------------------------------------------------

export async function teamEntries(): Promise<SitemapEntry[]> {
  const lists = await Promise.all(
    COMPETITIONS.map(async (c) => {
      const s = await seasonOf(c);
      return s ? getLeagueTeams(c.id, s.season, { strict: true }) : [];
    }),
  );
  const seen = new Set<number>();
  const out: SitemapEntry[] = [];
  for (const t of lists.flat()) {
    if (seen.has(t.team.id)) continue;
    seen.add(t.team.id);
    const team = { id: t.team.id, name: t.team.name };
    out.push(entry((l) => teamPath(l, team)));
  }
  return out;
}

// ---- estadios.xml ------------------------------------------------------

/** Stadium pages index at ≥ 5 matches. We count finished matches at the
 *  venue in the current season only, so a listed stadium passes for sure. */
const STADIUM_MIN_MATCHES = 5;

export async function stadiumEntries(): Promise<SitemapEntry[]> {
  const perLeague = await Promise.all(
    DOMESTIC.map(async (c) => {
      const s = await seasonFixtures(c);
      if (!s) return [];
      const teams = await getLeagueTeams(c.id, s.season, { strict: true });
      // /teams venue names come from the same table as /venues, so they
      // match the stadium page's canonical slug better than fixture labels.
      const names = new Map<number, string>();
      for (const t of teams) if (t.venue.id && t.venue.name) names.set(t.venue.id, t.venue.name);
      const played = new Map<number, number>();
      for (const f of s.fixtures) {
        const id = f.fixture.venue.id;
        if (id && fixturePhase(f) === 'finished') played.set(id, (played.get(id) ?? 0) + 1);
      }
      return [...names].filter(([id]) => (played.get(id) ?? 0) >= STADIUM_MIN_MATCHES).map(([id, name]) => ({ id, name }));
    }),
  );
  return dedupe(perLeague.flat().map((v) => entry((l) => stadiumPath(l, v))));
}

// ---- torneos.xml -------------------------------------------------------

/** Phase of a split season that is being played now: the round of the next
 *  unfinished match, else of the last match. */
function currentPhase(fixtures: Fixture[]): Phase | null {
  const next = fixtures.find((f) => fixturePhase(f) === 'scheduled' || fixturePhase(f) === 'live') ?? fixtures.at(-1);
  return next ? parseRound(next.league.round).phase : null;
}

export async function competitionEntries(): Promise<SitemapEntry[]> {
  const perComp = await Promise.all(
    COMPETITIONS.map(async (c) => {
      const out: SitemapEntry[] = [entry((l) => competitionPath(l, c.id)!)];
      const s = await seasonFixtures(c);
      if (!s) return out;
      const phase = c.format === 'split' ? currentPhase(s.fixtures) : null;
      // A split league without a phase in its rounds would only have the bare
      // year page, which the page itself may redirect — leave it out.
      if (c.format === 'split' && !phase) return out;
      const slug = seasonSlug(c, { apiSeason: s.season, phase });
      out.push(entry((l) => competitionPath(l, c.id, slug)!));
      out.push(entry((l) => competitionPath(l, c.id, slug, 'fixtures')!));

      // Sections only where API-Football has the data for this season.
      const cov = s.info.seasons.find((x) => x.year === s.season)?.coverage;
      if (cov?.standings) out.push(entry((l) => competitionPath(l, c.id, slug, 'table')!));
      if (cov?.top_scorers) out.push(entry((l) => competitionPath(l, c.id, slug, 'scorers')!));
      if (cov?.top_assists) out.push(entry((l) => competitionPath(l, c.id, slug, 'assists')!));
      if (cov?.top_cards) out.push(entry((l) => competitionPath(l, c.id, slug, 'cards')!));

      // Numbered rounds of the current season/phase (from the cached fixture
      // list — no extra /fixtures/rounds call).
      const rounds = new Set<number>();
      for (const f of s.fixtures) {
        const r = parseRound(f.league.round);
        if (r.number != null && r.phase === phase) rounds.add(r.number);
      }
      for (const n of [...rounds].sort((a, b) => a - b)) {
        out.push(entry((l) => competitionPath(l, c.id, slug, { round: n })!));
      }
      return out;
    }),
  );
  return perComp.flat();
}

// ---- jugadores-{slug}.xml ------------------------------------------------

/** Player pages index at ≥ 1 appearance. ~30 sequential /players pages per
 *  league, cached weekly; generated only when this file is requested. */
export async function playerEntries(c: Competition): Promise<SitemapEntry[]> {
  const s = await seasonOf(c);
  if (!s) return [];
  const rows = await getLeaguePlayers(c.id, s.season, { strict: true });
  const seen = new Set<number>();
  const out: SitemapEntry[] = [];
  for (const r of rows) {
    if (seen.has(r.player.id)) continue;
    const apps = r.statistics
      .filter((st) => st.league.id === c.id)
      .reduce((n, st) => n + (st.games.appearences ?? 0), 0);
    if (apps < 1) continue;
    seen.add(r.player.id);
    const p = { id: r.player.id, name: r.player.name };
    out.push(entry((l) => playerPath(l, p)));
  }
  return out;
}

// ---- h2h-{slug}.xml ------------------------------------------------------

export async function h2hEntries(c: Competition): Promise<SitemapEntry[]> {
  const s = await seasonOf(c);
  if (!s) return [];
  const teams = (await getLeagueTeams(c.id, s.season, { strict: true }))
    .map((t) => ({ id: t.team.id, name: t.team.name }))
    .sort((a, b) => a.id - b.id);
  const out: SitemapEntry[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const [a, b] = [teams[i], teams[j]];
      out.push(entry((l) => h2hPath(l, a, b)));
    }
  }
  return out;
}
