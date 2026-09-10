import { NextResponse } from 'next/server';
import { getLiveFixtures } from '@/lib/api-football';
import { TRACKED_LEAGUE_IDS } from '@/lib/leagues';

// Backs the Home live-matches widget. A thin proxy (not a direct client call
// to API-Football) so the API key stays server-only and Next's fetch cache
// absorbs the widget's 30s client polling into one upstream call per window.
export const revalidate = 15;

export async function GET() {
  const fixtures = await getLiveFixtures(TRACKED_LEAGUE_IDS);
  return NextResponse.json(
    { fixtures },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30' } },
  );
}
