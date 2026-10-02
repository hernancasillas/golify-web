// Which child files exist and how to build each one. The index route lists
// them; the [file] route resolves a requested name back to its generator.

import type { SitemapEntry, SitemapSource } from './types';
import { paginate, dedupe } from './xml';
import {
  PLAYER_LEAGUES,
  H2H_LEAGUES,
  staticEntries,
  hubEntries,
  dateEntries,
  matchMonths,
  matchEntries,
  teamEntries,
  stadiumEntries,
  competitionEntries,
  playerEntries,
  h2hEntries,
} from './children';
import { editorialSitemap } from './sources/editorial';
import { fcSitemap } from './sources/fc';
import { whereToWatchSitemap } from './sources/where-to-watch';
import { transfersSitemap } from './sources/transfers';
import { poolSitemap } from './sources/pool';
import { downloadsSitemap } from './sources/downloads';

/** Children contributed by other sections, one file each. */
const IMPORTED: SitemapSource[] = [
  ...editorialSitemap,
  ...fcSitemap,
  ...whereToWatchSitemap,
  ...transfersSitemap,
  ...poolSitemap,
  ...downloadsSitemap,
];

type Generator = () => Promise<SitemapEntry[]>;

const FIXED: Record<string, Generator> = {
  static: staticEntries,
  'hubs-pais': hubEntries,
  fechas: () => dateEntries(),
  torneos: competitionEntries,
  equipos: teamEntries,
  estadios: stadiumEntries,
};

// API-Football quota guard (2 oct 2026). The web shares the app's daily
// quota (75k). Once ~60k URLs reached the crawlers, every first visit to a
// player/H2H/FC/stadium page cost 5–12 API calls and the quota ran out for
// both web and app. Those families stay out of the sitemaps (the pages keep
// working and stay linked internally) until the web has its own API key:
// set GOLIFY_FULL_SITEMAPS=1 to bring them back.
const FULL = process.env.GOLIFY_FULL_SITEMAPS === '1';
const HEAVY = (name: string) => /^(jugadores-|h2h-|fc-|estadios)/.test(name);

/** Generator for an exact file name (without ".xml" and page suffix). */
function generator(name: string): Generator | null {
  if (!FULL && HEAVY(name)) return null;
  if (FIXED[name]) return FIXED[name];
  let m = /^partidos-(\d{4}-\d{2})$/.exec(name);
  if (m) {
    const month = m[1];
    return matchMonths().includes(month) ? () => matchEntries(month) : null;
  }
  m = /^jugadores-(.+)$/.exec(name);
  if (m) {
    const c = PLAYER_LEAGUES.find((x) => x.slug === m![1]);
    return c ? () => playerEntries(c) : null;
  }
  m = /^h2h-(.+)$/.exec(name);
  if (m) {
    const c = H2H_LEAGUES.find((x) => x.slug === m![1]);
    return c ? () => h2hEntries(c) : null;
  }
  const src = IMPORTED.find((s) => s.name === name);
  return src ? src.entries : null;
}

/** Resolve "partidos-2026-10" or "jugadores-liga-mx-2" to its page of
 *  entries. The exact name wins, so a name that ends in digits (a month) is
 *  never mistaken for a page number. Returns null for unknown files and for
 *  pages past the end. */
export async function resolveChild(file: string): Promise<SitemapEntry[] | null> {
  let gen = generator(file);
  let page = 1;
  if (!gen) {
    const m = /^(.+)-(\d+)$/.exec(file);
    if (!m || Number(m[2]) < 2) return null;
    gen = generator(m[1]);
    page = Number(m[2]);
  }
  if (!gen) return null;
  const pages = paginate(dedupe(await gen()));
  if (page > pages.length) return null;
  if (page === 1 && pages.length > 1 && !IMPORTED.some((s) => s.name === file)) {
    // Built-in children are sized to stay under the limit; if one grows past
    // it, its extra pages need listing in the index (imported ones are).
    console.warn(`sitemap ${file}: ${pages.length} pages, index lists only the first`);
  }
  return pages[page - 1];
}

/** Every child the index lists. Built-in names come from the calendar and
 *  the competition registry, never from the API. */
export async function childFiles(): Promise<string[]> {
  const files = [
    ...Object.keys(FIXED),
    ...matchMonths().map((m) => `partidos-${m}`),
    ...PLAYER_LEAGUES.map((c) => `jugadores-${c.slug}`),
    ...H2H_LEAGUES.map((c) => `h2h-${c.slug}`),
  ].filter((f) => FULL || !HEAVY(f));
  // Imported sources: count their pages. They are other sections' content
  // lists; if one fails here, still list its first file.
  for (const s of IMPORTED) {
    if (!FULL && HEAVY(s.name)) continue;
    let n = 1;
    try {
      n = paginate(dedupe(await s.entries())).length;
    } catch {
      n = 1;
    }
    files.push(s.name);
    for (let p = 2; p <= n; p++) files.push(`${s.name}-${p}`);
  }
  return files;
}
