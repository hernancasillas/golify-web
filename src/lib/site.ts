// Central site config — single source of truth for URLs, store links, locales.
// Used by metadata, JSON-LD, sitemap, robots, install CTAs.

export const SITE_URL = 'https://golify.futbol';
export const SITE_NAME = 'Golify';

export const IOS_APP_ID = '6772339872';
export const ANDROID_PACKAGE = 'com.goligulias.fuchibol';

export const APP_STORE_URL = `https://apps.apple.com/app/id${IOS_APP_ID}`;
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

// API-Football World Cup identifiers.
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

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
