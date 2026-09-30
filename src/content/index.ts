// Latest editorial pieces for cross-site blocks (Home "Reportajes y previas").
// Implemented by the editorial section (src/lib/editorial/*); until then it
// returns nothing and the block does not render.

import type { RouteLocale } from '@/lib/routes';

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

export async function latestPieces(_locale: RouteLocale, _limit = 4): Promise<PieceSummary[]> {
  return [];
}
