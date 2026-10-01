// Which clocks a printable sheet shows. Paper cannot adapt to the reader, so
// every time printed on it names its zone (plan B3): Spanish sheets carry
// central Mexico plus the two other big Spanish-speaking markets, with the
// league's own country first; Portuguese is Brasília time; English is US
// Eastern, where most English-speaking Liga MX/MLS viewers are.

import type { Market } from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';
import { KICKOFF_ZONES, shortDateIn, timeIn, type ZoneRow } from '@/lib/timezones';

export interface PrintZone {
  key: string;
  zone: string;
  /** Column header: "CDMX", "Colombia", "Brasília", "ET". */
  short: string;
  /** Long name for the legend: "hora del centro de México (CDMX)". */
  long: string;
}

const SHORT: Record<string, Record<RouteLocale, string>> = {
  mx: { es: 'CDMX', pt: 'CDMX', en: 'CDMX' },
  co: { es: 'Colombia', pt: 'Colômbia', en: 'Colombia' },
  ar: { es: 'Argentina', pt: 'Argentina', en: 'Argentina' },
  cl: { es: 'Chile', pt: 'Chile', en: 'Chile' },
  pe: { es: 'Perú', pt: 'Peru', en: 'Peru' },
  ec: { es: 'Ecuador', pt: 'Equador', en: 'Ecuador' },
  'us-et': { es: 'EE. UU. (ET)', pt: 'EUA (ET)', en: 'ET' },
  'us-pt': { es: 'EE. UU. (PT)', pt: 'EUA (PT)', en: 'PT' },
  es: { es: 'España', pt: 'Espanha', en: 'Spain' },
  br: { es: 'Brasilia', pt: 'Brasília', en: 'Brasília' },
};

const LONG: Record<string, Record<RouteLocale, string>> = {
  mx: { es: 'hora del centro de México (CDMX)', pt: 'horário do centro do México', en: 'Central Mexico time' },
  co: { es: 'hora de Colombia', pt: 'horário da Colômbia', en: 'Colombia time' },
  ar: { es: 'hora de Argentina', pt: 'horário da Argentina', en: 'Argentina time' },
  cl: { es: 'hora de Chile', pt: 'horário do Chile', en: 'Chile time' },
  pe: { es: 'hora de Perú', pt: 'horário do Peru', en: 'Peru time' },
  ec: { es: 'hora de Ecuador', pt: 'horário do Equador', en: 'Ecuador time' },
  'us-et': { es: 'hora del Este de EE. UU.', pt: 'horário do Leste dos EUA', en: 'US Eastern Time (ET)' },
  'us-pt': { es: 'hora del Pacífico de EE. UU.', pt: 'horário do Pacífico dos EUA', en: 'US Pacific Time (PT)' },
  es: { es: 'hora de España', pt: 'horário da Espanha', en: 'Spain time' },
  br: { es: 'hora de Brasilia', pt: 'horário de Brasília', en: 'Brasília time' },
};

const MARKET_ZONE: Partial<Record<Market, string>> = {
  mx: 'mx',
  co: 'co',
  ar: 'ar',
  cl: 'cl',
  pe: 'pe',
  ec: 'ec',
  us: 'us-et',
  br: 'br',
};

function zoneRow(key: string): ZoneRow {
  const z = KICKOFF_ZONES.find((r) => r.key === key);
  if (!z) throw new Error(`zones: unknown kickoff zone ${key}`);
  return z;
}

export function printZones(locale: RouteLocale, market?: Market): PrintZone[] {
  let keys: string[];
  if (locale === 'pt') keys = ['br'];
  else if (locale === 'en') keys = ['us-et'];
  else {
    const own = market ? MARKET_ZONE[market] : undefined;
    const base = ['mx', 'co', 'ar'];
    keys = own && own !== 'br' ? [own, ...base.filter((k) => k !== own)].slice(0, 3) : base;
  }
  return keys.map((key) => {
    const z = zoneRow(key);
    return { key, zone: z.zone, short: SHORT[key][locale], long: LONG[key][locale] };
  });
}

/** "Horarios: hora del centro de México (CDMX), Colombia y Argentina." */
export function zoneLegend(zones: PrintZone[], locale: RouteLocale): string {
  const names = zones.map((z) => z.long);
  const and = locale === 'pt' ? ' e ' : locale === 'en' ? ' and ' : ' y ';
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')}${and}${names.at(-1)}` : names[0];
  const lead = locale === 'pt' ? 'Horários' : locale === 'en' ? 'Times' : 'Horarios';
  return `${lead}: ${list}.`;
}

/** Kickoff not fixed yet (API status TBD): print the date, not a fake time. */
export function isTimeTbd(status: string): boolean {
  return status === 'TBD';
}

export const TBD_LABEL: Record<RouteLocale, string> = { es: 'Por definir', pt: 'A definir', en: 'TBD' };

export function kickoffCell(iso: string, status: string, zone: PrintZone, locale: RouteLocale): string {
  return isTimeTbd(status) ? TBD_LABEL[locale] : timeIn(iso, zone.zone, locale);
}

export function dateCell(iso: string, zone: PrintZone, locale: RouteLocale): string {
  return shortDateIn(iso, zone.zone, locale);
}
