// Small helpers the four competition templates share: breadcrumbs, which
// section tabs exist for a season, the canonical paths.

import type { Crumb } from '@/lib/seo';
import { competitionName, type Competition } from '@/lib/competitions';
import { competitionPath, homePath, type RouteLocale } from '@/lib/routes';
import { ui } from './i18n';
import type { SeasonCtx } from './data';
import type { SeasonTab } from './ui';

export type SectionKey = 'table' | 'scorers' | 'assists' | 'cards' | 'fixtures';

export function hubCrumbs(comp: Competition, locale: RouteLocale): Crumb[] {
  const t = ui(locale);
  return [
    { name: t.home, path: homePath(locale) },
    { name: competitionName(comp, locale), path: competitionPath(locale, comp.id)! },
  ];
}

export function seasonCrumbs(ctx: SeasonCtx, locale: RouteLocale, seasonText: string): Crumb[] {
  return [...hubCrumbs(ctx.comp, locale), { name: seasonText, path: competitionPath(locale, ctx.comp.id, ctx.slug)! }];
}

/** Tabs a season does not have: no standings coverage (most cups), or no
 *  top-list coverage. */
export function hiddenTabs(ctx: SeasonCtx): SeasonTab[] {
  const cov = ctx.meta.coverage;
  const out: SeasonTab[] = [];
  if (cov?.standings === false) out.push('table');
  if (cov?.top_scorers === false) out.push('scorers');
  if (cov?.top_assists === false) out.push('assists');
  if (cov?.top_cards === false) out.push('cards');
  return out;
}

export function countryLabel(ctx: { info: { country: { name: string } } }, locale: RouteLocale): string {
  const n = ctx.info.country.name;
  if (n === 'World') return locale === 'es' ? 'Internacional' : locale === 'pt' ? 'Internacional' : 'International';
  const MAP: Record<string, Record<RouteLocale, string>> = {
    Mexico: { es: 'México', pt: 'México', en: 'Mexico' },
    Brazil: { es: 'Brasil', pt: 'Brasil', en: 'Brazil' },
    Argentina: { es: 'Argentina', pt: 'Argentina', en: 'Argentina' },
    Colombia: { es: 'Colombia', pt: 'Colômbia', en: 'Colombia' },
    Ecuador: { es: 'Ecuador', pt: 'Equador', en: 'Ecuador' },
    Chile: { es: 'Chile', pt: 'Chile', en: 'Chile' },
    USA: { es: 'Estados Unidos', pt: 'Estados Unidos', en: 'United States' },
    England: { es: 'Inglaterra', pt: 'Inglaterra', en: 'England' },
    Spain: { es: 'España', pt: 'Espanha', en: 'Spain' },
    Italy: { es: 'Italia', pt: 'Itália', en: 'Italy' },
    Germany: { es: 'Alemania', pt: 'Alemanha', en: 'Germany' },
    France: { es: 'Francia', pt: 'França', en: 'France' },
    Portugal: { es: 'Portugal', pt: 'Portugal', en: 'Portugal' },
    'Saudi-Arabia': { es: 'Arabia Saudita', pt: 'Arábia Saudita', en: 'Saudi Arabia' },
    Peru: { es: 'Perú', pt: 'Peru', en: 'Peru' },
    Uruguay: { es: 'Uruguay', pt: 'Uruguai', en: 'Uruguay' },
    Paraguay: { es: 'Paraguay', pt: 'Paraguai', en: 'Paraguay' },
    Bolivia: { es: 'Bolivia', pt: 'Bolívia', en: 'Bolivia' },
    Venezuela: { es: 'Venezuela', pt: 'Venezuela', en: 'Venezuela' },
    Netherlands: { es: 'Países Bajos', pt: 'Holanda', en: 'Netherlands' },
  };
  return MAP[n]?.[locale] ?? n;
}

export function kindLabel(comp: Competition, locale: RouteLocale): string {
  if (comp.kind === 'cup') return locale === 'es' ? 'Copa' : locale === 'pt' ? 'Copa' : 'Cup';
  return locale === 'es' ? 'Liga' : locale === 'pt' ? 'Liga' : 'League';
}
