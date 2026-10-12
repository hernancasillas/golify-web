'use client';

import { useEffect } from 'react';

// Live scores without regenerating pages. Server-rendered rows of matches in
// play carry `data-live-fixture="<id>"`, with `[data-score="home|away"]` and
// `[data-minute]` inside; this patches those nodes from /api/live-fixtures
// (one CDN-cached call shared by every visitor). It polls only while a live
// row is on the page and the tab is visible, and stops once the feed no longer
// lists any of them (the watcher has the page rebuilt at full time).

const POLL_MS = 30_000;

interface FeedRow {
  fixture: { id: number; status: { short: string; elapsed: number | null } };
  goals: { home: number | null; away: number | null };
}

export function LiveScoreUpdater({ htLabel }: { htLabel: string }) {
  useEffect(() => {
    const rows = () => Array.from(document.querySelectorAll<HTMLElement>('[data-live-fixture]'));
    if (rows().length === 0) return;

    let stopped = false;
    let misses = 0;

    const setText = (root: HTMLElement, sel: string, v: string) => {
      const el = root.querySelector(sel);
      if (el && el.textContent !== v) el.textContent = v;
    };

    async function tick() {
      if (stopped || document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/live-fixtures', { cache: 'no-store' });
        if (!res.ok) return;
        const { fixtures = [] } = (await res.json()) as { fixtures?: FeedRow[] };
        const byId = new Map(fixtures.map((f) => [String(f.fixture.id), f]));
        let seen = 0;
        for (const row of rows()) {
          const f = byId.get(row.dataset.liveFixture ?? '');
          if (!f) continue;
          seen++;
          if (f.goals.home != null) setText(row, '[data-score="home"]', String(f.goals.home));
          if (f.goals.away != null) setText(row, '[data-score="away"]', String(f.goals.away));
          const s = f.fixture.status;
          if (s.short === 'HT') setText(row, '[data-minute]', htLabel);
          else if (s.elapsed != null) setText(row, '[data-minute]', `${s.elapsed}'`);
        }
        // An empty feed is as likely a hiccup as a final whistle: only give up
        // when the feed answers with other matches and none of ours, twice.
        if (seen > 0) misses = 0;
        else if (fixtures.length > 0 && ++misses >= 2) stopped = true;
      } catch {
        // Network blip: keep the last score, try again next tick.
      }
    }

    void tick();
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [htLabel]);

  return null;
}
