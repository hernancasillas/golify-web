// Data layer of the public quiniela pages. Server-only by convention (it
// reaches API-Football and Supabase).
//
// A public quiniela is "round N of the league's CURRENT season". Everything is
// resolved from three cheap, long-cached calls per league:
//   /leagues?id                         → current season (TTL daily)
//   /fixtures/rounds?current=true       → the round in progress (TTL 10 min)
//   /fixtures/rounds                    → every round name (TTL 6 h)
// plus one call for the fixtures of the round being shown
// (/fixtures?league&season&round — a 9-10 row answer instead of the 300-row
// season list). Split leagues (Liga MX Apertura/Clausura) play two
// tournaments in one API season; the round number is resolved inside the
// phase of the round in progress, so /jornada-12 in October is Apertura 12.
//
// Every API call here is `strict`: a failure throws (ISR keeps the last good
// page) and only a genuinely empty answer reads as "not found".

import {
  apiFootballGet,
  currentSeason,
  fixturePhase,
  getLeagueInfoCached,
  TTL,
  type Fixture,
  type LeagueInfo,
} from '@/lib/api-football';
import { getPickSplits, type PickSplit } from '@/lib/community';
import { parseRound, type Competition, type Phase } from '@/lib/competitions';
import { HUB_COUNTRY_INFO, KICKOFF_ZONES } from '@/lib/timezones';
import type { HubCountry, RouteLocale } from '@/lib/routes';

/** Plan A4: a public quiniela is indexed only with ≥ 50 registered picks. */
export const INDEX_THRESHOLD = 50;

export interface RoundRef {
  /** Round number (jornada / rodada / matchday). */
  n: number;
  /** API-Football round name ("Apertura - 12", "Regular Season - 21"). */
  raw: string;
}

export interface PoolLeague {
  comp: Competition;
  info: LeagueInfo;
  season: number;
  /** Tournament of a split season the pages work in (null elsewhere). */
  phase: Phase | null;
  /** Round in progress as the provider names it (may be a knockout stage). */
  currentRaw: string | null;
  /** Round in progress when it is a numbered round. */
  current: RoundRef | null;
  /** Numbered rounds of the phase, ascending. Empty unless requested. */
  rounds: RoundRef[];
}

/** "Regular Season - 12" → "regular season"; tells apart two numbered stages
 *  of one season ("Regular Season - 3" vs "Championship Group - 3"). */
function stageKey(stage: string): string {
  return stage.replace(/\s*-?\s*\d+$/, '').trim().toLowerCase();
}

export async function loadPoolLeague(
  comp: Competition,
  opts: { withRounds?: boolean } = {},
): Promise<PoolLeague | null> {
  const info = await getLeagueInfoCached(comp.id, { strict: true });
  if (!info) return null;
  const season = currentSeason(info);
  if (season == null) return null;

  const [currentRows, allRounds] = await Promise.all([
    apiFootballGet<string>(
      '/fixtures/rounds',
      { league: comp.id, season, current: 'true' },
      { revalidate: TTL.standings, strict: true },
    ),
    opts.withRounds
      ? apiFootballGet<string>('/fixtures/rounds', { league: comp.id, season }, { revalidate: TTL.hours, strict: true })
      : Promise.resolve([] as string[]),
  ]);

  const currentRaw = currentRows[0] ?? null;
  const cur = currentRaw ? parseRound(currentRaw) : null;

  // Phase: the one in progress; off-season, the last one the season played.
  let phase: Phase | null = cur?.phase ?? null;
  if (!phase && comp.format === 'split') {
    for (let i = allRounds.length - 1; i >= 0; i--) {
      const p = parseRound(allRounds[i]).phase;
      if (p) {
        phase = p;
        break;
      }
    }
  }

  const preferredStage = cur && cur.number != null ? stageKey(cur.stage) : null;
  const byNumber = new Map<number, RoundRef & { stage: string }>();
  for (const raw of allRounds) {
    const p = parseRound(raw);
    if (p.number == null || p.phase !== phase) continue;
    const prev = byNumber.get(p.number);
    const stage = stageKey(p.stage);
    if (!prev || (preferredStage && stage === preferredStage && prev.stage !== preferredStage)) {
      byNumber.set(p.number, { n: p.number, raw, stage });
    }
  }
  const rounds = [...byNumber.values()].sort((a, b) => a.n - b.n).map(({ n, raw }) => ({ n, raw }));

  const current: RoundRef | null =
    cur && cur.number != null && cur.phase === phase && currentRaw ? { n: cur.number, raw: currentRaw } : null;

  return { comp, info, season, phase, currentRaw, current, rounds };
}

/** Name of round n next to a known round of the same stage
 *  ("Apertura - 11" → "Apertura - 12"). Used where the full round list is not
 *  loaded (index, sitemap); a name that does not exist returns no fixtures. */
export function siblingRound(raw: string, n: number): string {
  return raw.replace(/\d+$/, String(n));
}

export async function loadRoundFixtures(
  leagueId: number,
  season: number,
  raw: string,
  opts: { past?: boolean } = {},
): Promise<Fixture[]> {
  const rows = await apiFootballGet<Fixture>(
    '/fixtures',
    { league: leagueId, season, round: raw },
    // A round that is over only changes on a rescheduled match.
    { revalidate: opts.past ? TTL.hours : TTL.day, strict: true },
  );
  return rows.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date) || a.fixture.id - b.fixture.id);
}

/** First and last match the round will actually play: a postponed match
 *  keeps its original date and would stretch "from … to …" by months. */
export function playedSpan(fixtures: Fixture[]): [Fixture, Fixture] {
  const live = fixtures.filter((f) => fixturePhase(f) !== 'off');
  const list = live.length > 0 ? live : fixtures;
  return [list[0], list[list.length - 1]];
}

export function totalPicks(splits: Map<number, PickSplit>, fixtures: Fixture[]): number {
  let t = 0;
  for (const f of fixtures) t += splits.get(f.fixture.id)?.total ?? 0;
  return t;
}

export async function splitsFor(fixtures: Fixture[]): Promise<Map<number, PickSplit>> {
  return getPickSplits(fixtures.map((f) => f.fixture.id));
}

// ---- Round facts (conditional copy over real data) ----------------------

export interface RoundTally {
  total: number;
  played: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  goals: number;
  /** First match still open for picks. */
  nextOpen: Fixture | null;
}

export function tallyRound(fixtures: Fixture[]): RoundTally {
  const t: RoundTally = { total: fixtures.length, played: 0, homeWins: 0, draws: 0, awayWins: 0, goals: 0, nextOpen: null };
  for (const f of fixtures) {
    const ph = fixturePhase(f);
    if (ph === 'finished' && f.goals.home != null && f.goals.away != null) {
      t.played++;
      t.goals += f.goals.home + f.goals.away;
      if (f.goals.home > f.goals.away) t.homeWins++;
      else if (f.goals.home < f.goals.away) t.awayWins++;
      else t.draws++;
    }
    if (ph === 'scheduled' && !t.nextOpen) t.nextOpen = f;
  }
  return t;
}

/** The zone the page quotes times in: the league's home market (CDMX for
 *  Liga MX, Brasília for the Brasileirão), else the reader's usual one. */
export function homeZone(comp: Competition, locale: RouteLocale): { zone: string; label: string } {
  const fallback: Record<RouteLocale, HubCountry> = { es: 'mx', pt: 'br', en: 'us' };
  const country: HubCountry =
    locale === 'pt' && comp.countries.includes('br') ? 'br' : (comp.countries[0] ?? fallback[locale]);
  const row = KICKOFF_ZONES.find((z) => z.country === country);
  return { zone: HUB_COUNTRY_INFO[country].zone, label: row?.label[locale] ?? HUB_COUNTRY_INFO[country].name[locale] };
}

const NF: Record<RouteLocale, string> = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' };

/** "3 de octubre" / "3 de outubro" / "October 3" in a zone. */
export function dayMonth(iso: string, zone: string, locale: RouteLocale): string {
  return new Date(iso).toLocaleDateString(NF[locale], { day: 'numeric', month: 'long', timeZone: zone });
}
