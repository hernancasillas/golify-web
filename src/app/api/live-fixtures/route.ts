import { NextResponse } from 'next/server';
import { getLiveFixtures } from '@/lib/api-football';
import { TRACKED_LEAGUE_IDS } from '@/lib/leagues';

// Backs every live-score poller (boards, match page, home widget). A thin
// proxy so the API key stays server-only. Dynamic, cached at the CDN for 15 s:
// however many visitors poll, the function runs at most once per 15 s per
// region. (It used to be an ISR route, which kept serving its build-time copy
// in production.)
export const dynamic = 'force-dynamic';

export async function GET() {
  const fixtures = await getLiveFixtures(TRACKED_LEAGUE_IDS);
  return NextResponse.json(
    { fixtures },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30' } },
  );
}
