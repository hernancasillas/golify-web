// API-Football gives nationality and birth country as English names
// ("Mexico", "Norway"). A Spanish page that says "Nacionalidad: Mexico" reads
// as machine output, so the names we know are mapped to ISO codes and printed
// through Intl.DisplayNames in the page's language. Anything not in the table
// is shown as the provider wrote it — never guessed.

import type { RouteLocale } from '@/lib/routes';
import { intlLocale } from '@/lib/timezones';

const ISO: Record<string, string> = {
  Albania: 'AL', Algeria: 'DZ', Angola: 'AO', Argentina: 'AR', Armenia: 'AM', Australia: 'AU',
  Austria: 'AT', Belgium: 'BE', Bolivia: 'BO', 'Bosnia and Herzegovina': 'BA', 'Bosnia & Herzegovina': 'BA',
  Brazil: 'BR', Bulgaria: 'BG', 'Burkina Faso': 'BF', Cameroon: 'CM', Canada: 'CA', 'Cape Verde': 'CV',
  'Cape Verde Islands': 'CV', Chile: 'CL', China: 'CN', 'China PR': 'CN', Colombia: 'CO', 'Congo DR': 'CD',
  'DR Congo': 'CD', Congo: 'CG', 'Costa Rica': 'CR', Croatia: 'HR', Cuba: 'CU', 'Curaçao': 'CW', Curacao: 'CW',
  Cyprus: 'CY', 'Czech Republic': 'CZ', Czechia: 'CZ', Denmark: 'DK', 'Dominican Republic': 'DO', Ecuador: 'EC',
  Egypt: 'EG', 'El Salvador': 'SV', 'Equatorial Guinea': 'GQ', Estonia: 'EE', Finland: 'FI', France: 'FR',
  Gabon: 'GA', Gambia: 'GM', Georgia: 'GE', Germany: 'DE', Ghana: 'GH', Greece: 'GR', Guatemala: 'GT',
  Guinea: 'GN', 'Guinea-Bissau': 'GW', Haiti: 'HT', Honduras: 'HN', Hungary: 'HU', Iceland: 'IS', India: 'IN',
  Iran: 'IR', 'IR Iran': 'IR', Iraq: 'IQ', Ireland: 'IE', 'Republic of Ireland': 'IE', Israel: 'IL', Italy: 'IT',
  'Ivory Coast': 'CI', "Côte d'Ivoire": 'CI', "Cote D'Ivoire": 'CI', Jamaica: 'JM', Japan: 'JP', Jordan: 'JO',
  Kazakhstan: 'KZ', Kenya: 'KE', Kosovo: 'XK', 'South Korea': 'KR', 'Korea Republic': 'KR', Latvia: 'LV',
  Lithuania: 'LT', Luxembourg: 'LU', Mali: 'ML', Malta: 'MT', Mexico: 'MX', Moldova: 'MD', Montenegro: 'ME',
  Morocco: 'MA', Mozambique: 'MZ', Netherlands: 'NL', 'New Zealand': 'NZ', Nicaragua: 'NI', Nigeria: 'NG',
  'North Macedonia': 'MK', Norway: 'NO', Panama: 'PA', Paraguay: 'PY', Peru: 'PE', Philippines: 'PH',
  Poland: 'PL', Portugal: 'PT', Qatar: 'QA', Romania: 'RO', Russia: 'RU', 'Saudi Arabia': 'SA', Senegal: 'SN',
  Serbia: 'RS', 'Sierra Leone': 'SL', Slovakia: 'SK', Slovenia: 'SI', 'South Africa': 'ZA', Spain: 'ES',
  Suriname: 'SR', Sweden: 'SE', Switzerland: 'CH', Syria: 'SY', Togo: 'TG', 'Trinidad and Tobago': 'TT',
  Tunisia: 'TN', Turkey: 'TR', 'Türkiye': 'TR', Ukraine: 'UA', 'United Arab Emirates': 'AE', USA: 'US',
  'United States': 'US', Uruguay: 'UY', Uzbekistan: 'UZ', Venezuela: 'VE', Zambia: 'ZM', Zimbabwe: 'ZW',
};

// Home nations are not ISO regions, so Intl has no name for them.
const HOME_NATIONS: Record<string, Record<RouteLocale, string>> = {
  England: { es: 'Inglaterra', pt: 'Inglaterra', en: 'England' },
  Scotland: { es: 'Escocia', pt: 'Escócia', en: 'Scotland' },
  Wales: { es: 'Gales', pt: 'País de Gales', en: 'Wales' },
  'Northern Ireland': { es: 'Irlanda del Norte', pt: 'Irlanda do Norte', en: 'Northern Ireland' },
};

const displayNames = new Map<RouteLocale, Intl.DisplayNames>();

function names(locale: RouteLocale): Intl.DisplayNames | null {
  try {
    let d = displayNames.get(locale);
    if (!d) {
      d = new Intl.DisplayNames([intlLocale(locale)], { type: 'region' });
      displayNames.set(locale, d);
    }
    return d;
  } catch {
    return null;
  }
}

export function countryName(raw: string | null | undefined, locale: RouteLocale): string | null {
  if (!raw) return null;
  const home = HOME_NATIONS[raw];
  if (home) return home[locale];
  const code = ISO[raw];
  if (!code) return raw;
  return names(locale)?.of(code) ?? raw;
}

/** Same country under two spellings ("USA" / "United States")? */
export function sameCountry(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const ca = ISO[a];
  const cb = ISO[b];
  return !!ca && ca === cb;
}
