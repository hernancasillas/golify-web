// Sitemap source for the downloads section. Owned by that section: it must list
// exactly the URLs its pages consider indexable (same threshold).

import type { SitemapEntry, SitemapSource } from '../types';
import { downloadCatalog } from '@/lib/downloads/catalog';
import {
  CHECKLIST_SLUG,
  KIT_SLUG,
  bracketSlug,
  calendarSlug,
  downloadPath,
  downloadsIndexPath,
  posterSlug,
  quinielaSlug,
} from '@/lib/downloads/slugs';
import { loadStickers } from '@/lib/downloads/data';

async function entries(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [
    { path: (l) => downloadsIndexPath(l) },
    { path: (l) => downloadPath(l, KIT_SLUG) },
  ];
  try {
    if ((await loadStickers()).length) out.push({ path: (l) => downloadPath(l, CHECKLIST_SLUG) });
  } catch {
    // Catalogue unreadable → the checklist page is noindex, so it is left out.
  }
  for (const lg of await downloadCatalog()) {
    const id = lg.competition.id;
    const ss = lg.season.seasonSlug;
    for (const n of lg.rounds) out.push({ path: (l) => downloadPath(l, quinielaSlug(l, id, n)!) });
    const p = posterSlug(id, ss);
    if (lg.poster && p) out.push({ path: (l) => downloadPath(l, p) });
    const b = bracketSlug(id, ss);
    if (lg.bracket && b) out.push({ path: (l) => downloadPath(l, b) });
    for (const t of lg.teams) out.push({ path: (l) => downloadPath(l, calendarSlug(l, t, ss)) });
  }
  return out;
}

export const downloadsSitemap: SitemapSource[] = [{ name: 'descargas', entries }];
