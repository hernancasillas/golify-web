// Param resolution shared by the season page and its sub-pages. Every
// non-canonical spelling leaves with ONE permanent redirect to the final URL:
// legacy bare id, a split league's bare year, a wrong-language section.

import { notFound, permanentRedirect } from 'next/navigation';
import { competitionPath, subsection, subsectionFromSegment, SUBSECTIONS, type RouteLocale } from '@/lib/routes';
import { loadLeague, resolveCompetitionParam, resolveSeason, type SeasonCtx } from './data';
import { asLocale } from './i18n';
import type { SectionKey } from './page-helpers';

export type SectionSpec = { kind: 'section'; key: SectionKey } | { kind: 'round'; number: number };

type Section = Parameters<typeof competitionPath>[3];

function toBuilder(s: SectionSpec | null): Section {
  if (!s) return undefined;
  return s.kind === 'round' ? { round: s.number } : s.key;
}

const SECTION_KEYS: SectionKey[] = ['table', 'scorers', 'assists', 'cards', 'fixtures'];

/** Section segment in any language → spec + whether it is this locale's spelling. */
export function parseSection(segment: string, locale: RouteLocale): { spec: SectionSpec; canonical: boolean } | null {
  const hit = subsectionFromSegment(segment, SECTION_KEYS);
  if (hit) {
    const key = hit.key as SectionKey;
    return { spec: { kind: 'section', key }, canonical: subsection(key, locale) === segment };
  }
  const words = Object.values(SUBSECTIONS.round).join('|');
  const m = new RegExp(`^(${words})-(\\d{1,3})$`).exec(segment);
  if (m) {
    const n = Number(m[2]);
    if (n < 1) return null;
    return { spec: { kind: 'round', number: n }, canonical: m[1] === subsection('round', locale) && String(n) === m[2] };
  }
  return null;
}

export async function loadSeasonParams(p: { locale: string; slug: string; season: string; section?: string }): Promise<{
  locale: RouteLocale;
  ctx: SeasonCtx;
  section: SectionSpec | null;
}> {
  const locale = asLocale(p.locale);
  if (locale !== p.locale) notFound();
  const res = resolveCompetitionParam(p.slug);
  if (res.kind === 'none') notFound();
  let section: SectionSpec | null = null;
  let sectionCanonical = true;
  if (p.section !== undefined) {
    const s = parseSection(p.section, locale);
    if (!s) notFound();
    section = s.spec;
    sectionCanonical = s.canonical;
  }
  const comp = res.comp;
  const info = await loadLeague(comp.id);
  if (!info) notFound();
  const season = await resolveSeason(comp, info, p.season);
  if (season.kind === 'notfound') notFound();
  const slug = season.kind === 'redirect' ? season.slug : season.ctx.slug;
  if (res.kind === 'legacy' || season.kind === 'redirect' || !sectionCanonical) {
    permanentRedirect(competitionPath(locale, comp.id, slug, toBuilder(section))!);
  }
  return { locale, ctx: season.ctx, section };
}
