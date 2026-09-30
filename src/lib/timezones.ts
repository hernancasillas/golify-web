// Kickoff times per country, rendered on the server into the HTML (plan A1.4).
// Every "a qué hora juega X" query is local, so each match page carries a
// table with the time in each market we serve — computed from the fixed IANA
// zone, not from the visitor, so the crawler reads the right values too.

import type { RouteLocale } from './routes';
import type { HubCountry } from './routes';

export interface ZoneRow {
  key: string;
  zone: string;
  country: HubCountry;
  /** Row label per locale ("México (CDMX)"). */
  label: Record<RouteLocale, string>;
}

export const KICKOFF_ZONES: ZoneRow[] = [
  { key: 'mx', country: 'mx', zone: 'America/Mexico_City', label: { es: 'México (CDMX)', pt: 'México (CDMX)', en: 'Mexico (CDMX)' } },
  { key: 'co', country: 'co', zone: 'America/Bogota', label: { es: 'Colombia', pt: 'Colômbia', en: 'Colombia' } },
  { key: 'ar', country: 'ar', zone: 'America/Argentina/Buenos_Aires', label: { es: 'Argentina', pt: 'Argentina', en: 'Argentina' } },
  { key: 'cl', country: 'cl', zone: 'America/Santiago', label: { es: 'Chile', pt: 'Chile', en: 'Chile' } },
  { key: 'pe', country: 'pe', zone: 'America/Lima', label: { es: 'Perú', pt: 'Peru', en: 'Peru' } },
  { key: 'ec', country: 'ec', zone: 'America/Guayaquil', label: { es: 'Ecuador', pt: 'Equador', en: 'Ecuador' } },
  { key: 'us-et', country: 'us', zone: 'America/New_York', label: { es: 'EE. UU. (Este)', pt: 'EUA (Leste)', en: 'USA (Eastern)' } },
  { key: 'us-pt', country: 'us', zone: 'America/Los_Angeles', label: { es: 'EE. UU. (Pacífico)', pt: 'EUA (Pacífico)', en: 'USA (Pacific)' } },
  { key: 'es', country: 'es', zone: 'Europe/Madrid', label: { es: 'España', pt: 'Espanha', en: 'Spain' } },
  { key: 'br', country: 'br', zone: 'America/Sao_Paulo', label: { es: 'Brasil (Brasilia)', pt: 'Brasil (Brasília)', en: 'Brazil (Brasília)' } },
];

export interface HubCountryInfo {
  code: HubCountry;
  zone: string;
  /** Country name per locale, as used in "Partidos de hoy en {name}". */
  name: Record<RouteLocale, string>;
  /** Preposition-ready demonym for copy ("hora de Colombia"). */
  flag: string;
  /** The UI locale people in this country read. */
  locale: RouteLocale;
}

export const HUB_COUNTRY_INFO: Record<HubCountry, HubCountryInfo> = {
  mx: { code: 'mx', zone: 'America/Mexico_City', flag: '🇲🇽', locale: 'es', name: { es: 'México', pt: 'México', en: 'Mexico' } },
  co: { code: 'co', zone: 'America/Bogota', flag: '🇨🇴', locale: 'es', name: { es: 'Colombia', pt: 'Colômbia', en: 'Colombia' } },
  ar: { code: 'ar', zone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', locale: 'es', name: { es: 'Argentina', pt: 'Argentina', en: 'Argentina' } },
  cl: { code: 'cl', zone: 'America/Santiago', flag: '🇨🇱', locale: 'es', name: { es: 'Chile', pt: 'Chile', en: 'Chile' } },
  pe: { code: 'pe', zone: 'America/Lima', flag: '🇵🇪', locale: 'es', name: { es: 'Perú', pt: 'Peru', en: 'Peru' } },
  ec: { code: 'ec', zone: 'America/Guayaquil', flag: '🇪🇨', locale: 'es', name: { es: 'Ecuador', pt: 'Equador', en: 'Ecuador' } },
  us: { code: 'us', zone: 'America/New_York', flag: '🇺🇸', locale: 'es', name: { es: 'Estados Unidos', pt: 'Estados Unidos', en: 'the United States' } },
  es: { code: 'es', zone: 'Europe/Madrid', flag: '🇪🇸', locale: 'es', name: { es: 'España', pt: 'Espanha', en: 'Spain' } },
  br: { code: 'br', zone: 'America/Sao_Paulo', flag: '🇧🇷', locale: 'pt', name: { es: 'Brasil', pt: 'Brasil', en: 'Brazil' } },
};

const INTL_LOCALE: Record<RouteLocale, string> = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' };

export function intlLocale(locale: RouteLocale): string {
  return INTL_LOCALE[locale];
}

/** "19:00" in the given zone. */
export function timeIn(iso: string, zone: string, locale: RouteLocale): string {
  return new Date(iso).toLocaleTimeString(INTL_LOCALE[locale], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: zone,
  });
}

/** "sáb 4 oct" in the given zone. */
export function shortDateIn(iso: string, zone: string, locale: RouteLocale): string {
  return new Date(iso).toLocaleDateString(INTL_LOCALE[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: zone,
  });
}

/** "sábado, 4 de octubre de 2026" in the given zone. */
export function longDateIn(iso: string, zone: string, locale: RouteLocale): string {
  return new Date(iso).toLocaleDateString(INTL_LOCALE[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zone,
  });
}

/** YYYY-MM-DD of an instant in the given zone (for "today in Colombia"). */
export function isoDateIn(date: Date, zone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return date.toLocaleDateString('en-CA', { timeZone: zone });
}

/** Kickoff table rows for a match (plan A1.4 country list). */
export function kickoffRows(iso: string, locale: RouteLocale) {
  return KICKOFF_ZONES.map((z) => ({
    key: z.key,
    country: z.country,
    label: z.label[locale],
    time: timeIn(iso, z.zone, locale),
    date: shortDateIn(iso, z.zone, locale),
  }));
}
