// Metadata + structured-data helpers shared by every template.
//
// `pageMetadata` is the one way a page declares its title, description,
// canonical, hreflang and robots. It exists so three rules hold everywhere:
//   1. Titles end in " | Golify" with the space (plan A1.3).
//   2. Canonical is self-referencing and hreflang is reciprocal across the
//      locales that actually exist for the page, plus x-default.
//   3. A page below its indexing threshold says `noindex, follow` — it keeps
//      passing link equity but stays out of the index (plan A4).

import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, IOS_APP_ID, ogImages } from './site';
import { ROUTE_LOCALES, type RouteLocale } from './routes';

export type Locale = RouteLocale;

const OG_LOCALE: Record<Locale, string> = { es: 'es_MX', pt: 'pt_BR', en: 'en_US' };
const DEFAULT: Locale = 'es';

export function brandTitle(title: string): string {
  const t = title.replace(/\s*\|\s*Golify\s*$/i, '').trim();
  return `${t} | ${SITE_NAME}`;
}

export function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Canonical + hreflang for a page whose path differs per locale. */
export function localizedAlternates(
  locale: Locale,
  pathFor: (l: Locale) => string,
  locales: readonly Locale[] = ROUTE_LOCALES,
) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = absolute(pathFor(l));
  const xDefault = locales.includes(DEFAULT) ? DEFAULT : locales[0];
  languages['x-default'] = absolute(pathFor(xDefault));
  return { canonical: absolute(pathFor(locale)), languages };
}

export interface PageMetaInput {
  locale: Locale;
  /** Builds this page's path in any locale (e.g. l => matchPath(l, f)). */
  path: (l: Locale) => string;
  title: string;
  description: string;
  /** Below the template's indexing threshold → noindex, follow. */
  noindex?: boolean;
  /** Locales this page exists in (editorial pieces may be one-language). */
  locales?: readonly Locale[];
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  type?: 'website' | 'article' | 'profile';
  /** In-app route for the iOS smart banner (e.g. `match/123`). */
  appRoute?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function pageMetadata(i: PageMetaInput): Metadata {
  const title = brandTitle(i.title);
  const url = absolute(i.path(i.locale));
  const images = i.images?.length ? i.images : ogImages();
  const locales = i.locales ?? ROUTE_LOCALES;

  return {
    title: { absolute: title },
    description: i.description,
    alternates: localizedAlternates(i.locale, i.path, locales),
    robots: i.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description: i.description,
      url,
      siteName: SITE_NAME,
      type: i.type ?? 'website',
      locale: OG_LOCALE[i.locale],
      images,
      ...(i.type === 'article'
        ? { publishedTime: i.publishedTime, modifiedTime: i.modifiedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: i.description,
      images: images.map((im) => im.url),
    },
    other: {
      'apple-itunes-app': i.appRoute
        ? `app-id=${IOS_APP_ID}, app-argument=golify://${i.appRoute}`
        : `app-id=${IOS_APP_ID}`,
    },
  };
}

// ---- JSON-LD -------------------------------------------------------------

export type JsonLdNode = Record<string, unknown>;

/** Serializes JSON-LD for a <script> tag. `<` is escaped so a name coming
 *  from the data provider can never close the script element. */
export function jsonLdString(data: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export interface Crumb {
  name: string;
  /** Absent on the last crumb (the current page). */
  path?: string;
}

export function breadcrumbNode(crumbs: Crumb[], currentPath: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.name,
      item: absolute(c.path ?? currentPath),
    })),
  };
}

export function faqNode(entries: [question: string, answer: string][], pagePath: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absolute(pagePath)}#faq`,
    mainEntity: entries.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export const ORGANIZATION_REF = { '@id': `${SITE_URL}/#organization` };
