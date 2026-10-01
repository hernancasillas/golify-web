// Labels for EA FC catalog codes.
//
// Position ids: EA's own table (0 GK … 27 LW). Checked against the catalog
// rather than taken from the app's FC_POSITIONS map, which is off for several
// codes: Garrincha is stored as [23, 12] (RW, RM), Iniesta as [14, 18, 27]
// (CM, CAM, LW), Maldini as [5, 7] (CB, LB) — only EA's table reads those
// right.

import type { RouteLocale } from '@/lib/routes';
import { intlLocale } from '@/lib/timezones';

const POS: Record<number, Record<RouteLocale, string>> = {
  0: { es: 'Portero', pt: 'Goleiro', en: 'Goalkeeper' },
  1: { es: 'Líbero', pt: 'Líbero', en: 'Sweeper' },
  2: { es: 'Carrilero derecho', pt: 'Ala direito', en: 'Right wing-back' },
  3: { es: 'Lateral derecho', pt: 'Lateral direito', en: 'Right-back' },
  4: { es: 'Central derecho', pt: 'Zagueiro (direita)', en: 'Right centre-back' },
  5: { es: 'Defensa central', pt: 'Zagueiro', en: 'Centre-back' },
  6: { es: 'Central izquierdo', pt: 'Zagueiro (esquerda)', en: 'Left centre-back' },
  7: { es: 'Lateral izquierdo', pt: 'Lateral esquerdo', en: 'Left-back' },
  8: { es: 'Carrilero izquierdo', pt: 'Ala esquerdo', en: 'Left wing-back' },
  9: { es: 'Mediocentro defensivo', pt: 'Volante', en: 'Defensive midfielder' },
  10: { es: 'Mediocentro defensivo', pt: 'Volante', en: 'Defensive midfielder' },
  11: { es: 'Mediocentro defensivo', pt: 'Volante', en: 'Defensive midfielder' },
  12: { es: 'Interior derecho', pt: 'Meia direita', en: 'Right midfielder' },
  13: { es: 'Mediocentro', pt: 'Meio-campista', en: 'Central midfielder' },
  14: { es: 'Mediocentro', pt: 'Meio-campista', en: 'Central midfielder' },
  15: { es: 'Mediocentro', pt: 'Meio-campista', en: 'Central midfielder' },
  16: { es: 'Interior izquierdo', pt: 'Meia esquerda', en: 'Left midfielder' },
  17: { es: 'Mediapunta', pt: 'Meia ofensivo', en: 'Attacking midfielder' },
  18: { es: 'Mediapunta', pt: 'Meia ofensivo', en: 'Attacking midfielder' },
  19: { es: 'Mediapunta', pt: 'Meia ofensivo', en: 'Attacking midfielder' },
  20: { es: 'Segundo delantero', pt: 'Segundo atacante', en: 'Forward' },
  21: { es: 'Segundo delantero', pt: 'Segundo atacante', en: 'Centre forward' },
  22: { es: 'Segundo delantero', pt: 'Segundo atacante', en: 'Forward' },
  23: { es: 'Extremo derecho', pt: 'Ponta direita', en: 'Right winger' },
  24: { es: 'Delantero centro', pt: 'Centroavante', en: 'Striker' },
  25: { es: 'Delantero centro', pt: 'Centroavante', en: 'Striker' },
  26: { es: 'Delantero centro', pt: 'Centroavante', en: 'Striker' },
  27: { es: 'Extremo izquierdo', pt: 'Ponta esquerda', en: 'Left winger' },
};

// The in-game abbreviations as EA prints them in English, which is how
// players search ("mbappe ST rating").
const EN_CODE: Record<number, string> = {
  0: 'GK', 1: 'SW', 2: 'RWB', 3: 'RB', 4: 'CB', 5: 'CB', 6: 'CB', 7: 'LB', 8: 'LWB',
  9: 'CDM', 10: 'CDM', 11: 'CDM', 12: 'RM', 13: 'CM', 14: 'CM', 15: 'CM', 16: 'LM',
  17: 'CAM', 18: 'CAM', 19: 'CAM', 20: 'CF', 21: 'CF', 22: 'CF', 23: 'RW', 24: 'ST',
  25: 'ST', 26: 'ST', 27: 'LW',
};

export function positionCode(id: number | null | undefined): string | null {
  if (id == null || id < 0) return null;
  return EN_CODE[id] ?? null;
}

export function positionName(id: number | null | undefined, locale: RouteLocale): string | null {
  if (id == null || id < 0) return null;
  return POS[id]?.[locale] ?? null;
}

/** Distinct positions in the order EA lists them (primary first). */
export function positionList(ids: number[] | null | undefined): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const id of ids ?? []) {
    const c = positionCode(id);
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(id);
  }
  return out;
}

// EA writes nationalities in English. Mapped to ISO 3166 codes so the
// browser's own Intl data can name them in the page's language; anything not
// listed is shown as EA spells it rather than guessed.
const ISO: Record<string, string> = {
  Argentina: 'AR', Brazil: 'BR', Mexico: 'MX', Colombia: 'CO', Chile: 'CL', Peru: 'PE', Ecuador: 'EC',
  Uruguay: 'UY', Paraguay: 'PY', Bolivia: 'BO', Venezuela: 'VE', 'United States': 'US', Canada: 'CA',
  'Costa Rica': 'CR', Honduras: 'HN', Panama: 'PA', Jamaica: 'JM', 'El Salvador': 'SV', Guatemala: 'GT',
  Spain: 'ES', Portugal: 'PT', France: 'FR', Germany: 'DE', Italy: 'IT', England: 'GB-ENG', Scotland: 'GB-SCT',
  Wales: 'GB-WLS', 'Northern Ireland': 'GB-NIR', 'Republic of Ireland': 'IE', Netherlands: 'NL', Holland: 'NL',
  Belgium: 'BE', Croatia: 'HR', Serbia: 'RS', Switzerland: 'CH', Austria: 'AT', Poland: 'PL', Denmark: 'DK',
  Sweden: 'SE', Norway: 'NO', Finland: 'FI', Iceland: 'IS', 'Czech Republic': 'CZ', Czechia: 'CZ', Slovakia: 'SK',
  Slovenia: 'SI', Hungary: 'HU', Romania: 'RO', Bulgaria: 'BG', Greece: 'GR', Turkey: 'TR', Türkiye: 'TR',
  Ukraine: 'UA', Russia: 'RU', Georgia: 'GE', Albania: 'AL', 'Bosnia and Herzegovina': 'BA', Montenegro: 'ME',
  'North Macedonia': 'MK', Kosovo: 'XK', Morocco: 'MA', Algeria: 'DZ', Tunisia: 'TN', Egypt: 'EG', Senegal: 'SN',
  Nigeria: 'NG', Ghana: 'GH', Cameroon: 'CM', "Côte d'Ivoire": 'CI', 'Ivory Coast': 'CI', Mali: 'ML',
  'Guinea': 'GN', 'South Africa': 'ZA', 'DR Congo': 'CD', 'Congo DR': 'CD', Japan: 'JP', 'Korea Republic': 'KR',
  'South Korea': 'KR', Australia: 'AU', 'Saudi Arabia': 'SA', Iran: 'IR', Qatar: 'QA', 'New Zealand': 'NZ',
  China: 'CN', 'China PR': 'CN', Israel: 'IL', Armenia: 'AM', Cuba: 'CU', 'Dominican Republic': 'DO',
  'Haiti': 'HT', 'Cape Verde': 'CV', 'Cabo Verde': 'CV', Gabon: 'GA', 'Burkina Faso': 'BF', Angola: 'AO',
};

// Home nations have no ISO-2 region: named by hand.
const UK_NATIONS: Record<string, Record<RouteLocale, string>> = {
  'GB-ENG': { es: 'Inglaterra', pt: 'Inglaterra', en: 'England' },
  'GB-SCT': { es: 'Escocia', pt: 'Escócia', en: 'Scotland' },
  'GB-WLS': { es: 'Gales', pt: 'País de Gales', en: 'Wales' },
  'GB-NIR': { es: 'Irlanda del Norte', pt: 'Irlanda do Norte', en: 'Northern Ireland' },
};

export function nationalityLabel(name: string | null | undefined, locale: RouteLocale): string | null {
  if (!name) return null;
  const code = ISO[name];
  if (!code) return name;
  if (UK_NATIONS[code]) return UK_NATIONS[code][locale];
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(code) ?? name;
  } catch {
    return name;
  }
}

export function eurCompact(n: number | null | undefined, locale: RouteLocale): string | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}
