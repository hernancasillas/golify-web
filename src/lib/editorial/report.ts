// Informe Golify: monthly report computed from real data only.
//   - results: season fixtures (API-Football) finished in that month, for the
//     covered competitions;
//   - community: pick splits from Supabase (get_fixture_pick_split, ≥ 20 picks
//     per fixture) for those fixtures.
// Nothing is invented: when the RPC returns nothing (migration not applied) or
// the month has fewer than MIN_PICKS predictions, the page says so and is
// noindex.

import { getSeasonFixtures, type Fixture } from '@/lib/api-football';
import { COMPETITIONS, type Competition } from '@/lib/competitions';
import { correctShare, getPickSplits, type PickSplit } from '@/lib/community';

export const REPORT_FIRST_MONTH = '2026-06';
export const MIN_PICKS = 1000;
const FINISHED = new Set(['FT', 'AET', 'PEN']);

export function currentMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** 'YYYY-MM' list from the first month to `now`, newest first. */
export function reportMonths(now = new Date()): string[] {
  const end = currentMonth(now);
  const out: string[] = [];
  let [y, m] = REPORT_FIRST_MONTH.split('-').map(Number);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (key > end) break;
    out.push(key);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out.reverse();
}

export function isReportMonth(s: string, now = new Date()): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s) && s >= REPORT_FIRST_MONTH && s <= currentMonth(now);
}

/** API-Football season that contains `month` for this competition. */
function seasonFor(c: Competition, month: string): number {
  const [y, m] = month.split('-').map(Number);
  return c.format === 'cross' ? (m >= 7 ? y : y - 1) : y;
}

export interface MatchRef {
  fixtureId: number;
  home: string;
  away: string;
  goalsHome: number;
  goalsAway: number;
  leagueId: number;
}
export interface PredictedMatch extends MatchRef {
  picks: number;
  /** Share of picks on the community favourite and what it was. */
  favouritePct: number;
  favourite: 'home' | 'draw' | 'away';
  correctPct: number;
}

export interface MonthReport {
  month: string;
  matchesPlayed: number;
  matchesWithData: number;
  totalPicks: number;
  /** Picks-weighted share of predictions that called the result. */
  hitRate: number | null;
  /** Share of matches in which the community favourite was right. */
  favouriteRate: number | null;
  upsets: PredictedMatch[];
  mostPredicted: PredictedMatch[];
  mostPredictable: { leagueId: number; matches: number; hitRate: number } | null;
  indexable: boolean;
}

const cache = new Map<string, { at: number; v: MonthReport }>();

export async function buildMonthReport(month: string): Promise<MonthReport> {
  const hit = cache.get(month);
  if (hit && Date.now() - hit.at < 3600_000) return hit.v;

  const past = month < currentMonth();
  const revalidate = past ? 86400 : 3600;
  const settled = await Promise.all(
    COMPETITIONS.map(async (c) => {
      // strict: a failed call throws, so ISR keeps the last good report and a
      // half-empty month is never published as if it were complete.
      const rows = await getSeasonFixtures(c.id, seasonFor(c, month), { strict: true, revalidate });
      return rows;
    }),
  );
  const played: Fixture[] = settled
    .flat()
    .filter((f) => FINISHED.has(f.fixture.status.short) && f.fixture.date.startsWith(month) && f.goals.home != null && f.goals.away != null);

  const splits = new Map<number, PickSplit>();
  const ids = played.map((f) => f.fixture.id);
  for (let i = 0; i < ids.length; i += 300) {
    for (const [k, v] of await getPickSplits(ids.slice(i, i + 300))) splits.set(k, v);
  }

  const rows: PredictedMatch[] = [];
  for (const f of played) {
    const s = splits.get(f.fixture.id);
    if (!s) continue;
    const correct = correctShare(s, f.goals);
    if (correct == null) continue;
    const entries = [['home', s.pct.home], ['draw', s.pct.draw], ['away', s.pct.away]] as const;
    const fav = [...entries].sort((a, b) => b[1] - a[1])[0];
    rows.push({
      fixtureId: f.fixture.id,
      home: f.teams.home.name,
      away: f.teams.away.name,
      goalsHome: f.goals.home as number,
      goalsAway: f.goals.away as number,
      leagueId: f.league.id,
      picks: s.total,
      favourite: fav[0],
      favouritePct: fav[1],
      correctPct: correct,
    });
  }

  const totalPicks = rows.reduce((n, r) => n + r.picks, 0);
  const outcome = (r: MatchRef) => (r.goalsHome > r.goalsAway ? 'home' : r.goalsHome < r.goalsAway ? 'away' : 'draw');
  const weighted = (rs: PredictedMatch[]) => rs.reduce((n, r) => n + (r.picks * r.correctPct) / 100, 0) / rs.reduce((n, r) => n + r.picks, 0);

  const byLeague = new Map<number, PredictedMatch[]>();
  for (const r of rows) byLeague.set(r.leagueId, [...(byLeague.get(r.leagueId) ?? []), r]);
  const leagues = [...byLeague.entries()]
    .filter(([, rs]) => rs.length >= 5)
    .map(([leagueId, rs]) => ({ leagueId, matches: rs.length, hitRate: weighted(rs) }))
    .sort((a, b) => b.hitRate - a.hitRate);

  const v: MonthReport = {
    month,
    matchesPlayed: played.length,
    matchesWithData: rows.length,
    totalPicks,
    hitRate: rows.length ? weighted(rows) : null,
    favouriteRate: rows.length ? rows.filter((r) => r.favourite === outcome(r)).length / rows.length : null,
    upsets: rows
      .filter((r) => r.favouritePct >= 60 && r.favourite !== outcome(r))
      .sort((a, b) => b.favouritePct - a.favouritePct)
      .slice(0, 5),
    mostPredicted: [...rows].sort((a, b) => b.picks - a.picks).slice(0, 5),
    mostPredictable: leagues[0] ?? null,
    indexable: totalPicks >= MIN_PICKS,
  };
  cache.set(month, { at: Date.now(), v: v });
  return v;
}
