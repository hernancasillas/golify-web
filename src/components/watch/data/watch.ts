// "Dónde ver" data: verified broadcast rights (src/data/broadcasters.ts, never
// guessed) + the league's upcoming fixtures for the local kickoff table.

import { broadcastsFor, WATCH_COUNTRY_SLUGS, type BroadcastEntry } from '@/data/broadcasters';
import { apiFootballGet, currentSeason, getLeagueInfoCached, type Fixture } from '@/lib/api-football';
import { COMPETITIONS, type Competition } from '@/lib/competitions';
import { HUB_COUNTRIES, type HubCountry, type RouteLocale } from '@/lib/routes';
import { HUB_COUNTRY_INFO, KICKOFF_ZONES, intlLocale, type ZoneRow } from '@/lib/timezones';

/** Verified rights only (broadcastsFor already drops unverified rows). */
export function verifiedBroadcasts(leagueId: number, country?: HubCountry): BroadcastEntry[] {
  return broadcastsFor(leagueId, country);
}

/** Countries with verified rights for a league, in hub order. */
export function verifiedCountries(leagueId: number): HubCountry[] {
  const have = new Set(verifiedBroadcasts(leagueId).map((b) => b.country));
  return HUB_COUNTRIES.filter((c) => have.has(c));
}

/** Every verified (league, country) pair among published competitions. */
export function verifiedCombos(): { league: Competition; country: HubCountry; entries: BroadcastEntry[] }[] {
  const out: { league: Competition; country: HubCountry; entries: BroadcastEntry[] }[] = [];
  for (const league of COMPETITIONS) {
    for (const country of verifiedCountries(league.id)) {
      out.push({ league, country, entries: verifiedBroadcasts(league.id, country) });
    }
  }
  return out;
}

export function watchCountrySlug(c: HubCountry): string {
  return WATCH_COUNTRY_SLUGS[c];
}

/** Zones a country's kickoff column(s) use: two for the US (ET/PT). */
export function zonesFor(country: HubCountry): ZoneRow[] {
  return KICKOFF_ZONES.filter((z) => z.country === country);
}

/** Most recent `checked` date among entries (YYYY-MM-DD). */
export function latestChecked(entries: BroadcastEntry[]): string | null {
  return entries.map((e) => e.checked).sort().at(-1) ?? null;
}

// One hour: kickoff times move when a round is rescheduled, and the list is
// one call shared by every country page of the league (same URL → same cache
// entry), so it stays cheap however many pages read it.
const FIXTURES_TTL = 3600;

export async function upcomingLeagueFixtures(c: Competition, n = 12): Promise<{ season: number; fixtures: Fixture[] }> {
  const info = await getLeagueInfoCached(c.id, { strict: true });
  // A covered competition exists upstream; null is a provider hiccup.
  if (!info) throw new Error(`watch: league ${c.id} lookup returned nothing`);
  const season = currentSeason(info);
  if (!season) throw new Error(`watch: league ${c.id} has no season`);
  const fixtures = await apiFootballGet<Fixture>(
    '/fixtures',
    { league: c.id, season, next: n },
    { revalidate: FIXTURES_TTL, strict: true },
  );
  fixtures.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  return { season, fixtures };
}

// ---- Copy helpers ---------------------------------------------------------

/** "en México" / "no México" / "in Mexico": Portuguese needs the article. */
const PT_IN: Record<HubCountry, string> = {
  mx: 'no México',
  co: 'na Colômbia',
  ar: 'na Argentina',
  cl: 'no Chile',
  pe: 'no Peru',
  ec: 'no Equador',
  us: 'nos Estados Unidos',
  es: 'na Espanha',
  br: 'no Brasil',
};

export function inCountry(c: HubCountry, locale: RouteLocale): string {
  if (locale === 'pt') return PT_IN[c];
  return `${locale === 'en' ? 'in' : 'en'} ${HUB_COUNTRY_INFO[c].name[locale]}`;
}

export function countryName(c: HubCountry, locale: RouteLocale): string {
  const n = HUB_COUNTRY_INFO[c].name[locale];
  // "the United States" reads right inside a sentence, not as a label.
  return n.replace(/^the /, '');
}

/** "1 de octubre de 2026" from a YYYY-MM-DD research date. */
export function checkedDate(ymd: string, locale: RouteLocale): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(+d)) return ymd;
  return d.toLocaleDateString(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function listJoin(items: string[], locale: RouteLocale): string {
  try {
    return new Intl.ListFormat(intlLocale(locale), { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

const KIND: Record<BroadcastEntry['channels'][number]['kind'], Record<RouteLocale, string>> = {
  tv: { es: 'TV', pt: 'TV', en: 'TV' },
  streaming: { es: 'streaming', pt: 'streaming', en: 'streaming' },
  'tv+streaming': { es: 'TV y streaming', pt: 'TV e streaming', en: 'TV and streaming' },
};

export function kindLabel(kind: BroadcastEntry['channels'][number]['kind'], locale: RouteLocale): string {
  return KIND[kind][locale];
}

/** "TUDN (TV), ViX (streaming)" — every channel of the verified entries. */
export function channelSummary(entries: BroadcastEntry[], locale: RouteLocale): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const e of entries) {
    for (const ch of e.channels) {
      if (seen.has(ch.name)) continue;
      seen.add(ch.name);
      parts.push(`${ch.name} (${kindLabel(ch.kind, locale)})`);
    }
  }
  return listJoin(parts, locale);
}

export function streamingChannels(entries: BroadcastEntry[]): string[] {
  const out = new Set<string>();
  for (const e of entries) for (const ch of e.channels) if (ch.kind !== 'tv') out.add(ch.name);
  return [...out];
}

export function seasonsOf(entries: BroadcastEntry[]): string[] {
  return [...new Set(entries.map((e) => e.season))];
}

/** Kickoff columns for a league page: its home markets, else the big three. */
export function leagueZones(c: Competition): ZoneRow[] {
  const countries: HubCountry[] = c.countries.length > 0 ? c.countries : ['mx', 'us', 'co'];
  const zones = KICKOFF_ZONES.filter((z) => countries.includes(z.country));
  return zones.slice(0, 4);
}
