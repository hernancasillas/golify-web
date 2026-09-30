// A sitemap entry is one page in every locale it exists in. The sitemap
// writer (src/app/sitemaps/[file]/route.ts) expands it to one <url> per
// locale with reciprocal xhtml:link hreflang alternates + x-default.
//
// Rule (plan A2): only indexable URLs — 200, self-canonical, not noindex.
// A source must apply the same threshold its page applies.

import type { RouteLocale } from '@/lib/routes';

export interface SitemapEntry {
  /** Path of this page in a given locale (as routes.ts builds it). */
  path: (l: RouteLocale) => string;
  /** Locales the page exists in. Defaults to all three. */
  locales?: readonly RouteLocale[];
  /** Real last content change, ISO. Omit when unknown (never "now"). */
  lastmod?: string;
}

/** A named child sitemap contributed by one section of the site. */
export interface SitemapSource {
  /** File name without extension, e.g. "fichajes" → /sitemaps/fichajes.xml */
  name: string;
  entries: () => Promise<SitemapEntry[]>;
}
