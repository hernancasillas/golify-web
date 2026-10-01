// Competition registry — every league/cup the site covers, with its public
// slug, labels, market and how its seasons are named.
//
// Two tiers:
//   core       — the 21 competitions the site has always covered.
//   expansion  — plan A5 (80–150 competitions). Plan A5 makes expansion
//                conditional on written confirmation that the data provider's
//                licence allows showing and indexing the data at scale, so
//                these stay off until GOLIFY_EXPANDED_COVERAGE=1 is set.
//
// Order matters: it drives chip order on Home and section order on the
// results boards (markets we push first, then Europe).

import { COMPETITION_SLUGS, type HubCountry, type RouteLocale } from './routes';

export type Market = 'mx' | 'br' | 'ar' | 'co' | 'ec' | 'cl' | 'pe' | 'us' | 'sudamerica' | 'europa' | 'mundo';

/** How API-Football's `season` year maps to the tournament people name:
 *  split  — two tournaments per API season, named from the round prefix
 *           ("Apertura - 12"). `clausuraOffset` is 1 when the Clausura is
 *           played the calendar year after the API season (Liga MX).
 *  cross  — one season across two years (Premier League 2026-2027).
 *  single — one season inside one year (Brasileirão 2026). */
export type SeasonFormat = 'split' | 'cross' | 'single';

export interface Competition {
  id: number;
  slug: string;
  /** Our label (API-Football calls both the Italian and Brazilian top flight
   *  "Serie A", which would be unreadable side by side). */
  name: string;
  /** Localized label where the name differs by language. */
  names?: Partial<Record<RouteLocale, string>>;
  /** 3-letter chip code (design: LMX, BET, LPF…). */
  code: string;
  market: Market;
  /** Hub countries whose "partidos de hoy" lists this competition first. */
  countries: HubCountry[];
  kind: 'league' | 'cup';
  format: SeasonFormat;
  clausuraOffset?: 0 | 1;
  /** Word used for a numbered round in copy ("Jornada 12", "Fecha 14"). */
  roundWord?: Partial<Record<RouteLocale, string>>;
  tier: 'core' | 'expansion';
}

const C = (c: Competition) => c;

const ALL: Competition[] = [
  C({ id: 262, slug: 'liga-mx', name: 'Liga MX', code: 'LMX', market: 'mx', countries: ['mx', 'us'], kind: 'league', format: 'split', clausuraOffset: 1, tier: 'core' }),
  C({ id: 71, slug: 'brasileirao', name: 'Brasileirão', code: 'BRA', market: 'br', countries: ['br'], kind: 'league', format: 'single', roundWord: { es: 'Fecha', pt: 'Rodada' }, tier: 'core' }),
  C({ id: 128, slug: 'liga-profesional-argentina', name: 'Liga Profesional', names: { en: 'Liga Profesional (Argentina)' }, code: 'LPF', market: 'ar', countries: ['ar'], kind: 'league', format: 'split', clausuraOffset: 0, roundWord: { es: 'Fecha' }, tier: 'core' }),
  C({ id: 13, slug: 'copa-libertadores', name: 'Copa Libertadores', code: 'LIB', market: 'sudamerica', countries: ['ar', 'br', 'co', 'cl', 'ec', 'pe'], kind: 'cup', format: 'single', roundWord: { es: 'Fecha' }, tier: 'core' }),
  C({ id: 11, slug: 'copa-sudamericana', name: 'Copa Sudamericana', code: 'SUD', market: 'sudamerica', countries: ['ar', 'br', 'co', 'cl', 'ec', 'pe'], kind: 'cup', format: 'single', roundWord: { es: 'Fecha' }, tier: 'core' }),
  C({ id: 253, slug: 'mls', name: 'MLS', code: 'MLS', market: 'us', countries: ['us'], kind: 'league', format: 'single', tier: 'core' }),
  C({ id: 73, slug: 'copa-do-brasil', name: 'Copa do Brasil', code: 'CDB', market: 'br', countries: ['br'], kind: 'cup', format: 'single', tier: 'core' }),
  C({ id: 130, slug: 'copa-argentina', name: 'Copa Argentina', code: 'CAR', market: 'ar', countries: ['ar'], kind: 'cup', format: 'single', tier: 'core' }),
  C({ id: 16, slug: 'concacaf-champions-cup', name: 'Concacaf Champions Cup', code: 'CCC', market: 'mundo', countries: ['mx', 'us'], kind: 'cup', format: 'single', tier: 'core' }),
  C({ id: 772, slug: 'leagues-cup', name: 'Leagues Cup', code: 'LCP', market: 'mundo', countries: ['mx', 'us'], kind: 'cup', format: 'single', tier: 'core' }),
  C({ id: 239, slug: 'liga-betplay', name: 'Liga BetPlay', names: { en: 'Primera A (Colombia)' }, code: 'BET', market: 'co', countries: ['co'], kind: 'league', format: 'split', clausuraOffset: 0, roundWord: { es: 'Fecha' }, tier: 'core' }),
  C({ id: 242, slug: 'liga-pro-ecuador', name: 'LigaPro Ecuador', code: 'LPE', market: 'ec', countries: ['ec'], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'core' }),
  C({ id: 265, slug: 'primera-division-chile', name: 'Primera División de Chile', code: 'CHI', market: 'cl', countries: ['cl'], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'core' }),
  C({ id: 2, slug: 'champions-league', name: 'Champions League', names: { en: 'UEFA Champions League' }, code: 'UCL', market: 'europa', countries: ['es', 'mx', 'co', 'ar', 'cl', 'pe', 'ec', 'us', 'br'], kind: 'cup', format: 'cross', tier: 'core' }),
  C({ id: 39, slug: 'premier-league', name: 'Premier League', code: 'PL', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'core' }),
  C({ id: 140, slug: 'laliga', name: 'LaLiga', code: 'ESP', market: 'europa', countries: ['es'], kind: 'league', format: 'cross', tier: 'core' }),
  C({ id: 135, slug: 'serie-a', name: 'Serie A', names: { pt: 'Serie A (Itália)', es: 'Serie A (Italia)', en: 'Serie A (Italy)' }, code: 'ITA', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'core' }),
  C({ id: 78, slug: 'bundesliga', name: 'Bundesliga', code: 'BUN', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'core' }),
  C({ id: 61, slug: 'ligue-1', name: 'Ligue 1', code: 'L1', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'core' }),
  C({ id: 94, slug: 'primeira-liga', name: 'Primeira Liga', code: 'POR', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'core' }),
  C({ id: 307, slug: 'saudi-pro-league', name: 'Saudi Pro League', code: 'SPL', market: 'mundo', countries: [], kind: 'league', format: 'cross', tier: 'core' }),
  // Same set as the app's Home (fuchibol/constants/leagues.ts): national
  // teams' international windows and UEFA's other club competitions.
  C({ id: 5, slug: 'nations-league', name: 'UEFA Nations League', names: { es: 'Liga de Naciones UEFA', pt: 'Liga das Nações UEFA' }, code: 'UNL', market: 'europa', countries: ['es'], kind: 'cup', format: 'cross', tier: 'core' }),
  C({ id: 10, slug: 'amistosos-internacionales', name: 'Amistosos internacionales', names: { pt: 'Amistosos internacionais', en: 'International friendlies' }, code: 'AMI', market: 'mundo', countries: ['mx', 'co', 'ar', 'cl', 'pe', 'ec', 'us', 'es', 'br'], kind: 'cup', format: 'single', tier: 'core' }),
  C({ id: 3, slug: 'europa-league', name: 'Europa League', names: { en: 'UEFA Europa League' }, code: 'UEL', market: 'europa', countries: [], kind: 'cup', format: 'cross', tier: 'core' }),
  C({ id: 531, slug: 'supercopa-uefa', name: 'Supercopa de Europa', names: { pt: 'Supercopa da UEFA', en: 'UEFA Super Cup' }, code: 'USC', market: 'europa', countries: [], kind: 'cup', format: 'single', tier: 'core' }),

  // ---- Expansion (plan A5) — off until the data licence is confirmed ----
  C({ id: 263, slug: 'liga-expansion-mx', name: 'Liga de Expansión MX', code: 'LEX', market: 'mx', countries: ['mx'], kind: 'league', format: 'split', clausuraOffset: 1, tier: 'expansion' }),
  C({ id: 673, slug: 'liga-mx-femenil', name: 'Liga MX Femenil', code: 'LMF', market: 'mx', countries: ['mx'], kind: 'league', format: 'split', clausuraOffset: 1, tier: 'expansion' }),
  C({ id: 240, slug: 'primera-b-colombia', name: 'Primera B (Colombia)', names: { es: 'Torneo BetPlay' }, code: 'PBC', market: 'co', countries: ['co'], kind: 'league', format: 'split', clausuraOffset: 0, roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 266, slug: 'primera-b-chile', name: 'Primera B de Chile', code: 'PBH', market: 'cl', countries: ['cl'], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 129, slug: 'primera-nacional-argentina', name: 'Primera Nacional', code: 'PNA', market: 'ar', countries: ['ar'], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 72, slug: 'brasileirao-serie-b', name: 'Brasileirão Série B', code: 'BRB', market: 'br', countries: ['br'], kind: 'league', format: 'single', roundWord: { es: 'Fecha', pt: 'Rodada' }, tier: 'expansion' }),
  C({ id: 281, slug: 'liga-1-peru', name: 'Liga 1 (Perú)', code: 'PER', market: 'pe', countries: ['pe'], kind: 'league', format: 'split', clausuraOffset: 0, roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 268, slug: 'primera-division-uruguay', name: 'Primera División de Uruguay', code: 'URU', market: 'sudamerica', countries: [], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 250, slug: 'primera-division-paraguay', name: 'Primera División de Paraguay', code: 'PAR', market: 'sudamerica', countries: [], kind: 'league', format: 'split', clausuraOffset: 0, roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 344, slug: 'primera-division-bolivia', name: 'División Profesional de Bolivia', code: 'BOL', market: 'sudamerica', countries: [], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 299, slug: 'primera-division-venezuela', name: 'Liga FUTVE', code: 'VEN', market: 'sudamerica', countries: [], kind: 'league', format: 'single', roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 34, slug: 'eliminatorias-conmebol', name: 'Eliminatorias CONMEBOL', names: { pt: 'Eliminatórias CONMEBOL', en: 'CONMEBOL World Cup Qualifiers' }, code: 'ELI', market: 'sudamerica', countries: ['ar', 'br', 'co', 'cl', 'ec', 'pe'], kind: 'cup', format: 'single', roundWord: { es: 'Fecha' }, tier: 'expansion' }),
  C({ id: 40, slug: 'championship', name: 'Championship', code: 'EFL', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'expansion' }),
  C({ id: 88, slug: 'eredivisie', name: 'Eredivisie', code: 'ERE', market: 'europa', countries: [], kind: 'league', format: 'cross', tier: 'expansion' }),
  C({ id: 848, slug: 'conference-league', name: 'Conference League', names: { en: 'UEFA Conference League' }, code: 'UECL', market: 'europa', countries: [], kind: 'cup', format: 'cross', tier: 'expansion' }),
];

// The proxy's slug table (routes.ts) and this registry must agree, or a
// competition would render at a URL the proxy never rewrites.
for (const c of ALL) {
  if (COMPETITION_SLUGS[c.slug] !== c.id) {
    throw new Error(`competitions: slug ${c.slug} → ${c.id} is out of sync with routes.ts`);
  }
}

export const EXPANDED_COVERAGE = process.env.GOLIFY_EXPANDED_COVERAGE === '1';

/** Competitions the site currently publishes. */
export const COMPETITIONS: Competition[] = ALL.filter(
  (c) => c.tier === 'core' || EXPANDED_COVERAGE,
);

const BY_ID = new Map(COMPETITIONS.map((c) => [c.id, c]));
const BY_SLUG = new Map(COMPETITIONS.map((c) => [c.slug, c]));

export const COVERED_IDS: readonly number[] = COMPETITIONS.map((c) => c.id);

export function competitionById(id: number): Competition | null {
  return BY_ID.get(id) ?? null;
}

export function competitionBySlug(slug: string): Competition | null {
  return BY_SLUG.get(slug) ?? null;
}

export function isCovered(leagueId: number): boolean {
  return BY_ID.has(leagueId);
}

export function competitionName(c: Competition, locale: RouteLocale): string {
  return c.names?.[locale] ?? c.name;
}

/** Competitions listed first on a country's hub. */
export function competitionsForCountry(country: HubCountry): Competition[] {
  return COMPETITIONS.filter((c) => c.countries.includes(country));
}

// ---- Seasons ------------------------------------------------------------

export type Phase = 'apertura' | 'clausura';

export interface SeasonRef {
  /** API-Football `season` param. */
  apiSeason: number;
  /** Tournament within a split season, when the league has one. */
  phase: Phase | null;
}

/** Seasons named across two calendar years (Premier League 2026/27, and Liga
 *  MX, whose API season holds Apertura 2026 + Clausura 2027). */
export function spansTwoYears(c: Competition): boolean {
  return c.format === 'cross' || (c.format === 'split' && c.clausuraOffset === 1);
}

export function seasonSlug(c: Competition, ref: SeasonRef): string {
  if (c.format === 'split' && ref.phase) {
    const year = ref.phase === 'apertura' ? ref.apiSeason : ref.apiSeason + (c.clausuraOffset ?? 0);
    return `${ref.phase}-${year}`;
  }
  if (c.format === 'cross') return `${ref.apiSeason}-${ref.apiSeason + 1}`;
  return String(ref.apiSeason);
}

export function parseSeasonSlug(c: Competition, slug: string): SeasonRef | null {
  let m = /^(apertura|clausura)-(\d{4})$/.exec(slug);
  if (m) {
    if (c.format !== 'split') return null;
    const phase = m[1] as Phase;
    const year = Number(m[2]);
    return { phase, apiSeason: phase === 'apertura' ? year : year - (c.clausuraOffset ?? 0) };
  }
  m = /^(\d{4})-(\d{4})$/.exec(slug);
  if (m) {
    if (c.format !== 'cross' || Number(m[2]) !== Number(m[1]) + 1) return null;
    return { apiSeason: Number(m[1]), phase: null };
  }
  m = /^(\d{4})$/.exec(slug);
  if (m) {
    // A split league also answers to its bare year (both tournaments); the
    // page decides whether that is worth a page or a redirect.
    if (c.format === 'cross') return null;
    return { apiSeason: Number(m[1]), phase: null };
  }
  return null;
}

/** Human season label: "Apertura 2026", "2026/27", "2026". */
export function seasonLabel(c: Competition, ref: SeasonRef, locale: RouteLocale): string {
  if (c.format === 'split' && ref.phase) {
    const year = ref.phase === 'apertura' ? ref.apiSeason : ref.apiSeason + (c.clausuraOffset ?? 0);
    // Same word in every locale: "Apertura"/"Clausura" are the tournaments'
    // proper names, also in Brazilian and English coverage.
    return `${ref.phase === 'apertura' ? 'Apertura' : 'Clausura'} ${year}`;
  }
  if (c.format === 'cross') return `${ref.apiSeason}/${String(ref.apiSeason + 1).slice(2)}`;
  return String(ref.apiSeason);
}

// ---- Rounds --------------------------------------------------------------

export interface ParsedRound {
  phase: Phase | null;
  /** Numbered round (jornada/fecha/rodada), when it is one. */
  number: number | null;
  /** Stage text without the phase prefix ("Quarter-finals", "Regular Season - 12"). */
  stage: string;
}

export function parseRound(round: string): ParsedRound {
  let rest = round.trim();
  let phase: Phase | null = null;
  const pm = /^(Apertura|Clausura)\s*-\s*(.+)$/i.exec(rest);
  if (pm) {
    phase = pm[1].toLowerCase() as Phase;
    rest = pm[2].trim();
  }
  // Only the main phase's rounds are "jornada N". LigaPro's second phase
  // ("Championship Group - 3") restarts its count, so numbering it would
  // collide with "Regular Season - 3".
  const nm = /^(?:(?:Regular Season|League Stage|Group Stage|Round)\s*-\s*)?(\d+)$/i.exec(rest);
  return { phase, number: nm ? Number(nm[1]) : null, stage: rest };
}

const STAGES: Record<string, Record<RouteLocale, string>> = {
  'quarter-finals': { es: 'Cuartos de final', pt: 'Quartas de final', en: 'Quarter-finals' },
  'semi-finals': { es: 'Semifinales', pt: 'Semifinais', en: 'Semi-finals' },
  final: { es: 'Final', pt: 'Final', en: 'Final' },
  'round of 16': { es: 'Octavos de final', pt: 'Oitavas de final', en: 'Round of 16' },
  'round of 32': { es: 'Dieciseisavos de final', pt: 'Segunda fase', en: 'Round of 32' },
  'play-offs': { es: 'Play-offs', pt: 'Play-offs', en: 'Play-offs' },
  'knockout round play-offs': { es: 'Play-offs', pt: 'Play-offs', en: 'Knockout play-offs' },
  'play-in semi-finals': { es: 'Play-in', pt: 'Play-in', en: 'Play-in' },
  'play-in final': { es: 'Play-in (final)', pt: 'Play-in (final)', en: 'Play-in final' },
  '3rd place final': { es: 'Tercer lugar', pt: 'Terceiro lugar', en: 'Third place' },
  'third place': { es: 'Tercer lugar', pt: 'Terceiro lugar', en: 'Third place' },
  'group stage': { es: 'Fase de grupos', pt: 'Fase de grupos', en: 'Group stage' },
  'league stage': { es: 'Fase liga', pt: 'Fase de liga', en: 'League phase' },
  'club friendlies': { es: 'Amistoso', pt: 'Amistoso', en: 'Friendly' },
  'preliminary round': { es: 'Fase previa', pt: 'Fase preliminar', en: 'Preliminary round' },
};

const GROUP_PHASES: Record<string, Record<RouteLocale, string>> = {
  championship: { es: 'Grupo campeonato', pt: 'Grupo do título', en: 'Championship group' },
  relegation: { es: 'Grupo por la permanencia', pt: 'Grupo do rebaixamento', en: 'Relegation group' },
  placement: { es: 'Grupo de ubicación', pt: 'Grupo de classificação', en: 'Placement group' },
};

/** Provider stage names that carry a number but are not a "jornada". */
function patternedStage(stage: string, locale: RouteLocale, c: Competition | null): string | null {
  let m = /^(Championship|Relegation|Placement) Group\s*-\s*(\d+)$/i.exec(stage);
  if (m) return `${GROUP_PHASES[m[1].toLowerCase()][locale]} · ${roundWord(c, locale)} ${m[2]}`;
  m = /^Qualification Round (\d+)$/i.exec(stage) ?? /^(\d+)(?:st|nd|rd|th) Qualifying Round$/i.exec(stage);
  if (m) return locale === 'es' ? `Fase previa ${m[1]}` : locale === 'pt' ? `Fase preliminar ${m[1]}` : `Qualifying round ${m[1]}`;
  m = /^Round of (\d+)$/i.exec(stage);
  if (m && m[1] !== '16' && m[1] !== '32') {
    return locale === 'es' ? `Ronda de ${m[1]}` : locale === 'pt' ? `Fase de ${m[1]}` : `Round of ${m[1]}`;
  }
  m = /^1\/(\d+)-finals$/i.exec(stage);
  if (m) return locale === 'en' ? `1/${m[1]} finals` : `1/${m[1]} de final`;
  return null;
}

const ROUND_WORD: Record<RouteLocale, string> = { es: 'Jornada', pt: 'Rodada', en: 'Matchday' };

export function roundWord(c: Competition | null, locale: RouteLocale): string {
  return c?.roundWord?.[locale] ?? ROUND_WORD[locale];
}

/** "Jornada 12", "Fecha 14", "Cuartos de final". Falls back to the raw text. */
export function roundLabel(round: string, locale: RouteLocale, c: Competition | null = null): string {
  const r = parseRound(round);
  if (r.number != null) return `${roundWord(c, locale)} ${r.number}`;
  return STAGES[r.stage.toLowerCase()]?.[locale] ?? patternedStage(r.stage, locale, c) ?? r.stage;
}
