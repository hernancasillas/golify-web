// Tracked leagues — the league chips on Home, the scope of the live-matches
// widget, the /today and /live boards, and the league pages we put in the
// sitemap. Derived from the competition registry (competitions.ts), which is
// the one source of truth for coverage, slugs and labels.

import { COMPETITIONS } from './competitions';

export type { Market } from './competitions';

export const TRACKED_LEAGUES = COMPETITIONS.map((c) => ({
  name: c.name,
  id: c.id,
  market: c.market,
}));

export const TRACKED_LEAGUE_IDS: readonly number[] = TRACKED_LEAGUES.map((l) => l.id);

export function leagueLabel(id: number): string | null {
  return TRACKED_LEAGUES.find((l) => l.id === id)?.name ?? null;
}
