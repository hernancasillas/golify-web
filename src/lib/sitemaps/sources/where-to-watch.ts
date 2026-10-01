// Sitemap source for the where-to-watch section. Owned by that section: it must list
// exactly the URLs its pages consider indexable (same threshold).
//
// Threshold (plan A4 "Dónde ver"): a verified rights entry. Country pages are
// listed for every verified (league, country) pair, a league page once it has
// one verified country, and the hub once any guide exists. Static data only:
// no API calls.

import type { SitemapEntry, SitemapSource } from '../types';
import { sectionPath, whereToWatchPath } from '@/lib/routes';
import { latestChecked, verifiedCombos, watchCountrySlug } from '@/components/watch/data/watch';

async function entries(): Promise<SitemapEntry[]> {
  const combos = verifiedCombos();
  if (combos.length === 0) return [];
  const out: SitemapEntry[] = [];
  const leagueLastmod = new Map<number, string>();
  for (const { league, country, entries: rights } of combos) {
    const checked = latestChecked(rights) ?? undefined;
    const slug = watchCountrySlug(country);
    out.push({ path: (l) => whereToWatchPath(l, league.id, slug)!, lastmod: checked });
    if (checked && (leagueLastmod.get(league.id) ?? '') < checked) leagueLastmod.set(league.id, checked);
    else if (!leagueLastmod.has(league.id)) leagueLastmod.set(league.id, '');
  }
  for (const [id, lastmod] of leagueLastmod) {
    out.push({ path: (l) => whereToWatchPath(l, id)!, lastmod: lastmod || undefined });
  }
  const newest = [...leagueLastmod.values()].sort().at(-1);
  out.push({ path: (l) => sectionPath('whereToWatch', l), lastmod: newest || undefined });
  return out;
}

export const whereToWatchSitemap: SitemapSource[] = [{ name: 'donde-ver', entries }];
