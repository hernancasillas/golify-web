// Latest editorial pieces for cross-site blocks (Home "Reportajes y previas").
// Backed by the editorial loader (src/lib/editorial); returns nothing when the
// locale has no pieces and the block simply does not render.

import type { RouteLocale } from '@/lib/routes';
import { getAuthor, getPieces, piecePath, sectionLabel } from '@/lib/editorial/content';

export interface PieceSummary {
  kind: 'guide' | 'news' | 'report';
  title: string;
  path: string;
  /** "Guía", "Previa · Liga MX" … */
  label: string;
  byline: string;
  /** ISO date of last update */
  updated: string;
}

const GUIDE = { es: 'Guía', pt: 'Guia', en: 'Guide' } as const;

export async function latestPieces(locale: RouteLocale, limit = 4): Promise<PieceSummary[]> {
  const pieces: PieceSummary[] = getPieces()
    .filter((p) => p.locale === locale)
    .map((p) => ({
      kind: p.kind,
      title: p.title,
      path: piecePath(p),
      label: p.kind === 'guide' ? GUIDE[locale] : sectionLabel(p.section ?? 'noticia', locale),
      byline: getAuthor(p.author)?.name ?? 'Redacción Golify',
      updated: p.updated,
    }));
  // Monthly reports are not listed here: whether one passes its indexing
  // threshold is only known after querying community data (see report page).
  return pieces.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, limit);
}
