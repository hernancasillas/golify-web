// XML writers for the sitemap index and its children. Hand-written instead of
// MetadataRoute.Sitemap because we need a sitemap *index* plus many children
// with per-file caching, which the metadata convention does not model.

import { SITE_URL } from '@/lib/site';
import { ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';
import type { SitemapEntry } from './types';

/** Google's limit is 50k, but every <url> here carries 4 xhtml:link
 *  alternates; 5000 keeps each file small enough to fetch and debug. */
export const MAX_URLS_PER_FILE = 5000;

const X_DEFAULT: RouteLocale = 'es';

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const abs = (path: string) => xmlEscape(`${SITE_URL}${path}`);

/** How many <url> rows an entry expands to (one per locale). */
export function urlCount(e: SitemapEntry): number {
  return (e.locales ?? ROUTE_LOCALES).length;
}

/** Split entries into files of at most MAX_URLS_PER_FILE <url> rows. An
 *  entry never straddles two files, so its hreflang cluster stays together. */
export function paginate(entries: SitemapEntry[]): SitemapEntry[][] {
  const pages: SitemapEntry[][] = [[]];
  let n = 0;
  for (const e of entries) {
    const c = urlCount(e);
    if (n + c > MAX_URLS_PER_FILE && pages[pages.length - 1].length) {
      pages.push([]);
      n = 0;
    }
    pages[pages.length - 1].push(e);
    n += c;
  }
  return pages;
}

/** Drop entries whose locale paths were already listed (two sources can
 *  reach the same team or venue). Keyed on the es path, or the first locale. */
export function dedupe(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = e.path((e.locales ?? ROUTE_LOCALES)[0]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const rows: string[] = [];
  for (const e of entries) {
    const locales = e.locales ?? ROUTE_LOCALES;
    // Reciprocal cluster: every locale row lists every locale + x-default
    // (the Spanish page, our primary market; else the first locale).
    const def = locales.includes(X_DEFAULT) ? X_DEFAULT : locales[0];
    const alts =
      locales.length > 1
        ? [
            ...locales.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(e.path(l))}"/>`),
            `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(e.path(def))}"/>`,
          ].join('')
        : '';
    const lastmod = e.lastmod ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>` : '';
    for (const l of locales) rows.push(`<url><loc>${abs(e.path(l))}</loc>${lastmod}${alts}</url>`);
  }
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    rows.join('\n') +
    '\n</urlset>\n'
  );
}

export function indexXml(files: string[]): string {
  const rows = files.map((f) => `<sitemap><loc>${abs(`/sitemaps/${f}.xml`)}</loc></sitemap>`);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    rows.join('\n') +
    '\n</sitemapindex>\n'
  );
}

export function xmlResponse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
