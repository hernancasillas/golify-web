// Match watcher (vercel.json: every 5 minutes). Pages are rebuilt when a match
// changes, not on a timer: this route finds the changes and invalidates the
// cache tags of the data that moved (see cacheTags in src/lib/api-football.ts).
// revalidateTag(…, 'max') only marks entries stale — a page is rebuilt on its
// next visit, so a tag nobody reads costs nothing.
//
// Cost when no covered match is near: zero API calls. It reads three cached
// day lists (6 h window) and exits. With matches on: one /fixtures?ids= call
// per 20 active matches every 5 minutes.
//
// Events:
//   kickoff, full time, postponement  → fx:<id> + date:<day ±1>
//   full time                          → also league:<id>, team:<home>, team:<away>
//   lineups out (last hour pre-match)  → fx:<id>
//   midnight in a board's zone         → date:<previous day> (boards move to the new "today")

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { apiFootballGet, fixturePhase, getFixturesByDate, TAG, type Fixture, type FixtureDetail } from '@/lib/api-football';
import { COVERED_IDS } from '@/lib/competitions';
import { HUB_COUNTRY_INFO, isoDateIn } from '@/lib/timezones';
import { addDays, LOCALE_ZONE } from '@/components/hubs/data';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const CADENCE = 5 * MIN;
/** A match is watched from 75 min before kickoff (lineups) until 6 h after
 *  (90' + half time + added time + extra time, plus slack for delays). */
const BEFORE = 75 * MIN;
const AFTER = 6 * 60 * MIN;

/** Every zone that decides which day a board shows. */
const ZONES = [...new Set([...Object.values(LOCALE_ZONE).map((z) => z.zone), ...Object.values(HUB_COUNTRY_INFO).map((c) => c.zone)])];

const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const tags = new Set<string>();

  // 1. Midnight: a board rendered yesterday read date:<yesterday>. Looking one
  //    cadence (plus a minute of cron jitter) back catches every rollover once.
  for (const zone of ZONES) {
    const before = isoDateIn(new Date(now - CADENCE - MIN), zone);
    if (before !== isoDateIn(new Date(now), zone)) tags.add(TAG.date(before));
  }

  // 2. Matches near their kickoff, from the cached UTC day lists (the same
  //    entries getFixturesByDate serves everywhere else). No API call unless
  //    an entry is past its 6 h window.
  const lists = await Promise.all([-1, 0, 1].map((d) => getFixturesByDate(utcDay(now + d * DAY), COVERED_IDS)));
  const known = new Map<number, Fixture>();
  for (const f of lists.flat()) known.set(f.fixture.id, f);
  const active = [...known.values()].filter((f) => {
    const phase = fixturePhase(f);
    if (phase !== 'scheduled' && phase !== 'live') return false;
    const kickoff = Date.parse(f.fixture.date);
    return now >= kickoff - BEFORE && now <= kickoff + AFTER;
  });

  // 3. Their current state: one call per 20 ids, cached 2 min so an overlapping
  //    run never pays twice. While the web's API share is spent this returns
  //    nothing and the run is a no-op.
  let checked = 0;
  for (let i = 0; i < active.length; i += 20) {
    const ids = active.slice(i, i + 20).map((f) => f.fixture.id);
    const fresh = await apiFootballGet<FixtureDetail>('/fixtures', { ids: ids.join('-') }, { revalidate: 120, bucket: 'watch' });
    for (const f of fresh) {
      const before = known.get(f.fixture.id);
      if (!before) continue;
      checked++;
      const was = fixturePhase(before);
      const is = fixturePhase(f);
      const kickoff = Date.parse(f.fixture.date);

      if (was !== is) {
        tags.add(TAG.fixture(f.fixture.id));
        // Boards in any zone may list it under the UTC day or either neighbour.
        const day = utcDay(kickoff);
        for (const d of [addDays(day, -1), day, addDays(day, 1)]) tags.add(TAG.date(d));
        if (is === 'finished' || is === 'off') {
          tags.add(TAG.league(f.league.id));
          tags.add(TAG.team(f.teams.home.id));
          tags.add(TAG.team(f.teams.away.id));
        }
      } else if (is === 'scheduled' && kickoff - now <= 60 * MIN && (f.lineups?.length ?? 0) > 0) {
        tags.add(TAG.fixture(f.fixture.id));
      }
    }
  }

  for (const t of tags) revalidateTag(t, 'max');
  return NextResponse.json({ active: active.length, checked, invalidated: [...tags] });
}
