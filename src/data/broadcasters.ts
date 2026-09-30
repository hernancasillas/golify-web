// Where to watch — TV / streaming rights per competition and country.
//
// Plan A4 "Dónde ver": a page is indexable only with VERIFIED data. We never
// guess a channel: every entry cites the source it was checked against, and
// only entries with `verified: true` are shown as fact. Rights change every
// season, so `checked` is the date someone last confirmed it; entries older
// than a season should be re-checked before they are trusted.
//
// Country keys match the hub countries in routes.ts.

import type { HubCountry } from '@/lib/routes';

export interface BroadcastEntry {
  leagueId: number;
  country: HubCountry;
  /** Channel or platform names as the viewer knows them ("TUDN", "ViX Premium"). */
  channels: { name: string; kind: 'tv' | 'streaming' | 'tv+streaming'; note?: string }[];
  /** Season the rights apply to, human form ("Apertura 2026", "2026/27"). */
  season: string;
  /** Primary source (league/broadcaster announcement) it was checked against. */
  source: { title: string; url: string };
  /** YYYY-MM-DD */
  checked: string;
  verified: boolean;
}

/** Filled by the rights research (see plan A4). Empty = nothing published. */
export const BROADCASTS: BroadcastEntry[] = [];

/** URL slugs for the country segment of /donde-ver/{liga}/{pais}. */
export const WATCH_COUNTRY_SLUGS: Record<HubCountry, string> = {
  mx: 'mexico',
  co: 'colombia',
  ar: 'argentina',
  cl: 'chile',
  pe: 'peru',
  ec: 'ecuador',
  us: 'usa',
  es: 'espana',
  br: 'brasil',
};

export function countryFromWatchSlug(slug: string): HubCountry | null {
  const hit = (Object.entries(WATCH_COUNTRY_SLUGS) as [HubCountry, string][]).find(([, s]) => s === slug);
  return hit ? hit[0] : null;
}

export function broadcastsFor(leagueId: number, country?: HubCountry): BroadcastEntry[] {
  return BROADCASTS.filter(
    (b) => b.verified && b.leagueId === leagueId && (country === undefined || b.country === country),
  );
}
