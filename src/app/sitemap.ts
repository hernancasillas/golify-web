import type { MetadataRoute } from 'next';
import { SITE_URL, LOCALES, WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON } from '@/lib/site';
import { getWorldCupFixtures } from '@/lib/api-football';

// Revalidate the sitemap hourly — new fixtures/teams appear as the tournament
// progresses. Crawlers re-fetch and discover fresh content URLs automatically.
export const revalidate = 3600;

function localized(path: string): MetadataRoute.Sitemap {
  // Emit one entry per locale + hreflang alternates for international ranking.
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/world-cup', '/stickers', '/privacy', '/terms'];
  const entries: MetadataRoute.Sitemap = staticPaths.flatMap(localized);

  // Dynamic: every World Cup match + every team derived from the schedule.
  const fixtures = await getWorldCupFixtures(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON);

  const matchEntries = fixtures.flatMap((f) =>
    localized(`/match/${f.fixture.id}`).map((e) => ({
      ...e,
      lastModified: new Date(f.fixture.date),
    })),
  );

  const teamIds = new Set<number>();
  for (const f of fixtures) {
    teamIds.add(f.teams.home.id);
    teamIds.add(f.teams.away.id);
  }
  const teamEntries = [...teamIds].flatMap((id) => localized(`/team/${id}`));

  return [...entries, ...matchEntries, ...teamEntries];
}
