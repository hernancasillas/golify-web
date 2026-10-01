// Copy fragments per hub country that need grammar the plain country name
// does not carry (Portuguese articles, "the United States", the zone a
// country's kickoffs are quoted in).

import { HUB_COUNTRIES, type HubCountry, type RouteLocale } from '@/lib/routes';
import { HUB_COUNTRY_INFO } from '@/lib/timezones';

/** "en Colombia" / "na Colômbia" / "in Colombia". */
export const IN_COUNTRY: Record<HubCountry, Record<RouteLocale, string>> = {
  mx: { es: 'en México', pt: 'no México', en: 'in Mexico' },
  co: { es: 'en Colombia', pt: 'na Colômbia', en: 'in Colombia' },
  ar: { es: 'en Argentina', pt: 'na Argentina', en: 'in Argentina' },
  cl: { es: 'en Chile', pt: 'no Chile', en: 'in Chile' },
  pe: { es: 'en Perú', pt: 'no Peru', en: 'in Peru' },
  ec: { es: 'en Ecuador', pt: 'no Equador', en: 'in Ecuador' },
  us: { es: 'en Estados Unidos', pt: 'nos Estados Unidos', en: 'in the United States' },
  es: { es: 'en España', pt: 'na Espanha', en: 'in Spain' },
  br: { es: 'en Brasil', pt: 'no Brasil', en: 'in Brazil' },
};

/** Same as IN_COUNTRY, shortened where the full name pushes a title past
 *  60 characters. */
export function titleIn(cc: HubCountry, locale: RouteLocale): string {
  if (cc === 'us') return { es: 'en EE. UU.', pt: 'nos EUA', en: 'in the US' }[locale];
  return IN_COUNTRY[cc][locale];
}

/** The clock the hub quotes: "hora de Colombia" / "horário da Colômbia". */
export const COUNTRY_CLOCK: Record<HubCountry, Record<RouteLocale, string>> = {
  mx: { es: 'hora del centro de México', pt: 'horário da Cidade do México', en: 'Mexico City time' },
  co: { es: 'hora de Colombia', pt: 'horário da Colômbia', en: 'Colombia time' },
  ar: { es: 'hora de Argentina', pt: 'horário da Argentina', en: 'Argentina time' },
  cl: { es: 'hora de Chile', pt: 'horário do Chile', en: 'Chile time' },
  pe: { es: 'hora de Perú', pt: 'horário do Peru', en: 'Peru time' },
  ec: { es: 'hora de Ecuador', pt: 'horário do Equador', en: 'Ecuador time' },
  us: { es: 'hora del Este y del Pacífico de EE. UU.', pt: 'horário da costa leste e oeste dos EUA', en: 'US Eastern and Pacific time' },
  es: { es: 'hora peninsular de España', pt: 'horário da Espanha', en: 'Spain (mainland) time' },
  br: { es: 'hora de Brasilia', pt: 'horário de Brasília', en: 'Brasília time' },
};

/** Zones a hub prints kickoffs in. Only the US needs two (plan: ET + PT). */
export function hubZones(cc: HubCountry): { zone: string; short?: string }[] {
  if (cc === 'us') {
    return [
      { zone: 'America/New_York', short: 'ET' },
      { zone: 'America/Los_Angeles', short: 'PT' },
    ];
  }
  return [{ zone: HUB_COUNTRY_INFO[cc].zone }];
}

export function countryName(cc: HubCountry, locale: RouteLocale): string {
  const n = HUB_COUNTRY_INFO[cc].name[locale];
  // HUB_COUNTRY_INFO carries "the United States" for running copy; a chip or
  // a title wants the bare name.
  return n.replace(/^the /, '');
}

export { HUB_COUNTRIES };
