// One entry point from a public slug to the data of a download. The page
// (/es/descargas/{slug}) and the file route (/files/{locale}/{slug}.{ext}) both
// call it, so a redirect, a 404 and the printed rows are decided in one place.

import { localizeDeep } from '@/lib/nations';
import type { StandingsGroup } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import {
  loadBracket,
  loadCalendar,
  loadQuiniela,
  loadSeasonBySlug,
  loadStickers,
  loadTable,
  type BracketData,
  type CalendarData,
  type LeagueSeason,
  type QuinielaData,
  type Sticker,
} from './data';
import {
  CHECKLIST_SLUG,
  KIT_SLUG,
  bracketSlug,
  calendarSlug,
  parseDownloadSlug,
  posterSlug,
  quinielaSlug,
} from './slugs';

export type Resolved =
  | { kind: 'redirect'; slug: string }
  | { kind: 'quiniela'; slug: string; q: QuinielaData }
  | { kind: 'calendar'; slug: string; cal: CalendarData }
  | { kind: 'bracket'; slug: string; b: BracketData }
  | { kind: 'poster'; slug: string; season: LeagueSeason; table: StandingsGroup[] }
  /** stickers null = the catalogue could not be read (honest noindex page). */
  | { kind: 'checklist'; slug: string; stickers: Sticker[] | null }
  | { kind: 'kit'; slug: string };

export type Download = Exclude<Resolved, { kind: 'redirect' }>;

function settle(raw: string, canonical: string | null, value: Download): Resolved | null {
  if (!canonical) return null;
  return raw === canonical ? value : { kind: 'redirect', slug: canonical };
}

/** null → 404. Throws when the provider fails (ISR keeps the last good copy). */
export async function resolveDownload(raw: string, locale: RouteLocale): Promise<Resolved | null> {
  const r = await resolveRaw(raw, locale);
  // Slugs were built from the provider's English names above; only the
  // printed rows (pages, PDFs, ICS) carry the reader's language.
  return r && r.kind !== 'redirect' ? localizeDeep(r, locale) : r;
}

async function resolveRaw(raw: string, locale: RouteLocale): Promise<Resolved | null> {
  const ref = parseDownloadSlug(raw);
  if (!ref) return null;
  switch (ref.kind) {
    case 'checklist': {
      let stickers: Sticker[] | null = null;
      try {
        stickers = await loadStickers();
      } catch (e) {
        console.error('[downloads] sticker catalogue unreadable', e);
      }
      return settle(raw, CHECKLIST_SLUG, { kind: 'checklist', slug: CHECKLIST_SLUG, stickers: stickers?.length ? stickers : null });
    }
    case 'kit':
      return settle(raw, KIT_SLUG, { kind: 'kit', slug: KIT_SLUG });
    case 'quiniela': {
      const q = await loadQuiniela(ref.leagueId, ref.round);
      if (!q) return null;
      const slug = quinielaSlug(locale, ref.leagueId, ref.round);
      return slug ? settle(raw, slug, { kind: 'quiniela', slug, q }) : null;
    }
    case 'calendar': {
      const r = await loadCalendar(ref.teamId, ref.seasonSlug);
      if (r.status === 'missing') return null;
      if (r.status === 'redirect') {
        return { kind: 'redirect', slug: calendarSlug(locale, { id: ref.teamId, name: r.teamName }, r.seasonSlug) };
      }
      const slug = calendarSlug(locale, r.data.team, r.data.seasonSlug);
      return settle(raw, slug, { kind: 'calendar', slug, cal: r.data });
    }
    case 'bracket':
    case 'poster': {
      const s = await loadSeasonBySlug(ref.leagueId, ref.seasonSlug);
      if (s.status === 'missing') return null;
      const build = ref.kind === 'bracket' ? bracketSlug : posterSlug;
      if (s.status === 'redirect') {
        const slug = build(ref.leagueId, s.seasonSlug);
        return slug ? { kind: 'redirect', slug } : null;
      }
      const slug = build(ref.leagueId, s.season.seasonSlug);
      if (!slug) return null;
      if (raw !== slug) return { kind: 'redirect', slug };
      if (ref.kind === 'bracket') return { kind: 'bracket', slug, b: await loadBracket(s.season) };
      return { kind: 'poster', slug, season: s.season, table: await loadTable(s.season) };
    }
  }
}

/** Indexing threshold (plan A4/B3): the page's data exists. */
export function isIndexable(d: Download): boolean {
  switch (d.kind) {
    case 'quiniela':
      return d.q.fixtures.length > 0;
    case 'calendar':
      return d.cal.fixtures.length > 0;
    case 'bracket':
      return !!d.b.bracket;
    case 'poster':
      return d.season.phaseFixtures.length > 0 && d.table.some((g) => g.rows.length > 0);
    case 'checklist':
      return !!d.stickers;
    case 'kit':
      return true;
  }
}
