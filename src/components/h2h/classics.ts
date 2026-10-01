// "Otros clásicos" on the H2H page: a fixed set of derbies people search the
// history of, linked so every H2H page passes crawl paths to the others.
//
// Ids and names are the provider's (API-Football /teams, checked 2026-10-01).
// The names only build the link slug: if the provider renames a club, the
// destination page redirects once to its new canonical slug, so a stale name
// costs a hop, never a broken link. The market decides which ones are shown
// first (a Brazilian reader sees the Brazilian derbies).

import type { TeamRef } from '@/lib/api-football';

type Side = Pick<TeamRef, 'id' | 'name'>;

export interface Classic {
  a: Side;
  b: Side;
  market: 'mx' | 'ar' | 'br' | 'co' | 'cl' | 'es';
}

const t = (id: number, name: string): Side => ({ id, name });

export const CLASSICS: Classic[] = [
  { a: t(2287, 'Club America'), b: t(2278, 'Guadalajara Chivas'), market: 'mx' },
  { a: t(2287, 'Club America'), b: t(2295, 'Cruz Azul'), market: 'mx' },
  { a: t(2287, 'Club America'), b: t(2286, 'U.N.A.M. - Pumas'), market: 'mx' },
  { a: t(2282, 'Monterrey'), b: t(2279, 'Tigres UANL'), market: 'mx' },
  { a: t(451, 'Boca Juniors'), b: t(435, 'River Plate'), market: 'ar' },
  { a: t(127, 'Flamengo'), b: t(121, 'Palmeiras'), market: 'br' },
  { a: t(127, 'Flamengo'), b: t(124, 'Fluminense'), market: 'br' },
  { a: t(131, 'Corinthians'), b: t(121, 'Palmeiras'), market: 'br' },
  { a: t(130, 'Gremio'), b: t(119, 'Internacional'), market: 'br' },
  { a: t(1137, 'Atletico Nacional'), b: t(1128, 'Independiente Medellin'), market: 'co' },
  { a: t(1125, 'Millonarios'), b: t(1139, 'Santa Fe'), market: 'co' },
  { a: t(2315, 'Colo Colo'), b: t(2323, 'Universidad de Chile'), market: 'cl' },
  { a: t(541, 'Real Madrid'), b: t(529, 'Barcelona'), market: 'es' },
];

/** Up to `n` derbies other than the current pair, the reader's market first. */
export function otherClassics(idA: number, idB: number, preferred: Classic['market'][], n = 6): Classic[] {
  const rank = (c: Classic) => {
    const i = preferred.indexOf(c.market);
    return i < 0 ? preferred.length : i;
  };
  return CLASSICS.filter((c) => !((c.a.id === idA && c.b.id === idB) || (c.a.id === idB && c.b.id === idA)))
    .map((c, i) => ({ c, i }))
    .sort((x, y) => rank(x.c) - rank(y.c) || x.i - y.i)
    .slice(0, n)
    .map((x) => x.c);
}
