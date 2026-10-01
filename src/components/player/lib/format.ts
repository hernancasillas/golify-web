import type { Competition } from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';
import { intlLocale } from '@/lib/timezones';

export function num(v: number, locale: RouteLocale, digits = 0): string {
  return v.toLocaleString(intlLocale(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Provider heights come as "167" or "167 cm". */
export function heightMeters(raw: string | null | undefined): number | null {
  const m = raw ? /(\d{3})/.exec(raw) : null;
  if (!m) return null;
  const cm = Number(m[1]);
  return cm >= 140 && cm <= 220 ? cm / 100 : null;
}

export function heightText(raw: string | null | undefined, locale: RouteLocale): string | null {
  const m = heightMeters(raw);
  return m == null ? null : `${num(m, locale, 2)} m`;
}

export function weightKg(raw: string | null | undefined): number | null {
  const m = raw ? /(\d{2,3})/.exec(raw) : null;
  if (!m) return null;
  const kg = Number(m[1]);
  return kg >= 40 && kg <= 130 ? kg : null;
}

export function weightText(raw: string | null | undefined, locale: RouteLocale): string | null {
  const kg = weightKg(raw);
  return kg == null ? null : `${num(kg, locale)} kg`;
}

/** "27 de septiembre de 1999" from a calendar date (no timezone shift). */
export function calendarDate(isoDay: string, locale: RouteLocale, style: 'long' | 'short' = 'long'): string {
  const d = new Date(`${isoDay.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(+d)) return isoDay;
  return d.toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function year(isoDay: string | null): string | null {
  return isoDay ? isoDay.slice(0, 4) : null;
}

function spans(c: Competition): boolean {
  return c.format === 'cross' || (c.format === 'split' && c.clausuraOffset === 1);
}

/** How people name an API season: Premier League "2026/27", Liga MX
 *  (Apertura 2026 + Clausura 2027) "2026/27", Brasileirão "2026".
 *
 *  `played` = the covered competitions the season's numbers come from. The
 *  split label is only honest when every one of them spans two years: a Liga
 *  MX player's API 2026 also holds the Concacaf Champions Cup played in
 *  February 2026, so "2026/27" would mislabel those games and the plain API
 *  year is used instead. With no games, the club's league decides. */
export function seasonText(season: number, club: Competition | null, played: (Competition | null)[] = []): string {
  const known = played.filter((c): c is Competition => !!c);
  const span = known.length ? known.every(spans) : !!club && spans(club);
  return span ? `${season}/${String(season + 1).slice(2)}` : String(season);
}

export function per90(count: number, minutes: number, locale: RouteLocale): string | null {
  if (minutes < 90) return null;
  return num((count * 90) / minutes, locale, 2);
}
