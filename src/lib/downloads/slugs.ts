// Slug grammar of the printable downloads (plan B3). Other sections link to
// these exact slugs, so the builders here are the contract:
//
//   quiniela-{leagueSlug}-{roundWord}-{n}        roundWord = jornada / rodada / matchday
//   calendario-{teamSlug}-{seasonSlug}-{teamId}  es + pt ("calendario" is Portuguese too)
//   calendar-{teamSlug}-{seasonSlug}-{teamId}    en
//   llaves-{leagueSlug}-{seasonSlug}             knockout bracket to fill in (all locales)
//   poster-{leagueSlug}-{seasonSlug}             season poster (all locales)
//   checklist-album-golify                       album checklist (all locales)
//   kit-quiniela-oficina                         office-pool kit, email-gated (all locales)
//
// Only the round word of the quiniela and the calendar prefix change with the
// language; everything else is one spelling everywhere so a link built in one
// locale never needs to know the other two. The parser accepts every
// spelling in any locale and the page 308s to the canonical one.
//
// Pure module (no server imports): safe for client components and scripts.

import {
  COMPETITION_SLUGS,
  COMPETITION_SLUG_BY_ID,
  sectionPath,
  subsection,
  type RouteLocale,
} from '@/lib/routes';
import { teamSlug } from '@/lib/slug';

export const CHECKLIST_SLUG = 'checklist-album-golify';
export const KIT_SLUG = 'kit-quiniela-oficina';

export type DownloadRef =
  | { kind: 'quiniela'; leagueId: number; round: number }
  | { kind: 'calendar'; teamId: number; teamSlug: string; seasonSlug: string }
  | { kind: 'bracket'; leagueId: number; seasonSlug: string }
  | { kind: 'poster'; leagueId: number; seasonSlug: string }
  | { kind: 'checklist' }
  | { kind: 'kit' };

export type DownloadKind = DownloadRef['kind'];

export type FileExt = 'pdf' | 'csv' | 'xlsx' | 'ics';

// ---- Builders ------------------------------------------------------------

export function quinielaSlug(locale: RouteLocale, leagueId: number, round: number): string | null {
  const league = COMPETITION_SLUG_BY_ID[leagueId];
  if (!league) return null;
  return `quiniela-${league}-${subsection('round', locale)}-${round}`;
}

export function calendarPrefix(locale: RouteLocale): string {
  return locale === 'en' ? 'calendar' : 'calendario';
}

export function calendarSlug(
  locale: RouteLocale,
  team: { id: number; name: string },
  seasonSlug: string,
): string {
  return `${calendarPrefix(locale)}-${teamSlug(team.name)}-${seasonSlug}-${team.id}`;
}

export function bracketSlug(leagueId: number, seasonSlug: string): string | null {
  const league = COMPETITION_SLUG_BY_ID[leagueId];
  return league ? `llaves-${league}-${seasonSlug}` : null;
}

export function posterSlug(leagueId: number, seasonSlug: string): string | null {
  const league = COMPETITION_SLUG_BY_ID[leagueId];
  return league ? `poster-${league}-${seasonSlug}` : null;
}

/** Canonical slug of a parsed reference in a locale (team name needed for calendars). */
export function canonicalSlug(ref: DownloadRef, locale: RouteLocale, teamName?: string): string | null {
  switch (ref.kind) {
    case 'quiniela':
      return quinielaSlug(locale, ref.leagueId, ref.round);
    case 'calendar':
      return teamName ? calendarSlug(locale, { id: ref.teamId, name: teamName }, ref.seasonSlug) : null;
    case 'bracket':
      return bracketSlug(ref.leagueId, ref.seasonSlug);
    case 'poster':
      return posterSlug(ref.leagueId, ref.seasonSlug);
    case 'checklist':
      return CHECKLIST_SLUG;
    case 'kit':
      return KIT_SLUG;
  }
}

/** Public page of a download: /es/descargas/{slug}. */
export function downloadPath(locale: RouteLocale, slug: string): string {
  return sectionPath('downloads', locale, slug);
}

export function downloadsIndexPath(locale: RouteLocale): string {
  return sectionPath('downloads', locale);
}

/** Generated file: /files/{locale}/{slug}.{ext}. Lives outside the locale
 *  tree (the proxy skips /files) and is noindex by header (next.config). */
export function filePath(locale: RouteLocale, slug: string, ext: FileExt, size?: 'letter'): string {
  return `/files/${locale}/${slug}.${ext}${size === 'letter' ? '?size=letter' : ''}`;
}

// ---- Parser ----------------------------------------------------------------

const ROUND_WORDS = ['jornada', 'rodada', 'matchday', 'fecha'];
const SEASON_RE = /^(.*?)-?((?:apertura|clausura)-\d{4}|\d{4}-\d{4}|\d{4})$/;

/** Longest competition slug that prefixes `rest` followed by "-". */
function splitLeague(rest: string): { leagueId: number; tail: string } | null {
  let best: string | null = null;
  for (const slug of Object.keys(COMPETITION_SLUGS)) {
    if (rest.startsWith(`${slug}-`) && (!best || slug.length > best.length)) best = slug;
  }
  if (!best) return null;
  return { leagueId: COMPETITION_SLUGS[best], tail: rest.slice(best.length + 1) };
}

function isSeasonSlug(s: string): boolean {
  return /^(?:(?:apertura|clausura)-\d{4}|\d{4}-\d{4}|\d{4})$/.test(s);
}

export function parseDownloadSlug(slug: string): DownloadRef | null {
  const s = slug.toLowerCase();
  if (s === CHECKLIST_SLUG) return { kind: 'checklist' };
  if (s === KIT_SLUG) return { kind: 'kit' };

  let m = /^quiniela-(.+)-([a-z]+)-(\d{1,3})$/.exec(s);
  if (m && ROUND_WORDS.includes(m[2])) {
    const leagueId = COMPETITION_SLUGS[m[1]];
    const round = Number(m[3]);
    if (leagueId && round > 0) return { kind: 'quiniela', leagueId, round };
    return null;
  }

  m = /^(?:calendario|calendar)-(.+)-(\d+)$/.exec(s);
  if (m) {
    const teamId = Number(m[2]);
    const sm = SEASON_RE.exec(m[1]);
    if (!sm || !Number.isSafeInteger(teamId) || teamId <= 0) return null;
    return { kind: 'calendar', teamId, teamSlug: sm[1], seasonSlug: sm[2] };
  }

  m = /^(llaves|poster)-(.+)$/.exec(s);
  if (m) {
    const split = splitLeague(m[2]);
    if (!split || !isSeasonSlug(split.tail)) return null;
    return m[1] === 'llaves'
      ? { kind: 'bracket', leagueId: split.leagueId, seasonSlug: split.tail }
      : { kind: 'poster', leagueId: split.leagueId, seasonSlug: split.tail };
  }
  return null;
}

/** `{slug}.{ext}` of a /files request. */
export function parseFileName(name: string): { slug: string; ext: FileExt } | null {
  const m = /^([a-z0-9-]+)\.(pdf|csv|xlsx|ics)$/.exec(name.toLowerCase());
  return m ? { slug: m[1], ext: m[2] as FileExt } : null;
}

/** Formats each kind of download is published in. */
export const FORMATS: Record<DownloadKind, readonly FileExt[]> = {
  quiniela: ['pdf', 'xlsx', 'csv'],
  calendar: ['pdf', 'ics', 'csv'],
  bracket: ['pdf'],
  poster: ['pdf'],
  checklist: ['pdf', 'csv'],
  kit: ['pdf', 'xlsx'],
};
