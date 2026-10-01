// Sitemap source for the transfers section. Owned by that section: it must list
// exactly the URLs its pages consider indexable (same threshold).
//
// Threshold: a league page needs INDEX_THRESHOLD moves in its window, so the
// source builds each window with the same function the page uses. Every call
// it makes is one the page makes too (same URL, same daily TTL), so on a warm
// cache this costs nothing; on a cold one the leagues run one after another
// to stay gentle on the quota shared with the app. A failed lookup throws and
// the sitemap keeps its previous good copy.

import type { SitemapEntry, SitemapSource } from '../types';
import { COMPETITIONS } from '@/lib/competitions';
import { sectionPath, transfersPath } from '@/lib/routes';
import { INDEX_THRESHOLD, getLeagueWindow, hasTransfersPage } from '@/components/watch/data/transfers';

async function entries(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  let newest = '';
  for (const c of COMPETITIONS.filter(hasTransfersPage)) {
    const w = await getLeagueWindow(c);
    if (w.rows.length < INDEX_THRESHOLD) continue;
    // Rows are newest first: the last real content change is the latest move.
    const lastmod = w.rows[0]?.date;
    if (lastmod && lastmod > newest) newest = lastmod;
    out.push({ path: (l) => transfersPath(l, c.id)!, lastmod });
  }
  out.unshift({ path: (l) => sectionPath('transfers', l), lastmod: newest || undefined });
  return out;
}

export const transfersSitemap: SitemapSource[] = [{ name: 'fichajes', entries }];
