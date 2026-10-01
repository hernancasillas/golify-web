// Daily IndexNow ping (vercel.json cron, "0 7 * * *"). Vercel Hobby only runs
// crons once a day; on Pro, change the schedule to "*/30 * * * *" so finished
// matches are announced within half an hour of the final whistle.
//
// Submits: matches finished in the last 26 h, matches of the next 2 days, and
// today's boards (hubs), in every locale. Bounded: 4 /fixtures?date calls.

import { NextResponse } from 'next/server';
import { getFixturesByDate, fixturePhase } from '@/lib/api-football';
import { COVERED_IDS } from '@/lib/competitions';
import { HUB_COUNTRIES, ROUTE_LOCALES, hubPath, matchPath, sectionPath } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';
import { submitUrls } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

const HOUR = 3600_000;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  // UTC dates from yesterday to the day after tomorrow cover "finished in
  // the last 26 h" and "kicks off in the next 48 h".
  const dates = [-1, 0, 1, 2].map((d) => new Date(now + d * 24 * HOUR).toISOString().slice(0, 10));
  const days = await Promise.all(dates.map((d) => getFixturesByDate(d, COVERED_IDS, undefined, { strict: true })));

  const paths: string[] = [];
  for (const f of days.flat()) {
    const t = new Date(f.fixture.date).getTime();
    const phase = fixturePhase(f);
    const recentlyFinished = phase === 'finished' && t >= now - 26 * HOUR;
    const upcoming = (phase === 'scheduled' || phase === 'live') && t <= now + 48 * HOUR;
    if (!recentlyFinished && !upcoming) continue;
    for (const l of ROUTE_LOCALES) paths.push(matchPath(l, f));
  }
  for (const l of ROUTE_LOCALES) {
    paths.push(sectionPath('today', l));
    for (const cc of HUB_COUNTRIES) paths.push(hubPath(l, cc));
  }

  const result = await submitUrls(paths.map((p) => `${SITE_URL}${p}`));
  return NextResponse.json({ urls: paths.length, ...result });
}
