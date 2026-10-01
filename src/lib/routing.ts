// Pure URL resolver behind the proxy. No Next imports, so it can be tested
// with plain node (`node scripts/test-routing.ts`).
//
// Given a request path it answers one of three things:
//   next      — the path is already an internal route; render it as is.
//   rewrite   — the path is a canonical public URL; serve the internal route
//               behind it without changing the address bar.
//   redirect  — the path is a non-canonical spelling; send a permanent
//               redirect straight to the canonical URL (never a chain).
//
// Bare-id legacy URLs (`/es/match/1490500`) are the one case the proxy cannot
// finish on its own: the slug needs the team names. Those are passed through
// to the page, which issues the single permanent redirect itself.

import {
  COMPETITION_SLUGS,
  HUB_COUNTRIES,
  ROUTE_LOCALES,
  SECTIONS,
  SUBSECTIONS,
  isCompetitionSlug,
  subsectionFromSegment,
  isHubCountry,
  sectionPath,
  type RouteLocale,
  type SectionDef,
} from './routes';

export type Resolution =
  | { action: 'next' }
  | { action: 'rewrite'; path: string }
  | { action: 'redirect'; path: string };

const DEFAULT_LOCALE: RouteLocale = 'es';
const NEXT: Resolution = { action: 'next' };

const SECTION_LIST = Object.values(SECTIONS) as SectionDef[];

// Every spelling of every section → the section. Built once.
const BY_SEGMENT = new Map<string, SectionDef>();
for (const def of SECTION_LIST) {
  for (const seg of [def.internal, def.es, def.pt, def.en]) {
    const prev = BY_SEGMENT.get(seg);
    if (prev && prev !== def) {
      throw new Error(`routes: segment "${seg}" is claimed by two sections`);
    }
    BY_SEGMENT.set(seg, def);
  }
}
for (const slug of Object.keys(COMPETITION_SLUGS)) {
  if (BY_SEGMENT.has(slug) || isHubCountry(slug)) {
    throw new Error(`routes: competition slug "${slug}" collides with a section`);
  }
}

// Paths that moved for good. Exact matches after the locale.
const LEGACY: Record<string, (l: RouteLocale) => string> = {
  // The album page was retired in the app-design reskin but stayed indexed;
  // its closest living equivalent is the printable checklist.
  stickers: (l) => sectionPath('downloads', l, 'checklist-album-golify'),
};

function isLocale(v: string | undefined): v is RouteLocale {
  return !!v && (ROUTE_LOCALES as readonly string[]).includes(v);
}

function join(locale: string, segs: string[]): string {
  return `/${[locale, ...segs].filter((s) => s !== '').join('/')}`;
}

function resolveLocalized(locale: RouteLocale, segs: string[]): Resolution {
  const [s1, s2, ...more] = segs;
  if (!s1) return NEXT;

  const legacy = LEGACY[s1];
  if (legacy && segs.length === 1) return { action: 'redirect', path: legacy(locale) };

  // Country hub: /{l}/{cc}/{today-segment}
  if (isHubCountry(s1)) {
    const hub = SECTIONS.today[locale];
    if (s2 === hub && more.length === 0) {
      return { action: 'rewrite', path: join(locale, [SECTIONS.today.internal, s1]) };
    }
    const todaySpellings: string[] = [SECTIONS.today.es, SECTIONS.today.pt, SECTIONS.today.en, SECTIONS.today.internal];
    if (s2 === undefined || (todaySpellings.includes(s2) && more.length === 0)) {
      return { action: 'redirect', path: join(locale, [s1, hub]) };
    }
    return NEXT; // unknown → 404 from the router
  }

  // Competition at the top level: /{l}/liga-mx[/…]
  if (isCompetitionSlug(s1)) {
    return { action: 'rewrite', path: join(locale, ['league', ...segs]) };
  }

  // Internal competition folder hit directly.
  if (s1 === 'league') {
    if (s2 === undefined) return NEXT;
    if (/^\d+$/.test(s2)) return NEXT; // legacy /league/262 → page redirects
    if (isCompetitionSlug(s2)) return { action: 'redirect', path: join(locale, [s2, ...more]) };
    return NEXT;
  }

  const def = BY_SEGMENT.get(s1);
  if (!def) return NEXT;

  const canonical = def[locale];
  const rest = segs.slice(1);

  // Country hub reached through the internal /today/{cc} folder.
  if (def === SECTIONS.today && s2 && isHubCountry(s2) && more.length === 0) {
    return { action: 'redirect', path: join(locale, [s2, SECTIONS.today[locale]]) };
  }

  if (def.passthrough && s2 && def.passthrough.includes(s2)) {
    return s1 === def.internal ? NEXT : { action: 'rewrite', path: join(locale, [def.internal, ...rest]) };
  }

  if (s1 === canonical) {
    return canonical === def.internal
      ? NEXT
      : { action: 'rewrite', path: join(locale, [def.internal, ...rest]) };
  }

  // Non-canonical spelling from here on.
  if (def.slugged && s2 && /^\d+$/.test(s2)) {
    // Bare id: the page knows the slug and redirects once.
    return s1 === def.internal ? NEXT : { action: 'rewrite', path: join(locale, [def.internal, ...rest]) };
  }
  // Team sub-pages carry a localized word too (/time/x/elenco): translate it
  // in the same hop instead of leaving the page to redirect a second time.
  const tail =
    def === SECTIONS.team && rest[1]
      ? [rest[0], localizeTeamSub(rest[1], locale), ...rest.slice(2)]
      : rest;
  return { action: 'redirect', path: join(locale, [canonical, ...tail]) };
}

function localizeTeamSub(seg: string, locale: RouteLocale): string {
  const hit = subsectionFromSegment(seg, ['squad', 'fixtures', 'stats']);
  return hit ? SUBSECTIONS[hit.key][locale] : seg;
}

/** Resolve a request pathname (no query string). */
export function resolvePath(pathname: string): Resolution {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const segs = clean.split('/').slice(1).filter(Boolean);
  const [first, ...rest] = segs;

  if (isLocale(first)) return resolveLocalized(first, rest);

  // No locale: the canonical URL is under the default locale. Resolve that
  // path in one go so an old root link lands on its final URL in one hop.
  const target = join(DEFAULT_LOCALE, segs);
  const inner = resolveLocalized(DEFAULT_LOCALE, segs);
  if (inner.action === 'redirect') return inner;
  return { action: 'redirect', path: target === `/${DEFAULT_LOCALE}/` ? `/${DEFAULT_LOCALE}` : target };
}

export const _internal = { HUB_COUNTRIES };
