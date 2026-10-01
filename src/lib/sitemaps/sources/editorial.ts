// Sitemap source for the editorial section. Lists exactly the URLs its pages
// consider indexable (same thresholds as generateMetadata).

import { ROUTE_LOCALES, sectionPath, type RouteLocale } from '@/lib/routes';
import {
  NEWS_SECTIONS,
  authorLocales,
  authorPath,
  getAuthors,
  getNews,
  getGuides,
  getPieces,
  localesOf,
  piecePath,
  reportPath,
} from '@/lib/editorial/content';
import { buildMonthReport, reportMonths } from '@/lib/editorial/report';
import type { SitemapEntry, SitemapSource } from '../types';

const nonEmpty = (ls: readonly RouteLocale[]) => (ls.length ? ls : undefined);

async function entries(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];

  // Indexes (noindex while empty, so listed only when they hold pieces).
  const guideLocales = ROUTE_LOCALES.filter((l) => getGuides(l).length > 0);
  if (guideLocales.length) out.push({ path: (l) => sectionPath('guides', l), locales: guideLocales });
  const newsLocales = ROUTE_LOCALES.filter((l) => getNews(l).length > 0);
  if (newsLocales.length) {
    out.push({ path: (l) => sectionPath('news', l), locales: newsLocales });
    for (const s of NEWS_SECTIONS) {
      const ls = ROUTE_LOCALES.filter((l) => getNews(l).some((n) => n.section === s));
      if (ls.length) out.push({ path: (l) => sectionPath('news', l, s), locales: ls });
    }
  }
  out.push({ path: (l) => sectionPath('author', l) });
  out.push({ path: (l) => sectionPath('report', l) });

  // One entry per translation group.
  const seen = new Set<string>();
  for (const p of getPieces()) {
    const key = `${p.kind}:${p.translationKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const group = getPieces().filter((x) => x.kind === p.kind && x.translationKey === p.translationKey);
    out.push({
      path: (l) => piecePath(group.find((x) => x.locale === l) ?? p, l),
      locales: nonEmpty(localesOf(p)),
      lastmod: group.map((x) => x.updated).sort().at(-1),
    });
  }

  // Authors: only locales where they have pieces.
  for (const a of getAuthors()) {
    const ls = authorLocales(a.slug);
    if (ls.length) out.push({ path: (l) => authorPath(l, a.slug), locales: ls });
  }

  // Monthly reports that pass the indexing threshold. A failed data call just
  // leaves that month out for this run.
  for (const m of reportMonths()) {
    try {
      if ((await buildMonthReport(m)).indexable) out.push({ path: (l) => reportPath(l, m) });
    } catch {
      /* omit */
    }
  }
  return out;
}

export const editorialSitemap: SitemapSource[] = [{ name: 'editorial', entries }];
