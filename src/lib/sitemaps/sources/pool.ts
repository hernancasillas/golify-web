// Sitemap source for the pool section. Owned by that section: it must list
// exactly the URLs its pages consider indexable (same threshold).
//
//   /quiniela                     always (hub, no threshold)
//   /quiniela/{liga}              when the round in progress has ≥ 50 picks
//   /quiniela/{liga}/jornada-{n}  the round in progress and the next one,
//                                 each when it has ≥ 50 picks
//
// Same calls (and so the same cache entries) as the pages. Strict: a failed
// lookup throws, so a regeneration keeps the previous good sitemap instead of
// publishing one with the leagues missing.

import { INDEX_THRESHOLD, loadPoolLeague, loadRoundFixtures, siblingRound, totalPicks } from '@/components/pool/data';
import type { Fixture } from '@/lib/api-football';
import { getPickSplits } from '@/lib/community';
import { COMPETITIONS } from '@/lib/competitions';
import { poolPath, sectionPath } from '@/lib/routes';
import type { SitemapEntry, SitemapSource } from '../types';

async function entries(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [{ path: (l) => sectionPath('pool', l) }];
  // No community data source configured → nothing can pass the threshold.
  if (!process.env.SUPABASE_URL) return out;

  type Candidate = { leagueId: number; round: number | null; fixtures: Fixture[] };
  const perLeague = await Promise.all(
    COMPETITIONS.map(async (comp): Promise<Candidate[]> => {
      const data = await loadPoolLeague(comp);
      if (!data?.currentRaw) return [];
      const currentFixtures = await loadRoundFixtures(comp.id, data.season, data.currentRaw);
      const list: Candidate[] = [{ leagueId: comp.id, round: null, fixtures: currentFixtures }];
      if (data.current) {
        list.push({ leagueId: comp.id, round: data.current.n, fixtures: currentFixtures });
        const nextN = data.current.n + 1;
        const nextFixtures = await loadRoundFixtures(comp.id, data.season, siblingRound(data.current.raw, nextN));
        if (nextFixtures.length > 0) list.push({ leagueId: comp.id, round: nextN, fixtures: nextFixtures });
      }
      return list;
    }),
  );
  const candidates = perLeague.flat();

  const ids = [...new Set(candidates.flatMap((c) => c.fixtures.map((f) => f.fixture.id)))];
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 300) chunks.push(ids.slice(i, i + 300));
  const splits = new Map((await Promise.all(chunks.map((c) => getPickSplits(c)))).flatMap((m) => [...m]));

  for (const c of candidates) {
    if (totalPicks(splits, c.fixtures) < INDEX_THRESHOLD) continue;
    const { leagueId, round } = c;
    out.push({ path: (l) => poolPath(l, leagueId, round ?? undefined)! });
  }
  return out;
}

export const poolSitemap: SitemapSource[] = [{ name: 'quinielas', entries }];
