// What the downloads index and the sitemap list: per featured league, the
// current and next round quiniela, the season poster, the bracket when it has
// data, and calendars for the top of the table of the domestic leagues.
// Same loaders and thresholds as the pages, so nothing listed is noindex.
//
// Quota: per league = league info + season fixtures + current round + one
// standings call (+ previous season fixtures, daily TTL, for a projected
// bracket). All long-lived cache entries shared with the league pages.

import { cache } from 'react';
import type { TeamRef } from '@/lib/api-football';
import { isCovered, type Competition } from '@/lib/competitions';
import { loadBracket, loadCurrentSeason, loadTable, type LeagueSeason } from './data';

/** Plan B3 lead-magnet table: the six quiniela leagues, in market order. */
export const FEATURED_LEAGUES = [262, 239, 128, 71, 2, 13] as const;
/** Domestic leagues whose top teams get a calendar download. */
const CALENDAR_LEAGUES = new Set([262, 71, 128, 239]);
const TOP_TEAMS = 6;

export interface CatalogLeague {
  competition: Competition;
  season: LeagueSeason;
  rounds: number[];
  poster: boolean;
  bracket: boolean;
  teams: TeamRef[];
}

export const downloadCatalog = cache(async (): Promise<CatalogLeague[]> => {
  const ids = FEATURED_LEAGUES.filter(isCovered);
  const results = await Promise.allSettled(
    ids.map(async (id): Promise<CatalogLeague | null> => {
      const season = await loadCurrentSeason(id);
      if (!season) return null;
      const rounds = [season.currentRound, season.nextRound].filter((n): n is number => n != null && (season.rounds.get(n)?.length ?? 0) > 0);
      const table = await loadTable(season);
      const poster = season.phaseFixtures.length > 0 && table.some((g) => g.rows.length > 0);
      const bracket = !!(await loadBracket(season)).bracket;
      const teams =
        CALENDAR_LEAGUES.has(id) && table.length === 1
          ? [...table[0].rows].sort((a, b) => a.rank - b.rank).slice(0, TOP_TEAMS).map((r) => r.team)
          : [];
      return { competition: season.competition, season, rounds, poster, bracket, teams };
    }),
  );
  const ok = results.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []));
  const failed = results.filter((r) => r.status === 'rejected');
  for (const f of failed) console.error('[downloads] catalog league failed', (f as PromiseRejectedResult).reason);
  // Every league failing is a provider outage, not an empty catalogue.
  if (failed.length && failed.length === results.length && process.env.NEXT_PHASE !== 'phase-production-build') throw new Error('downloads catalog: provider unavailable');
  return ok;
});
