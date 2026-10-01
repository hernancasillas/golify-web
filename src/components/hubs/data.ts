// Data layer shared by the daily boards (/partidos-de-hoy, the country hubs,
// the date archive and /en-vivo). Server-only by convention.
//
// Quota rule for every board: ONE API-Football call per render. `/fixtures?
// date=` covers the whole day worldwide and `/fixtures?live=all` every live
// match, so nothing here ever fans out per league or per match.

import { apiFootballGet, fixturePhase, type Fixture } from '@/lib/api-football';
import {
  COMPETITIONS,
  competitionById,
  competitionsForCountry,
  type Competition,
} from '@/lib/competitions';
import type { HubCountry, RouteLocale } from '@/lib/routes';

export type BoardPhase = ReturnType<typeof fixturePhase>;

export interface CompetitionGroup {
  competition: Competition;
  fixtures: Fixture[];
}

/** `next build` prerenders the static boards (/today, /live). A strict fetch
 *  that throws there would fail the whole build because the data provider
 *  hiccuped; at build time an empty board is the lesser evil, and it is
 *  replaced within one revalidate window. At runtime the boards stay strict:
 *  a failed call throws and Next keeps serving the last good copy. */
export function strictAtRuntime(): boolean {
  return process.env.NEXT_PHASE !== 'phase-production-build';
}

/** Registry order with the given country's competitions first (plan: "las
 *  competiciones del país primero, luego el resto"). */
export function competitionOrder(country?: HubCountry): number[] {
  if (!country) return COMPETITIONS.map((c) => c.id);
  const first = competitionsForCountry(country).map((c) => c.id);
  const set = new Set(first);
  return [...first, ...COMPETITIONS.map((c) => c.id).filter((id) => !set.has(id))];
}

function sortByOrder(rows: Fixture[], order: readonly number[]): Fixture[] {
  const pos = new Map(order.map((id, i) => [id, i]));
  return rows
    .filter((f) => pos.has(f.league.id))
    .sort(
      (a, b) =>
        pos.get(a.league.id)! - pos.get(b.league.id)! ||
        a.fixture.date.localeCompare(b.fixture.date) ||
        a.fixture.id - b.fixture.id,
    );
}

/** Fixtures of one calendar day, with the day's boundaries in `zone`.
 *  Same request the named `getFixturesByDate` makes, but the cache window
 *  is the caller's: a finished day does not need a 5-minute TTL. */
export async function fixturesOfDay(
  date: string,
  zone: string,
  order: readonly number[],
  opts: { revalidate: number; strict: boolean },
): Promise<Fixture[]> {
  const rows = await apiFootballGet<Fixture>(
    '/fixtures',
    { date, timezone: zone },
    { revalidate: opts.revalidate, strict: opts.strict },
  );
  return sortByOrder(rows, order);
}

/** Every covered match being played right now. Same request (and so the
 *  same cache entry) as `getLiveFixtures`, plus `strict`. */
export async function liveFixtures(order: readonly number[], strict: boolean): Promise<Fixture[]> {
  const rows = await apiFootballGet<Fixture>('/fixtures', { live: 'all' }, { revalidate: 15, strict });
  return sortByOrder(rows, order);
}

export function groupByCompetition(fixtures: Fixture[]): CompetitionGroup[] {
  const groups = new Map<number, CompetitionGroup>();
  for (const f of fixtures) {
    const c = competitionById(f.league.id);
    if (!c) continue;
    const g = groups.get(c.id);
    if (g) g.fixtures.push(f);
    else groups.set(c.id, { competition: c, fixtures: [f] });
  }
  return [...groups.values()];
}

export interface BoardCounts {
  all: number;
  live: number;
  scheduled: number;
  finished: number;
  off: number;
}

export function countPhases(fixtures: Fixture[]): BoardCounts {
  const c: BoardCounts = { all: fixtures.length, live: 0, scheduled: 0, finished: 0, off: 0 };
  for (const f of fixtures) c[fixturePhase(f)]++;
  return c;
}

// ---- Calendar arithmetic on YYYY-MM-DD strings ----------------------------
// Dates are handled as plain calendar days (noon UTC anchors), so no zone or
// DST transition can shift a day by one.

export const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date in canonical YYYY-MM-DD form, or null. */
export function parseIsoDate(v: string): string | null {
  const m = ISO_DATE.exec(v);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  if (Number.isNaN(+d)) return null;
  const back = d.toISOString().slice(0, 10);
  return back === v ? v : null;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((+new Date(`${to}T12:00:00Z`) - +new Date(`${from}T12:00:00Z`)) / 86_400_000);
}

const INTL: Record<RouteLocale, string> = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' };

/** Labels for a calendar day (not an instant): "mié 30", "miércoles, 30 de
 *  septiembre de 2026". */
export function dayLabel(
  iso: string,
  locale: RouteLocale,
  style: 'tab' | 'long' | 'medium',
): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (style === 'tab') {
    const wd = d.toLocaleDateString(INTL[locale], { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
    return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${d.getUTCDate()}`;
  }
  if (style === 'medium') {
    return d.toLocaleDateString(INTL[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return d.toLocaleDateString(INTL[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "GMT-5" for a zone at a given instant (DST-aware). */
export function zoneOffset(zone: string, at: Date = new Date()): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? '';
}

/** Zone used for a board that is not tied to one country: the day is counted
 *  in the main market of each language (stated on the page). */
export const LOCALE_ZONE: Record<RouteLocale, { zone: string; label: Record<RouteLocale, string> }> = {
  es: {
    zone: 'America/Mexico_City',
    label: { es: 'hora del centro de México', pt: 'horário da Cidade do México', en: 'Mexico City time' },
  },
  pt: {
    zone: 'America/Sao_Paulo',
    label: { es: 'hora de Brasilia', pt: 'horário de Brasília', en: 'Brasília time' },
  },
  en: {
    zone: 'America/New_York',
    label: { es: 'hora del Este de EE. UU.', pt: 'horário da costa leste dos EUA', en: 'US Eastern time' },
  },
};
