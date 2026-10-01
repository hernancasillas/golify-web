'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isLiveShort, statusText, type MatchLocale } from './status';

// Live layer on top of the indexable HTML (plan A7). The server renders the
// score and minute the crawler reads; while the match is being played this
// component keeps them current by polling /api/live-fixtures, which is one
// shared `live=all` call behind a 15 s cache — a thousand open tabs still
// cost the API quota one request per window.
//
// It never polls a match that is not live (or that the feed does not carry),
// and it stops as soon as the match drops out of the live list (final
// whistle): then it asks the router for a fresh copy of the page, which
// brings in the final-state blocks. A goal, and every third tick, also
// trigger a refresh (an ISR copy, no API cost), so the timeline and stats
// below catch up with the score.

const POLL_MS = 20_000;

export interface LiveState {
  home: number | null;
  away: number | null;
  short: string;
  elapsed: number | null;
  extra: number | null;
}

interface LiveFixture {
  fixture: { id: number; status: { short: string; elapsed: number | null; extra?: number | null } };
  goals: { home: number | null; away: number | null };
}

export function LiveScore({
  fixtureId,
  locale,
  initial,
  pollable,
}: {
  fixtureId: number;
  locale: MatchLocale;
  initial: LiveState;
  pollable: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<LiveState>(initial);
  const live = isLiveShort(state.short);
  const played = state.home != null && state.away != null;

  useEffect(() => {
    if (!pollable || !isLiveShort(initial.short)) return;
    let stopped = false;
    let misses = 0;
    let goals = `${initial.home}-${initial.away}`;
    let ticks = 0;

    async function tick() {
      if (stopped || document.visibilityState === 'hidden') return;
      ticks++;
      try {
        const res = await fetch('/api/live-fixtures', { cache: 'no-store' });
        if (!res.ok) return;
        const json: { fixtures?: LiveFixture[] } = await res.json();
        const list = json.fixtures ?? [];
        const hit = list.find((x) => x.fixture.id === fixtureId);
        if (hit) {
          misses = 0;
          const now = `${hit.goals.home}-${hit.goals.away}`;
          if (now !== goals || ticks % 3 === 0) {
            goals = now;
            router.refresh();
          }
          setState({
            home: hit.goals.home,
            away: hit.goals.away,
            short: hit.fixture.status.short,
            elapsed: hit.fixture.status.elapsed,
            extra: hit.fixture.status.extra ?? null,
          });
          return;
        }
        // Only count a miss when the feed answered with other matches: an
        // empty list is as likely to be a hiccup as a final whistle.
        if (list.length > 0 && ++misses >= 2) {
          stopped = true;
          router.refresh();
        }
      } catch {
        // Network blip: keep the last known score and try again next tick.
      }
    }

    const timer = window.setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
    // A changed `initial` only matters through a remount (the parent keys it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId, pollable, router]);

  return (
    <div className="flex flex-col items-center gap-2" aria-live={live ? 'polite' : undefined}>
      <div className="font-display text-4xl font-bold tabular-nums sm:text-5xl">
        {played ? (
          <>
            {state.home}
            <span className="px-2 text-muted-foreground">-</span>
            {state.away}
          </>
        ) : (
          <span className="text-muted-foreground">VS</span>
        )}
      </div>
      {live ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-live-glow px-3 py-1 text-xs font-extrabold tracking-wide text-live uppercase">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
          {statusText(state, locale)}
        </span>
      ) : (
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {statusText(state, locale)}
        </span>
      )}
    </div>
  );
}
