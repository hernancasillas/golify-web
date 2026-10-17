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

    const setText = (root: HTMLElement, sel: string, v: string): boolean => {
      const el = root.querySelector(sel);
      if (!el || el.textContent === v) return false;
      el.textContent = v;
      return true;
    };

    // A score that moved is a goal: slide the broadcast "GOL" band over the
    // row for a few seconds and tell the home tribuna (Tribuna.tsx) so it can
    // repaint its mosaic. Not on the first tick, which only syncs the page.
    let first = true;
    const goal = (row: HTMLElement, side: 'home' | 'away', f: FeedRow) => {
      const band = row.querySelector<HTMLElement>('.fx-gol small');
      const team = row.querySelector(`[data-team="${side}"]`)?.textContent ?? '';
      if (band) band.textContent = `${team} · ${f.goals.home}–${f.goals.away}`;
      row.classList.add('is-goal');
      window.setTimeout(() => row.classList.remove('is-goal'), 3400);
      window.dispatchEvent(
        new CustomEvent('golify:goal', { detail: { id: f.fixture.id, home: f.goals.home, away: f.goals.away } }),
      );
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
          const homeMoved = f.goals.home != null && setText(row, '[data-score="home"]', String(f.goals.home));
          const awayMoved = f.goals.away != null && setText(row, '[data-score="away"]', String(f.goals.away));
          if (!first && (homeMoved || awayMoved)) goal(row, homeMoved ? 'home' : 'away', f);
          const s = f.fixture.status;
          if (s.short === 'HT') setText(row, '[data-minute]', htLabel);
          else if (s.elapsed != null) setText(row, '[data-minute]', `${s.elapsed}'`);
        }
        // An empty feed is as likely a hiccup as a final whistle: only give up
        // when the feed answers with other matches and none of ours, twice.
        first = false;
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
