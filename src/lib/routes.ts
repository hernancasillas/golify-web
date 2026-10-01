// Public URL scheme — the single source of truth for every localized path.
//
// Each section of the site lives in ONE internal route folder under
// `src/app/[locale]/` (English names: `match`, `team`, `where-to-watch`…),
// while visitors and crawlers see the path in their own language
// (`/es/partido/…`, `/pt/jogo/…`, `/en/match/…`). The proxy rewrites the
// public segment to the internal folder and 301s every other spelling to the
// canonical one (see `routing.ts`).
//
// Rule for pages and components: never hand-build a path. Use the builders at
// the bottom of this file, so every internal link points straight at the
// canonical URL with no redirect hop.
//
// NOTE: this module is imported by the proxy, which runs before rendering.
// Keep it free of server-only imports and of anything heavy.

import { idFromSlug, teamSlug, slugify, withId, refereeName } from './slug';

export const ROUTE_LOCALES = ['es', 'pt', 'en'] as const;
export type RouteLocale = (typeof ROUTE_LOCALES)[number];

export interface SectionDef {
  /** Internal folder name under src/app/[locale]/ */
  internal: string;
  es: string;
  pt: string;
  en: string;
  /** Paths whose first param is `{slug}-{id}`: a bare id is resolved by the
   *  page (it needs data to know the slug), anything else by the proxy. */
  slugged?: boolean;
  /** Child segments that bypass the scheme entirely (share funnels that
   *  already live under this folder, e.g. `/quiniela/join/{code}`). */
  passthrough?: readonly string[];
}

export const SECTIONS = {
  match: { internal: 'match', es: 'partido', pt: 'jogo', en: 'match', slugged: true },
  team: { internal: 'team', es: 'equipo', pt: 'time', en: 'team', slugged: true },
  player: { internal: 'player', es: 'jugador', pt: 'jogador', en: 'player', slugged: true },
  h2h: { internal: 'h2h', es: 'h2h', pt: 'h2h', en: 'h2h', slugged: true },
  stadium: { internal: 'stadium', es: 'estadio', pt: 'estadio', en: 'stadium', slugged: true },
  referee: { internal: 'referee', es: 'arbitro', pt: 'arbitro', en: 'referee' },
  fc: { internal: 'fc', es: 'fc', pt: 'fc', en: 'fc', slugged: true },
  today: { internal: 'today', es: 'partidos-de-hoy', pt: 'jogos-de-hoje', en: 'today' },
  live: { internal: 'live', es: 'en-vivo', pt: 'ao-vivo', en: 'live' },
  matches: { internal: 'matches', es: 'partidos', pt: 'jogos', en: 'matches' },
  leagues: { internal: 'leagues', es: 'ligas', pt: 'ligas', en: 'leagues' },
  whereToWatch: { internal: 'where-to-watch', es: 'donde-ver', pt: 'onde-assistir', en: 'where-to-watch' },
  transfers: { internal: 'transfers', es: 'fichajes', pt: 'transferencias', en: 'transfers' },
  pool: { internal: 'quiniela', es: 'quiniela', pt: 'bolao', en: 'pool', passthrough: ['join'] },
  news: { internal: 'news', es: 'noticias', pt: 'noticias', en: 'news' },
  guides: { internal: 'guides', es: 'guias', pt: 'guias', en: 'guides' },
  downloads: { internal: 'downloads', es: 'descargas', pt: 'downloads', en: 'downloads' },
  author: { internal: 'author', es: 'autor', pt: 'autor', en: 'author' },
  report: { internal: 'report', es: 'informe', pt: 'relatorio', en: 'report' },
  search: { internal: 'search', es: 'buscar', pt: 'buscar', en: 'search' },
  about: { internal: 'nosotros', es: 'nosotros', pt: 'sobre', en: 'about' },
  contact: { internal: 'contact', es: 'contacto', pt: 'contato', en: 'contact' },
  editorialPolicy: { internal: 'editorial-policy', es: 'politica-editorial', pt: 'politica-editorial', en: 'editorial-policy' },
  privacy: { internal: 'privacy', es: 'privacidad', pt: 'privacidade', en: 'privacy' },
  terms: { internal: 'terms', es: 'terminos', pt: 'termos', en: 'terms' },
  cookies: { internal: 'cookies', es: 'cookies', pt: 'cookies', en: 'cookies' },
  advertise: { internal: 'advertise', es: 'publicidad', pt: 'publicidade', en: 'advertise' },
} as const satisfies Record<string, SectionDef>;

export type SectionKey = keyof typeof SECTIONS;

/** Localized sub-pages. Resolved by the pages themselves (a wrong-language
 *  sub-segment gets a permanent redirect there). */
export const SUBSECTIONS = {
  // /equipo/{slug}/…
  squad: { es: 'plantilla', pt: 'elenco', en: 'squad' },
  fixtures: { es: 'calendario', pt: 'calendario', en: 'fixtures' },
  stats: { es: 'estadisticas', pt: 'estatisticas', en: 'stats' },
  // /{liga}/{temporada}/…
  table: { es: 'tabla', pt: 'tabela', en: 'table' },
  scorers: { es: 'goleadores', pt: 'artilheiros', en: 'top-scorers' },
  assists: { es: 'asistencias', pt: 'assistencias', en: 'assists' },
  cards: { es: 'tarjetas', pt: 'cartoes', en: 'cards' },
  // Round prefix: jornada-12 / rodada-12 / matchday-12
  round: { es: 'jornada', pt: 'rodada', en: 'matchday' },
} as const;

export type SubsectionKey = keyof typeof SUBSECTIONS;

export function subsection(key: SubsectionKey, locale: RouteLocale): string {
  return SUBSECTIONS[key][locale];
}

/** Which subsection key a localized segment belongs to (any locale). */
export function subsectionFromSegment(
  segment: string,
  allowed: readonly SubsectionKey[],
): { key: SubsectionKey; locale: RouteLocale } | null {
  for (const key of allowed) {
    for (const l of ROUTE_LOCALES) {
      if (SUBSECTIONS[key][l] === segment) return { key, locale: l };
    }
  }
  return null;
}

// ---- Country hubs: /es/co/partidos-de-hoy, /pt/br/jogos-de-hoje ----

export const HUB_COUNTRIES = ['mx', 'co', 'ar', 'cl', 'pe', 'ec', 'us', 'es', 'br'] as const;
export type HubCountry = (typeof HUB_COUNTRIES)[number];

export function isHubCountry(v: string): v is HubCountry {
  return (HUB_COUNTRIES as readonly string[]).includes(v);
}

// ---- Competition slugs live at the top level: /es/liga-mx/apertura-2026 ----
// Kept here (not in competitions.ts) because the proxy needs the list and must
// not import the heavier registry. competitions.ts asserts both stay in sync.
export const COMPETITION_SLUGS: Record<string, number> = {
  'liga-mx': 262,
  brasileirao: 71,
  'liga-profesional-argentina': 128,
  'copa-libertadores': 13,
  'copa-sudamericana': 11,
  mls: 253,
  'copa-do-brasil': 73,
  'copa-argentina': 130,
  'concacaf-champions-cup': 16,
  'leagues-cup': 772,
  'liga-betplay': 239,
  'liga-pro-ecuador': 242,
  'primera-division-chile': 265,
  'champions-league': 2,
  'premier-league': 39,
  laliga: 140,
  'serie-a': 135,
  bundesliga: 78,
  'ligue-1': 61,
  'primeira-liga': 94,
  'saudi-pro-league': 307,
  // Expansion (plan A5) — reachable only when the registry enables them.
  'liga-expansion-mx': 263,
  'liga-mx-femenil': 673,
  'primera-b-colombia': 240,
  'primera-b-chile': 266,
  'primera-nacional-argentina': 129,
  'brasileirao-serie-b': 72,
  'liga-1-peru': 281,
  'primera-division-uruguay': 268,
  'primera-division-paraguay': 250,
  'primera-division-bolivia': 344,
  'primera-division-venezuela': 299,
  'eliminatorias-conmebol': 34,
  championship: 40,
  eredivisie: 88,
  'europa-league': 3,
  'conference-league': 848,
};

export const COMPETITION_SLUG_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(COMPETITION_SLUGS).map(([slug, id]) => [id, slug]),
);

export function isCompetitionSlug(v: string): boolean {
  return Object.prototype.hasOwnProperty.call(COMPETITION_SLUGS, v);
}

// ---- Builders ----------------------------------------------------------

export function sectionPath(key: SectionKey, locale: RouteLocale, ...rest: (string | number)[]): string {
  const seg = SECTIONS[key][locale];
  const tail = rest.map(String).filter(Boolean).join('/');
  return `/${locale}/${seg}${tail ? `/${tail}` : ''}`;
}

export function homePath(locale: RouteLocale): string {
  return `/${locale}`;
}

/** World Cup 2026 archive hub (kept on its original English segment). */
export function worldCupPath(locale: RouteLocale): string {
  return `/${locale}/world-cup`;
}

export function matchSlug(homeName: string, awayName: string, fixtureId: number): string {
  return withId(`${teamSlug(homeName)}-vs-${teamSlug(awayName)}`, fixtureId);
}

export function matchPath(
  locale: RouteLocale,
  f: { fixture: { id: number }; teams: { home: { name: string }; away: { name: string } } },
): string {
  return sectionPath('match', locale, matchSlug(f.teams.home.name, f.teams.away.name, f.fixture.id));
}

export function teamSlugId(team: { id: number; name: string }): string {
  return withId(teamSlug(team.name), team.id);
}

export function teamPath(
  locale: RouteLocale,
  team: { id: number; name: string },
  sub?: 'squad' | 'fixtures' | 'stats',
): string {
  const base = sectionPath('team', locale, teamSlugId(team));
  return sub ? `${base}/${subsection(sub, locale)}` : base;
}

export function playerSlugId(player: { id: number; name: string }): string {
  return withId(slugify(player.name), player.id);
}

export function playerPath(locale: RouteLocale, player: { id: number; name: string }): string {
  return sectionPath('player', locale, playerSlugId(player));
}

/** Canonical H2H pair: lower team id first, so A-vs-B and B-vs-A are one URL. */
export function h2hSlug(a: { id: number; name: string }, b: { id: number; name: string }): string {
  const [x, y] = a.id < b.id ? [a, b] : [b, a];
  return `${teamSlug(x.name)}-vs-${teamSlug(y.name)}-${x.id}-${y.id}`;
}

export function h2hPath(
  locale: RouteLocale,
  a: { id: number; name: string },
  b: { id: number; name: string },
): string {
  return sectionPath('h2h', locale, h2hSlug(a, b));
}

export function stadiumPath(locale: RouteLocale, venue: { id: number; name: string }): string {
  return sectionPath('stadium', locale, withId(slugify(venue.name), venue.id));
}

export function refereeSlug(raw: string): string {
  return slugify(refereeName(raw));
}

export function refereePath(locale: RouteLocale, raw: string): string {
  return sectionPath('referee', locale, refereeSlug(raw));
}

export function fcPath(locale: RouteLocale, p: { player_id: number; slug: string }): string {
  return sectionPath('fc', locale, withId(p.slug, p.player_id));
}

/** Competition hub `/es/liga-mx`, season `/es/liga-mx/apertura-2026`,
 *  section `/es/liga-mx/apertura-2026/tabla`, round `/…/jornada-12`. */
export function competitionPath(
  locale: RouteLocale,
  leagueId: number,
  seasonSlug?: string,
  section?: 'table' | 'scorers' | 'assists' | 'cards' | 'fixtures' | { round: number },
): string | null {
  const slug = COMPETITION_SLUG_BY_ID[leagueId];
  if (!slug) return null;
  let p = `/${locale}/${slug}`;
  if (seasonSlug) {
    p += `/${seasonSlug}`;
    if (section) {
      p +=
        typeof section === 'object'
          ? `/${subsection('round', locale)}-${section.round}`
          : `/${subsection(section, locale)}`;
    }
  }
  return p;
}

export function hubPath(locale: RouteLocale, country: HubCountry): string {
  return `/${locale}/${country}/${SECTIONS.today[locale]}`;
}

export function datePath(locale: RouteLocale, isoDate: string): string {
  return sectionPath('matches', locale, isoDate);
}

export function whereToWatchPath(locale: RouteLocale, leagueId: number, countrySlug?: string): string | null {
  const slug = COMPETITION_SLUG_BY_ID[leagueId];
  if (!slug) return null;
  return sectionPath('whereToWatch', locale, slug, countrySlug ?? '');
}

export function transfersPath(locale: RouteLocale, leagueId: number): string | null {
  const slug = COMPETITION_SLUG_BY_ID[leagueId];
  if (!slug) return null;
  return sectionPath('transfers', locale, slug);
}

/** Public quiniela for a round of the league's current season. */
export function poolPath(locale: RouteLocale, leagueId: number, round?: number): string | null {
  const slug = COMPETITION_SLUG_BY_ID[leagueId];
  if (!slug) return null;
  return sectionPath('pool', locale, slug, round ? `${subsection('round', locale)}-${round}` : '');
}

export { idFromSlug };
