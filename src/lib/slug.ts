// URL slugs. One rule for every entity so a link built on one page always
// matches the canonical URL the destination page computes for itself: if the
// two disagreed, every internal link would cost a redirect hop.
//
// Format (plan §0.3): lowercase, no accents, words joined by hyphens, and the
// numeric id at the end when the entity has one: `toluca-vs-america-1490500`.

// Letters NFD does not decompose into base + accent.
const SPECIAL: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ı: 'i',
};

// Club-type prefixes that carry no search value ("Club America" is searched
// as "america"). Only stripped when a real name remains after them.
const PREFIXES = new Set(['club', 'cd', 'cf', 'fc', 'ca', 'sc', 'ac', 'afc', 'cs', 'se', 'ec']);

export function slugify(input: string | null | undefined): string {
  // Provider rows occasionally carry a null name; never crash a page on it.
  const base = (input ?? '')
    .toLowerCase()
    .replace(/[ßæœøłđðþı]/g, (c) => SPECIAL[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'x';
}

/** Team names without the "Club"/"FC" noise: "Club America" → "america". */
export function teamSlug(name: string): string {
  const parts = slugify(name).split('-');
  while (parts.length > 1 && PREFIXES.has(parts[0])) parts.shift();
  while (parts.length > 1 && PREFIXES.has(parts[parts.length - 1])) parts.pop();
  return parts.join('-');
}

/** `{slug}-{id}` */
export function withId(slug: string, id: number | string): string {
  return `${slug}-${id}`;
}

/** Trailing numeric id of a slug param (`toluca-2281` → 2281, `2281` → 2281). */
export function idFromSlug(param: string): number | null {
  const m = /(?:^|-)(\d+)$/.exec(param);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Two trailing ids (`america-vs-chivas-2278-2287` → [2278, 2287]). */
export function idPairFromSlug(param: string): [number, number] | null {
  const m = /-(\d+)-(\d+)$/.exec(param);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a > 0 && b > 0 ? [a, b] : null;
}

/** True when the param is a bare id with no slug text (a legacy URL). */
export function isBareId(param: string): boolean {
  return /^\d+$/.test(param);
}

/** Referee strings come as "M. Oliver, England": the slug keeps the name. */
export function refereeName(raw: string): string {
  return raw.split(',')[0].trim();
}
