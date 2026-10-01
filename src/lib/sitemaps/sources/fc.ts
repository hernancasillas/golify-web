// Sitemap source for the fc section. Owned by that section: it must list
// exactly the URLs its pages consider indexable (same threshold).
//
// EA FC rating pages with overall >= 75, one per footballer (the best-rated
// card of a slug, which is the variant the page itself indexes), bounded at
// FC_SITEMAP_MAX. The writer expands each entry to three locale URLs, so the
// list is split into three files of at most 1,666 entries (<= 5,000 URLs per
// file, plan A2). One query feeds all three: memoised for a few minutes.

import type { SitemapEntry, SitemapSource } from '../types';
import { fcPath, sectionPath } from '@/lib/routes';
import { FC_SITEMAP_MAX, getSitemapPlayers } from '@/components/watch/data/fc';

const PER_FILE = 1666;
const FILES = Math.ceil(FC_SITEMAP_MAX / PER_FILE);
const MEMO_MS = 10 * 60 * 1000;

type Row = Awaited<ReturnType<typeof getSitemapPlayers>>[number];
let memo: { at: number; rows: Promise<Row[]> } | null = null;

function rows(): Promise<Row[]> {
  if (!memo || Date.now() - memo.at > MEMO_MS) {
    const p = getSitemapPlayers();
    memo = { at: Date.now(), rows: p };
    // A failure must not stick for the memo window.
    p.catch(() => {
      if (memo?.rows === p) memo = null;
    });
  }
  return memo.rows;
}

function chunk(n: number): SitemapSource {
  return {
    name: `fc-${n + 1}`,
    entries: async () => {
      const all = await rows();
      const out: SitemapEntry[] = all.slice(n * PER_FILE, (n + 1) * PER_FILE).map((p) => ({
        path: (l) => fcPath(l, p),
        lastmod: p.updated_at ? p.updated_at.slice(0, 10) : undefined,
      }));
      if (n === 0) out.unshift({ path: (l) => sectionPath('fc', l) });
      return out;
    },
  };
}

export const fcSitemap: SitemapSource[] = Array.from({ length: FILES }, (_, i) => chunk(i));
