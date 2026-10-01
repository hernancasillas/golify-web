// Referee lookup. The provider has no referee entity (no id, no endpoint):
// the only trace of a referee is the `fixture.referee` string on each match
// ("Guillermo Pacheco Larios, Mexico"). So a referee page is resolved by
// scanning the season fixture lists of the domestic leagues we cover — the
// same cached lists the competition pages already use — for fixtures whose
// referee slugs to the requested one.
//
// Cost: one cached /leagues + one cached /fixtures?league&season per covered
// domestic league (shared with the league pages, so normally warm), plus the
// previous season only for the league(s) where the referee was found.

import { currentSeason, getLeagueInfoCached, getSeasonFixtures, TTL, type Fixture } from '@/lib/api-football';
import { COMPETITIONS } from '@/lib/competitions';
import { refereeSlug } from '@/lib/routes';
import { refereeName } from '@/lib/slug';

const DOMESTIC = COMPETITIONS.filter((c) => c.kind === 'league');

export interface RefereeRecord {
  slug: string;
  /** Display name: the most frequent spelling among his matches. */
  name: string;
  /** Country suffix the provider gives ("Mexico"), when it gives one. */
  country: string | null;
  /** Every match found (any status), newest first. */
  fixtures: Fixture[];
}

export type RefereeLookup = { kind: 'found'; record: RefereeRecord } | { kind: 'redirect'; slug: string } | null;

interface LeagueSeasons {
  leagueId: number;
  current: number | null;
  previous: number | null;
}

async function leagueSeasons(leagueId: number): Promise<LeagueSeasons> {
  const info = await getLeagueInfoCached(leagueId, { strict: true });
  if (!info) return { leagueId, current: null, previous: null };
  const current = currentSeason(info);
  const years = info.seasons.map((s) => s.year).filter((y) => current != null && y < current).sort((a, b) => b - a);
  return { leagueId, current, previous: years[0] ?? null };
}

function slugOf(f: Fixture): string | null {
  return f.fixture.referee ? refereeSlug(f.fixture.referee) : null;
}

/** `strict` throughout: a failed list would otherwise hide matches and turn a
 *  real referee into a 404 or a thinner page. A thrown error keeps the last
 *  good ISR copy instead. */
export async function findReferee(slug: string): Promise<RefereeLookup> {
  const seasons = await Promise.all(DOMESTIC.map((c) => leagueSeasons(c.id)));
  const lists = await Promise.all(
    seasons.map((s) => (s.current ? getSeasonFixtures(s.leagueId, s.current, { strict: true, revalidate: TTL.hours }) : Promise.resolve([]))),
  );

  let found = lists.flat().filter((f) => slugOf(f) === slug);
  if (found.length === 0) {
    // "guillermo-pacheco" for "Guillermo Pacheco Larios": redirect when the
    // shorter form points at exactly one referee.
    const longer = new Set(
      lists
        .flat()
        .map(slugOf)
        .filter((s): s is string => !!s && s.startsWith(`${slug}-`)),
    );
    return longer.size === 1 ? { kind: 'redirect', slug: [...longer][0] } : null;
  }

  // Fill in the previous season, only where he was found.
  const leaguesFound = [...new Set(found.map((f) => f.league.id))];
  const prev = await Promise.all(
    leaguesFound.map((id) => {
      const s = seasons.find((x) => x.leagueId === id);
      return s?.previous ? getSeasonFixtures(id, s.previous, { strict: true, revalidate: TTL.daily }) : Promise.resolve([]);
    }),
  );
  const byId = new Map<number, Fixture>();
  for (const f of [...found, ...prev.flat().filter((x) => slugOf(x) === slug)]) byId.set(f.fixture.id, f);
  found = [...byId.values()];

  // An abbreviated name ("L. Garcia") can belong to two people in two
  // countries. Referees officiate one domestic league system, so keep the
  // country with the most matches and drop the rest.
  const byCountry = new Map<string, Fixture[]>();
  for (const f of found) byCountry.set(f.league.country, [...(byCountry.get(f.league.country) ?? []), f]);
  const fixtures = [...byCountry.values()]
    .sort((a, b) => b.length - a.length)[0]
    .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date));

  const spellings = new Map<string, number>();
  const countries = new Map<string, number>();
  for (const f of fixtures) {
    const raw = f.fixture.referee ?? '';
    const name = refereeName(raw);
    spellings.set(name, (spellings.get(name) ?? 0) + 1);
    const country = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1).trim() : '';
    if (country) countries.set(country, (countries.get(country) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ?? null;

  return {
    kind: 'found',
    record: {
      slug,
      name: top(spellings) ?? slug,
      country: top(countries),
      fixtures,
    },
  };
}
