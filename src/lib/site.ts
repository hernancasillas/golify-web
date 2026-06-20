// Central site config — single source of truth for URLs, store links, locales.
// Used by metadata, JSON-LD, sitemap, robots, install CTAs.

export const SITE_URL = 'https://golify.futbol';
export const SITE_NAME = 'Golify';

export const IOS_APP_ID = '6772339872';
export const ANDROID_PACKAGE = 'com.goligulias.fuchibol';

export const APP_STORE_URL = `https://apps.apple.com/app/id${IOS_APP_ID}`;
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

// Official social profiles — feed Organization `sameAs` so Google/AI engines
// consolidate the "Golify" brand entity onto golify.futbol (not lookalikes).
export const INSTAGRAM_URL = 'https://www.instagram.com/golify.futbol';
export const TIKTOK_URL = 'https://www.tiktok.com/@golify.futbol';
export const SAME_AS = [
  INSTAGRAM_URL,
  TIKTOK_URL,
  APP_STORE_URL,
  PLAY_STORE_URL,
];

// Brand logo (absolute) for Organization/WebSite JSON-LD.
export const LOGO_URL = `${SITE_URL}/icon1.png`;

// Brand-first tagline used in metadata + structured data.
export const SITE_TAGLINE_ES =
  'Golify — fútbol en vivo, retas, quinielas y álbum de stickers en México.';

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

// API-Football World Cup identifiers.
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

// FIFA World Cup 2026 — single source of truth for structured data shared by
// the tournament hub and every match page (match superEvent links here by @id).
export const WORLD_CUP_EVENT = {
  id: `${SITE_URL}/#worldcup2026`,
  name: 'FIFA World Cup 2026',
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  hosts: ['United States', 'Canada', 'Mexico'] as const,
  organizer: { name: 'FIFA', url: 'https://www.fifa.com' },
};

// schema.org Place[] for the three host countries.
export const WORLD_CUP_LOCATION = WORLD_CUP_EVENT.hosts.map((name) => ({
  '@type': 'Country',
  name,
}));

// The full tournament SportsEvent node, reused as the canonical hub event and
// as the `superEvent` reference on match pages so both share one @id.
export function worldCupEventNode(url: string) {
  return {
    '@type': 'SportsEvent',
    '@id': WORLD_CUP_EVENT.id,
    name: WORLD_CUP_EVENT.name,
    sport: 'Soccer',
    startDate: WORLD_CUP_EVENT.startDate,
    endDate: WORLD_CUP_EVENT.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    location: WORLD_CUP_LOCATION,
    organizer: {
      '@type': 'Organization',
      name: WORLD_CUP_EVENT.organizer.name,
      url: WORLD_CUP_EVENT.organizer.url,
    },
    url,
  };
}

// Smart install link — points at our own redirect funnel page, which detects
// platform and opens the right store while tracking the share source.
// `path` is the in-app deeplink target (e.g. `match/123`), `src` is attribution.
export function installLink(path: string, src?: string): string {
  const qs = src ? `?src=${encodeURIComponent(src)}` : '';
  return `${SITE_URL}/go/${path}${qs}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Per-locale canonical + hreflang alternates for a localized route.
// `subpath` is the path AFTER the locale segment (e.g. '' for home,
// '/stickers' for /es/stickers). Canonical self-references the current
// locale; languages map every locale + x-default (the default locale).
export function localeAlternates(locale: Locale, subpath = '') {
  const sub = subpath && !subpath.startsWith('/') ? `/${subpath}` : subpath;
  const languages: Record<string, string> = {
    'x-default': `${SITE_URL}/${DEFAULT_LOCALE}${sub}`,
  };
  for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}${sub}`;
  return {
    canonical: `${SITE_URL}/${locale}${sub}`,
    languages,
  };
}
