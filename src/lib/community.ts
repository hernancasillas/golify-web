// Golify's own data (plan §5 "dato propio"): how the community predicted each
// match, aggregated across every quiniela in the app. This is the layer no
// livescore competitor has, and the reason a Golify match page is not a copy
// of the same page on Flashscore.
//
// Source: Supabase RPC `get_fixture_pick_split` (migration
// fuchibol/supabase/migrations/20260930120000_web_public_aggregates.sql). It
// returns aggregates only, and only for fixtures with ≥ 20 picks. Until the
// migration is applied — or when a fixture has too few picks — every helper
// here returns nothing and the blocks that use it simply do not render.

import { supabase } from './supabase-server';

export interface PickSplit {
  fixtureId: number;
  home: number;
  draw: number;
  away: number;
  total: number;
  /** Rounded percentages that add up to 100. */
  pct: { home: number; draw: number; away: number };
}

function percentages(h: number, d: number, a: number): PickSplit['pct'] {
  const t = h + d + a;
  if (t === 0) return { home: 0, draw: 0, away: 0 };
  const raw = [h, d, a].map((v) => (v / t) * 100);
  const floored = raw.map(Math.floor);
  let rest = 100 - floored.reduce((s, v) => s + v, 0);
  // Largest-remainder rounding so the three bars always sum to 100.
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((x, y) => y[0] - x[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    floored[i]++;
    rest--;
  }
  return { home: floored[0], draw: floored[1], away: floored[2] };
}

export async function getPickSplits(fixtureIds: number[]): Promise<Map<number, PickSplit>> {
  const out = new Map<number, PickSplit>();
  const ids = [...new Set(fixtureIds)].filter((n) => Number.isSafeInteger(n) && n > 0).slice(0, 300);
  if (ids.length === 0 || !process.env.SUPABASE_URL) return out;
  try {
    const { data, error } = await supabase.rpc('get_fixture_pick_split', { p_fixture_ids: ids });
    if (error || !Array.isArray(data)) return out;
    for (const r of data as { fixture_id: number; home: number; draw: number; away: number; total: number }[]) {
      out.set(Number(r.fixture_id), {
        fixtureId: Number(r.fixture_id),
        home: r.home,
        draw: r.draw,
        away: r.away,
        total: r.total,
        pct: percentages(r.home, r.draw, r.away),
      });
    }
  } catch {
    // Missing RPC, network, or Supabase down: the page renders without it.
  }
  return out;
}

export async function getPickSplit(fixtureId: number): Promise<PickSplit | null> {
  return (await getPickSplits([fixtureId])).get(fixtureId) ?? null;
}

/** After the final whistle: share of the community that called the result. */
export function correctShare(
  split: PickSplit,
  goals: { home: number | null; away: number | null },
): number | null {
  if (goals.home == null || goals.away == null) return null;
  const outcome = goals.home > goals.away ? 'home' : goals.home < goals.away ? 'away' : 'draw';
  return split.pct[outcome];
}
