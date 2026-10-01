// National-team names in the reader's language. API-Football names
// national teams in English ("Germany") in every response; the app already
// translates them (fuchibol i18n worldCup.teams, ported here and extended
// for Nations League and friendlies opponents).
//
// Display only. Slugs stay on the provider's English name: teamSlug() maps
// any of these localized names back to English, so a link built from a
// localized fixture lands on the same canonical URL in every locale.

import type { RouteLocale } from './routes';

const ES: Record<string, string> = {
  "Mexico": "México",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  "Czech Republic": "República Checa",
  "Czechia": "República Checa",
  "Canada": "Canadá",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  "Qatar": "Catar",
  "Switzerland": "Suiza",
  "Brazil": "Brasil",
  "Morocco": "Marruecos",
  "Haiti": "Haití",
  "Scotland": "Escocia",
  "United States": "Estados Unidos",
  "USA": "Estados Unidos",
  "Paraguay": "Paraguay",
  "Australia": "Australia",
  "Turkey": "Turquía",
  "Türkiye": "Turquía",
  "Germany": "Alemania",
  "Curaçao": "Curazao",
  "Ivory Coast": "Costa de Marfil",
  "Ecuador": "Ecuador",
  "Netherlands": "Países Bajos",
  "Japan": "Japón",
  "Sweden": "Suecia",
  "Tunisia": "Túnez",
  "Belgium": "Bélgica",
  "Egypt": "Egipto",
  "Iran": "Irán",
  "New Zealand": "Nueva Zelanda",
  "Spain": "España",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",
  "Saudi Arabia": "Arabia Saudita",
  "Uruguay": "Uruguay",
  "France": "Francia",
  "Senegal": "Senegal",
  "Iraq": "Irak",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argelia",
  "Austria": "Austria",
  "Jordan": "Jordania",
  "Portugal": "Portugal",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "Uzbekistan": "Uzbekistán",
  "Colombia": "Colombia",
  "England": "Inglaterra",
  "Croatia": "Croacia",
  "Ghana": "Ghana",
  "Panama": "Panamá",
  "Serbia": "Serbia",
  "Italy": "Italia",
  "Poland": "Polonia",
  "Denmark": "Dinamarca",
  "Hungary": "Hungría",
  "Romania": "Rumania",
  "Ukraine": "Ucrania",
  "Greece": "Grecia",
  "Wales": "Gales",
  "Northern Ireland": "Irlanda del Norte",
  "Republic of Ireland": "Irlanda",
  "Ireland": "Irlanda",
  "Slovakia": "Eslovaquia",
  "Slovenia": "Eslovenia",
  "Finland": "Finlandia",
  "Iceland": "Islandia",
  "Russia": "Rusia",
  "Belarus": "Bielorrusia",
  "Georgia": "Georgia",
  "Armenia": "Armenia",
  "Azerbaijan": "Azerbaiyán",
  "Kazakhstan": "Kazajistán",
  "Bulgaria": "Bulgaria",
  "Albania": "Albania",
  "North Macedonia": "Macedonia del Norte",
  "Montenegro": "Montenegro",
  "Kosovo": "Kosovo",
  "Israel": "Israel",
  "Cyprus": "Chipre",
  "Luxembourg": "Luxemburgo",
  "Lithuania": "Lituania",
  "Latvia": "Letonia",
  "Estonia": "Estonia",
  "Moldova": "Moldavia",
  "Malta": "Malta",
  "Faroe Islands": "Islas Feroe",
  "Andorra": "Andorra",
  "San Marino": "San Marino",
  "Liechtenstein": "Liechtenstein",
  "Gibraltar": "Gibraltar",
  "Chile": "Chile",
  "Peru": "Perú",
  "Bolivia": "Bolivia",
  "Venezuela": "Venezuela",
  "Costa Rica": "Costa Rica",
  "Honduras": "Honduras",
  "El Salvador": "El Salvador",
  "Guatemala": "Guatemala",
  "Jamaica": "Jamaica",
  "Trinidad and Tobago": "Trinidad y Tobago",
  "Nicaragua": "Nicaragua",
  "Dominican Republic": "República Dominicana",
  "Cuba": "Cuba",
  "Suriname": "Surinam",
  "China": "China",
  "India": "India",
  "Thailand": "Tailandia",
  "Vietnam": "Vietnam",
  "Indonesia": "Indonesia",
  "United Arab Emirates": "Emiratos Árabes Unidos",
  "Oman": "Omán",
  "Bahrain": "Baréin",
  "Kuwait": "Kuwait",
  "Syria": "Siria",
  "Lebanon": "Líbano",
  "Palestine": "Palestina",
  "North Korea": "Corea del Norte",
  "Nigeria": "Nigeria",
  "Cameroon": "Camerún",
  "Mali": "Malí",
  "Burkina Faso": "Burkina Faso",
  "Guinea": "Guinea",
  "Zambia": "Zambia",
  "Angola": "Angola",
  "Kenya": "Kenia",
  "Uganda": "Uganda",
  "Gabon": "Gabón",
  "Benin": "Benín",
  "Libya": "Libia",
  "Equatorial Guinea": "Guinea Ecuatorial",
  "Mozambique": "Mozambique"
};

const PT: Record<string, string> = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Czech Republic": "República Tcheca",
  "Czechia": "República Tcheca",
  "Canada": "Canadá",
  "Bosnia & Herzegovina": "Bósnia e Herzegovina",
  "Qatar": "Catar",
  "Switzerland": "Suíça",
  "Brazil": "Brasil",
  "Morocco": "Marrocos",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "United States": "Estados Unidos",
  "USA": "Estados Unidos",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Turkey": "Turquia",
  "Türkiye": "Turquia",
  "Germany": "Alemanha",
  "Curaçao": "Curaçao",
  "Ivory Coast": "Costa do Marfim",
  "Ecuador": "Equador",
  "Netherlands": "Países Baixos",
  "Japan": "Japão",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Ghana": "Gana",
  "Panama": "Panamá",
  "Serbia": "Sérvia",
  "Italy": "Itália",
  "Poland": "Polônia",
  "Denmark": "Dinamarca",
  "Hungary": "Hungria",
  "Romania": "Romênia",
  "Ukraine": "Ucrânia",
  "Greece": "Grécia",
  "Wales": "País de Gales",
  "Northern Ireland": "Irlanda do Norte",
  "Republic of Ireland": "Irlanda",
  "Ireland": "Irlanda",
  "Slovakia": "Eslováquia",
  "Slovenia": "Eslovênia",
  "Finland": "Finlândia",
  "Iceland": "Islândia",
  "Russia": "Rússia",
  "Belarus": "Bielorrússia",
  "Georgia": "Geórgia",
  "Armenia": "Armênia",
  "Azerbaijan": "Azerbaijão",
  "Kazakhstan": "Cazaquistão",
  "Bulgaria": "Bulgária",
  "Albania": "Albânia",
  "North Macedonia": "Macedônia do Norte",
  "Montenegro": "Montenegro",
  "Kosovo": "Kosovo",
  "Israel": "Israel",
  "Cyprus": "Chipre",
  "Luxembourg": "Luxemburgo",
  "Lithuania": "Lituânia",
  "Latvia": "Letônia",
  "Estonia": "Estônia",
  "Moldova": "Moldávia",
  "Malta": "Malta",
  "Faroe Islands": "Ilhas Faroé",
  "Andorra": "Andorra",
  "San Marino": "San Marino",
  "Liechtenstein": "Liechtenstein",
  "Gibraltar": "Gibraltar",
  "Chile": "Chile",
  "Peru": "Peru",
  "Bolivia": "Bolívia",
  "Venezuela": "Venezuela",
  "Costa Rica": "Costa Rica",
  "Honduras": "Honduras",
  "El Salvador": "El Salvador",
  "Guatemala": "Guatemala",
  "Jamaica": "Jamaica",
  "Trinidad and Tobago": "Trinidad e Tobago",
  "Nicaragua": "Nicarágua",
  "Dominican Republic": "República Dominicana",
  "Cuba": "Cuba",
  "Suriname": "Suriname",
  "China": "China",
  "India": "Índia",
  "Thailand": "Tailândia",
  "Vietnam": "Vietnã",
  "Indonesia": "Indonésia",
  "United Arab Emirates": "Emirados Árabes Unidos",
  "Oman": "Omã",
  "Bahrain": "Bahrein",
  "Kuwait": "Kuwait",
  "Syria": "Síria",
  "Lebanon": "Líbano",
  "Palestine": "Palestina",
  "North Korea": "Coreia do Norte",
  "Nigeria": "Nigéria",
  "Cameroon": "Camarões",
  "Mali": "Mali",
  "Burkina Faso": "Burkina Faso",
  "Guinea": "Guiné",
  "Zambia": "Zâmbia",
  "Angola": "Angola",
  "Kenya": "Quênia",
  "Uganda": "Uganda",
  "Gabon": "Gabão",
  "Benin": "Benin",
  "Libya": "Líbia",
  "Equatorial Guinea": "Guiné Equatorial",
  "Mozambique": "Moçambique"
};

const BY_LOCALE: Record<RouteLocale, Record<string, string>> = { es: ES, pt: PT, en: {} };

/** English (provider) name → localized; club names pass through untouched. */
export function nationName(name: string, locale: RouteLocale): string {
  return BY_LOCALE[locale]?.[name] ?? name;
}

/** Localized name → provider English name (for slugs). */
export const NATION_ENGLISH: Record<string, string> = Object.fromEntries(
  [...Object.entries(ES), ...Object.entries(PT)].map(([en, local]) => [local, en]),
);

// The provider has spelled some nations two ways over time; slugs use one.
const CANON: Record<string, string> = {
  'United States': 'USA',
  Czechia: 'Czech Republic',
  Türkiye: 'Turkey',
  'Cape Verde': 'Cape Verde Islands',
  'DR Congo': 'Congo DR',
  Ireland: 'Republic of Ireland',
};

/** Stable key for a team name in any locale: localized nation names and
 *  provider spelling variants collapse to one English name. */
export function nationKey(name: string): string {
  const en = NATION_ENGLISH[name] ?? name;
  return CANON[en] ?? en;
}

type NamedTeams = { teams: { home: { name: string }; away: { name: string } } };

/** Shallow copy of a fixture with national-team names translated (display only). */
export function localizeFixture<T extends NamedTeams>(f: T, locale: RouteLocale): T {
  if (locale === 'en' || !f?.teams) return f;
  return {
    ...f,
    teams: {
      ...f.teams,
      home: { ...f.teams.home, name: nationName(f.teams.home.name, locale) },
      away: { ...f.teams.away, name: nationName(f.teams.away.name, locale) },
    },
  };
}

export function localizeFixtures<T extends NamedTeams>(list: T[], locale: RouteLocale): T[] {
  return locale === 'en' ? list : list.map((f) => localizeFixture(f, locale));
}

/** Shallow copy of any `{ name }` team-ish object with the name translated. */
export function localizeTeam<T extends { name: string }>(t: T, locale: RouteLocale): T {
  if (locale === 'en' || !t) return t;
  return { ...t, name: nationName(t.name, locale) };
}

/** Standings groups with every row's team name translated. */
export function localizeGroups<G extends { rows: { team: { name: string } }[] }>(groups: G[], locale: RouteLocale): G[] {
  if (locale === 'en') return groups;
  return groups.map((g) => ({ ...g, rows: g.rows.map((r) => ({ ...r, team: localizeTeam(r.team, locale) })) }));
}

/** Deep copy-on-write pass that translates the `name` of every team-shaped
 *  object (`{ id, name, logo }`) in a payload. Leagues pass through because
 *  only nations are in the map. Use at a page's data entry point. */
export function localizeDeep<T>(value: T, locale: RouteLocale): T {
  if (locale === 'en') return value;
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o)) out[k] = walk(o[k]);
      if (typeof o.name === 'string' && 'logo' in o) out.name = nationName(o.name, locale);
      return out;
    }
    return v;
  };
  return walk(value) as T;
}
