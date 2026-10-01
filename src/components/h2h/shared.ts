// Helpers shared by the head-to-head, stadium and referee templates. Server
// only by convention (they import the API client).
//
// These three templates are "derived" pages: none of them has an endpoint of
// its own that returns the facts we print. Everything here is computed from
// fixture lists and fixture events, so the helpers also carry the rules that
// keep the derived numbers honest (which matches count, how a shootout is
// scored, which events are goals).

import {
  apiFootballGet,
  fixturePhase,
  type Fixture,
  type FixtureDetail,
} from '@/lib/api-football';
import { competitionById, competitionName, parseRound, roundLabel, roundWord } from '@/lib/competitions';
import { ROUTE_LOCALES, type HubCountry, type RouteLocale } from '@/lib/routes';
import { HUB_COUNTRY_INFO, KICKOFF_ZONES, intlLocale } from '@/lib/timezones';

export type L = RouteLocale;

export function asLocale(v: string): L {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as L) : 'es';
}

/** Read once per render. A helper rather than `Date.now()` inline so the
 *  render functions stay pure in the linter's eyes; ISR pages are rendered
 *  at regeneration time, which is exactly the "now" we want. */
export function nowMs(): number {
  return Date.now();
}

/** A finished match with a final score (the only kind that enters a stat). */
export function isPlayed(f: Fixture): boolean {
  return fixturePhase(f) === 'finished' && f.goals.home != null && f.goals.away != null;
}

export function isUpcoming(f: Fixture, now: number): boolean {
  return fixturePhase(f) === 'scheduled' && new Date(f.fixture.date).getTime() > now - 3 * 3600 * 1000;
}

/** Club friendlies (and pre-season trophies with "Friendlies" in the name)
 *  are not part of an official record. */
export function isFriendly(f: Fixture): boolean {
  return /friendl/i.test(f.league.name) || /friendl/i.test(f.league.round);
}

export function goalsFor(f: Fixture, teamId: number): number {
  return (f.teams.home.id === teamId ? f.goals.home : f.goals.away) ?? 0;
}

export function goalsAgainst(f: Fixture, teamId: number): number {
  return (f.teams.home.id === teamId ? f.goals.away : f.goals.home) ?? 0;
}

/** Result for `teamId` over 90/120 minutes. A shootout is a draw here, the
 *  usual statistical convention: penalties decide a tie, not a match. */
export function resultFor(f: Fixture, teamId: number): 'w' | 'd' | 'l' {
  const d = goalsFor(f, teamId) - goalsAgainst(f, teamId);
  return d > 0 ? 'w' : d < 0 ? 'l' : 'd';
}

const FRIENDLY: Record<L, string> = { es: 'Amistoso', pt: 'Amistoso', en: 'Friendly' };

/** Competition name as we print it: our registry label when we cover it,
 *  the provider's otherwise. */
export function leagueText(f: Fixture, locale: L): string {
  if (isFriendly(f)) return FRIENDLY[locale];
  const c = competitionById(f.league.id);
  return c ? competitionName(c, locale) : f.league.name;
}

/** "Apertura · Jornada 9", "Cuartos de final", "" for friendlies. */
export function roundText(f: Fixture, locale: L): string {
  if (isFriendly(f) || !f.league.round) return '';
  const c = competitionById(f.league.id);
  const r = parseRound(f.league.round);
  // Argentina names its rounds "1st Phase - 7" / "2nd Phase - 15", which the
  // shared parser does not know yet: print them as a numbered round.
  const phased = /^\d(?:st|nd|rd|th) Phase\s*-\s*(\d+)$/i.exec(r.stage);
  const label = phased ? `${roundWord(c, locale)} ${phased[1]}` : roundLabel(f.league.round, locale, c);
  if (!r.phase) return label;
  const phase = r.phase === 'apertura' ? 'Apertura' : 'Clausura';
  return `${phase} · ${label}`;
}

/** "2-2", "1-1 (4-3 pen.)", "2-1 (pró.)". */
export function scoreText(f: Fixture, locale: L): string {
  if (f.goals.home == null || f.goals.away == null) return '';
  const base = `${f.goals.home}-${f.goals.away}`;
  const s = f.fixture.status.short;
  if (s === 'PEN' && f.score?.penalty.home != null && f.score.penalty.away != null) {
    return `${base} (${f.score.penalty.home}-${f.score.penalty.away} ${locale === 'en' ? 'pens' : 'pen.'})`;
  }
  if (s === 'AET') return `${base} (${locale === 'en' ? 'a.e.t.' : locale === 'pt' ? 'prorr.' : 't. extra'})`;
  return base;
}

// ---- Time zones -------------------------------------------------------------

/** The kickoff zone people associate with a market ("hora de México (CDMX)"). */
export function marketZone(country: HubCountry): { zone: string; label: Record<L, string> } {
  const row = KICKOFF_ZONES.find((z) => z.country === country);
  return row ? { zone: row.zone, label: row.label } : { zone: HUB_COUNTRY_INFO[country].zone, label: HUB_COUNTRY_INFO[country].name };
}

/** Zone to date a match in: the market of its competition when we cover one
 *  that belongs to a country, else the reader's main market for the locale.
 *  Only used for calendar dates of past matches, where a few hours of offset
 *  matter only around midnight. */
export function zoneForLeague(leagueId: number, locale: L): { zone: string; label: Record<L, string> } {
  const c = competitionById(leagueId);
  // A domestic league is played in its first market; cups span several.
  const country = c && c.kind === 'league' ? c.countries[0] : undefined;
  if (country) return marketZone(country);
  return marketZone(locale === 'pt' ? 'br' : locale === 'en' ? 'us' : 'mx');
}

// API-Football country names → our hub markets. Only countries with a single
// kickoff zone we print are listed; anything else falls back to UTC.
const COUNTRY_TO_HUB: Record<string, HubCountry> = {
  Mexico: 'mx',
  Colombia: 'co',
  Argentina: 'ar',
  Chile: 'cl',
  Peru: 'pe',
  Ecuador: 'ec',
  Spain: 'es',
  Brazil: 'br',
};

export function hubForCountry(country: string | null | undefined): HubCountry | null {
  return country ? COUNTRY_TO_HUB[country] ?? null : null;
}

const COUNTRY_NAMES: Record<string, Record<L, string>> = {
  Mexico: { es: 'México', pt: 'México', en: 'Mexico' },
  Colombia: { es: 'Colombia', pt: 'Colômbia', en: 'Colombia' },
  Argentina: { es: 'Argentina', pt: 'Argentina', en: 'Argentina' },
  Chile: { es: 'Chile', pt: 'Chile', en: 'Chile' },
  Peru: { es: 'Perú', pt: 'Peru', en: 'Peru' },
  Ecuador: { es: 'Ecuador', pt: 'Equador', en: 'Ecuador' },
  Spain: { es: 'España', pt: 'Espanha', en: 'Spain' },
  Brazil: { es: 'Brasil', pt: 'Brasil', en: 'Brazil' },
  USA: { es: 'Estados Unidos', pt: 'Estados Unidos', en: 'United States' },
  England: { es: 'Inglaterra', pt: 'Inglaterra', en: 'England' },
  Italy: { es: 'Italia', pt: 'Itália', en: 'Italy' },
  Germany: { es: 'Alemania', pt: 'Alemanha', en: 'Germany' },
  France: { es: 'Francia', pt: 'França', en: 'France' },
  Portugal: { es: 'Portugal', pt: 'Portugal', en: 'Portugal' },
  Uruguay: { es: 'Uruguay', pt: 'Uruguai', en: 'Uruguay' },
  Paraguay: { es: 'Paraguay', pt: 'Paraguai', en: 'Paraguay' },
  'Saudi-Arabia': { es: 'Arabia Saudita', pt: 'Arábia Saudita', en: 'Saudi Arabia' },
};

export function countryText(country: string | null | undefined, locale: L): string {
  if (!country) return '';
  return COUNTRY_NAMES[country]?.[locale] ?? country.replace(/-/g, ' ');
}

// ---- Formatting -------------------------------------------------------------

export function dateText(iso: string, zone: string, locale: L): string {
  return new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: zone,
  });
}

export function yearIn(iso: string, zone: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', timeZone: zone });
}

export function num(n: number, locale: L, digits = 0): string {
  return n.toLocaleString(intlLocale(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** First title that fits Google's ~60-character window (the " | Golify"
 *  suffix is added by pageMetadata and not counted here). */
export function fitTitle(candidates: string[], max = 60): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}

// ---- Batched fixture details ------------------------------------------------

/** Events/statistics for up to 20 fixtures in ONE request (`ids=a-b-c`).
 *  Finished matches do not change, so this is cached for a week. A failure
 *  returns [] and the block that needed it is simply not rendered — never
 *  shown as "no goals" or "no cards". */
export async function getFixtureDetails(ids: number[], opts: { strict?: boolean } = {}): Promise<FixtureDetail[]> {
  const list = [...new Set(ids)].slice(0, 20);
  if (list.length === 0) return [];
  const rows = await apiFootballGet<FixtureDetail>(
    '/fixtures',
    { ids: list.join('-') },
    { revalidate: 86400 * 7, strict: opts.strict },
  );
  return rows.map((f) => ({ ...f, events: f.events ?? [], statistics: f.statistics ?? [], lineups: f.lineups ?? [], players: f.players ?? [] }));
}

/** Shootout kicks are logged as events too; they are not match goals. */
export function isShootoutEvent(e: { comments: string | null; time: { elapsed: number } }): boolean {
  return /shootout/i.test(e.comments ?? '');
}
