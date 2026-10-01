// Tiny copy helpers shared by the watch / transfers / FC templates.

import { ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';

/** "{name} vs {x}" → values; unknown keys render empty. */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] == null ? '' : String(vars[k])));
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The [locale] param narrowed to the three route locales (the root layout
 *  already 404s anything else; this only satisfies the types). */
export function asLocale(v: string): RouteLocale {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : 'es';
}

/** Plural picker: plural(n, 'fichaje', 'fichajes'). */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
