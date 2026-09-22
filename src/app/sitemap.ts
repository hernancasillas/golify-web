import type { MetadataRoute } from 'next';
import { SITE_URL, LOCALES, DEFAULT_LOCALE } from '@/lib/site';
import { TRACKED_LEAGUES, TRACKED_LEAGUE_IDS } from '@/lib/leagues';
import {
  getFixturesByDate,
  getStandings,
  getLeagueInfoCached,
  currentSeason,
} from '@/lib/api-football';

export const revalidate = 3600;

// The leagues whose squads we expose to crawlers as team pages. Keeping this
// to the markets we are pushing into bounds the number of API calls this
// sitemap makes per hour, and keeps the file focused on pages people search
// for rather than every team in the world.
const TEAM_PAGE_LEAGUES = [
  262, // Liga MX
  71, // Brasileirão
  128, // Liga Argentina
  13, // Copa Libertadores
  253, // MLS
];

// How far ahead we advertise fixtures. Match pages are worth crawling before
// kickoff (that is when "X vs Y" gets searched) and stay useful afterwards as
// the result page, so today plus the next two days is the sweet spot.
const FIXTURE_DAYS = 3;

function localized(path: string, priority?: number): MetadataRoute.Sitemap {
  // One entry per locale + hreflang alternates for international ranking.
  // x-default included: without it a visitor whose language we do not publish
  // (a Brazilian on pt-BR today) has no declared fallback.
  const languages: Record<string, string> = {
    'x-default': `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
  };
  for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}${path}`;

  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    priority,
    alternates: { languages },
  }));
}

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function fixtureEntries(): Promise<MetadataRoute.Sitemap> {
  const days = await Promise.all(
    Array.from({ length: FIXTURE_DAYS }, (_, i) =>
      getFixturesByDate(isoDate(i), TRACKED_LEAGUE_IDS),
    ),
  );
  const seen = new Set<number>();
  const entries: MetadataRoute.Sitemap = [];
  for (const fixture of days.flat()) {
    if (seen.has(fixture.fixture.id)) continue;
    seen.add(fixture.fixture.id);
    entries.push(
      ...localized(`/match/${fixture.fixture.id}`, 0.6).map((e) => ({
        ...e,
        changeFrequency: 'hourly' as const,
      })),
    );
  }
  return entries;
}

async function teamEntries(): Promise<MetadataRoute.Sitemap> {
  const perLeague = await Promise.all(
    TEAM_PAGE_LEAGUES.map(async (id) => {
      const info = await getLeagueInfoCached(id);
      const season = info ? currentSeason(info) : null;
      if (!season) return [];
      const groups = await getStandings(id, season);
      return groups.flatMap((g) => g.rows.map((r) => r.team.id));
    }),
  );
  const ids = [...new Set(perLeague.flat())];
  return ids.flatMap((id) => localized(`/team/${id}`, 0.5));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages, highest intent first.
  const staticPaths: [string, number][] = [
    ['', 1],
    ['/today', 0.9],
    ['/live', 0.9],
    ['/world-cup', 0.7],
    ['/world-cup/bracket', 0.7],
    ['/features', 0.5],
    ['/nosotros', 0.4],
    ['/privacy', 0.2],
    ['/terms', 0.2],
  ];

  const staticEntries = staticPaths.flatMap(([path, priority]) =>
    localized(path, priority),
  );
  const leagueEntries = TRACKED_LEAGUES.flatMap((l) =>
    localized(`/league/${l.id}`, 0.8),
  );

  // A sitemap that throws takes the whole route down, and a missing API key in
  // a preview build would do exactly that. Degrade to the static list instead.
  const [fixtures, teams] = await Promise.all([
    fixtureEntries().catch(() => []),
    teamEntries().catch(() => []),
  ]);

  return [...staticEntries, ...leagueEntries, ...fixtures, ...teams];
}
