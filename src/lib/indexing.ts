// Which pages Google may index (AdSense "contenido de poco valor", oct 2026).
//
// Google knew ~55k URLs of golify.futbol and indexed 106: the site read as
// pages generated in bulk from the same data every score site has. The index
// is now limited to pages with something of their own or real demand. Pages
// outside these rules still render for visitors (noindex, follow) and stay
// out of the sitemaps. Pages and sitemap sources both read these rules, so
// the sitemap never lists a noindex URL.

import { COMPETITIONS } from '@/lib/competitions';
import { HUB_COUNTRY_INFO } from '@/lib/timezones';
import type { HubCountry, RouteLocale } from '@/lib/routes';

const DAY = 86_400_000;

/** Match pages: from 7 days before kickoff to 14 days after it. Previews of
 *  far-off fixtures have nothing yet; old reports have no demand left. The
 *  2026 World Cup archive is indexed whole (decided by the caller). */
export const MATCH_INDEX_DAYS = { before: 7, after: 14 } as const;

export function matchInIndexWindow(kickoffIso: string, now = Date.now()): boolean {
  const k = Date.parse(kickoffIso);
  return k <= now + MATCH_INDEX_DAYS.before * DAY && k >= now - MATCH_INDEX_DAYS.after * DAY;
}

/** Date archive: today and the next 7 days (offset in days from today). */
export function dateIndexable(offset: number): boolean {
  return offset >= 0 && offset <= 7;
}

/** Team pages: clubs of the core domestic leagues, never youth sides. */
export const TEAM_INDEX_LEAGUES = new Set(COMPETITIONS.filter((c) => c.kind === 'league' && c.tier === 'core').map((c) => c.id));

const YOUTH = /\b(?:U|Sub|Sub-)\s?-?(?:1[5-9]|2[0-3])\b/i;

export function teamIndexable(name: string, currentLeagueIds: readonly number[]): boolean {
  return !YOUTH.test(name) && currentLeagueIds.some((id) => TEAM_INDEX_LEAGUES.has(id));
}

/** Country boards ("partidos de hoy en Perú"): only in the country's own
 *  language (plus English for the US). The other variants differ only in
 *  copy language and would compete with the canonical audience's page. */
export function hubLocales(cc: HubCountry): RouteLocale[] {
  const own = HUB_COUNTRY_INFO[cc].locale;
  return cc === 'us' && own !== 'en' ? [own, 'en'] : [own];
}

export function hubIndexable(locale: RouteLocale, cc: HubCountry): boolean {
  return hubLocales(cc).includes(locale);
}
