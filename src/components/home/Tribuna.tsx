'use client';

import { useEffect, useRef } from 'react';

// The tribuna: the match of the moment held up as a card mosaic, the way a
// stand spells out a message with coloured cards. Every 9 s "la ola" runs
// across the stand and flips the cards; when LiveScoreUpdater reports a goal
// for this match (the `golify:goal` event) the wave repaints the new score.
//
// The score is also printed as text underneath (and in `.tifo-still` before
// the canvas starts), so the canvas is decoration: aria-hidden, no layout
// reads per frame, paused off-screen and in hidden tabs, one still frame under
// prefers-reduced-motion. Colours come from the --tifo-* tokens in globals.css,
// re-read when the theme changes.

type Tokens = { gap: string; a: string; b: string; on: string; back: string };

const PERIOD = 9000;
const GOAL_WAVE = 1800;

export function Tribuna({
  fixtureId,
  homeCode,
  awayCode,
  home,
  away,
}: {
  fixtureId: number;
  homeCode: string;
  awayCode: string;
  /** null before kickoff: the mosaic reads "SAN VS QRO". */
  home: number | null;
  away: number | null;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !box || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const score = { home, away };
    const text = () =>
      score.home == null || score.away == null
        ? `${homeCode} VS ${awayCode}`
        : `${homeCode} ${score.home}–${score.away} ${awayCode}`;

    let cols = 120;
    let rows = 42;
    let tone: number[] = [];
    let maskOld: boolean[] = [];
    let maskNew: boolean[] = [];
    let goalAt: number | null = null;
    let wave0 = 0;
    let visible = true;
    let raf = 0;
    const T: Tokens = { gap: '', a: '', b: '', on: '', back: '' };

    const off = document.createElement('canvas');
    const o = off.getContext('2d')!;

    function readTokens() {
      const s = getComputedStyle(document.documentElement);
      for (const k of Object.keys(T) as (keyof Tokens)[]) T[k] = s.getPropertyValue(`--tifo-${k}`).trim();
    }
    function raster(t: string): boolean[] {
      off.width = cols;
      off.height = rows;
      o.clearRect(0, 0, cols, rows);
      o.fillStyle = '#fff';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      const family = getComputedStyle(document.documentElement).getPropertyValue('--font-big-shoulders').trim() || 'Impact';
      let fs = Math.round(rows * 0.86);
      const set = () => (o.font = `900 ${fs}px ${family}, Impact, sans-serif`);
      set();
      while (o.measureText(t).width > cols - 6 && fs > 8) {
        fs--;
        set();
      }
      o.fillText(t, cols / 2, rows / 2 + 1);
      const d = o.getImageData(0, 0, cols, rows).data;
      const m: boolean[] = [];
      for (let i = 0; i < cols * rows; i++) m.push(d[i * 4 + 3] > 110);
      return m;
    }
    function layout() {
      const narrow = cv!.clientWidth < 600;
      cols = narrow ? 72 : 120;
      rows = narrow ? 30 : 42;
      tone = Array.from({ length: cols * rows }, (_, i) => ((i * 2654435761) >>> 0) % 3);
      maskOld = maskNew = raster(text());
    }
    function paint(t: number) {
      const W = cv!.width;
      const H = cv!.height;
      const cw = W / cols;
      const ch = H / rows;
      ctx!.fillStyle = T.gap;
      ctx!.fillRect(0, 0, W, H);
      let waveX = -1;
      if (goalAt !== null) {
        waveX = -0.12 + ((t - goalAt) / GOAL_WAVE) * 1.3;
        if (waveX > 1.2) {
          goalAt = null;
          maskOld = maskNew;
        }
      } else if (!reduce.matches) {
        waveX = -0.15 + (((t - wave0) % PERIOD) / PERIOD) * 1.6;
      }
      const tones = [T.a, T.b, T.a];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c / cols;
          const dx = x - waveX + (r / rows) * 0.05;
          const k = waveX < -0.9 ? 0 : Math.exp(-(dx * dx) / 0.0018);
          const flip = Math.cos(Math.min(1, k * 1.25) * Math.PI);
          const on = (goalAt === null || x < waveX ? maskNew : maskOld)[i];
          const h = Math.max(1, Math.abs(flip) * (ch - 3));
          ctx!.fillStyle = flip < 0 ? T.back : on ? T.on : tones[tone[i]];
          ctx!.fillRect(c * cw + 1.5, r * ch + (ch - h) / 2 - k * 4, cw - 3, h);
        }
      }
    }
    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      paint(t);
    }
    function start() {
      readTokens();
      layout();
      box!.classList.add('is-on');
      if (reduce.matches) paint(0);
      else raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);
    const themeObs = new MutationObserver(() => {
      readTokens();
      if (reduce.matches) paint(0);
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const onResize = () => {
      const n = cv.clientWidth < 600 ? 72 : 120;
      if (n !== cols) {
        layout();
        if (reduce.matches) paint(0);
      }
    };
    window.addEventListener('resize', onResize);
    const onGoal = (e: Event) => {
      const d = (e as CustomEvent<{ id: number; home: number; away: number }>).detail;
      if (!d || d.id !== fixtureId) return;
      score.home = d.home;
      score.away = d.away;
      maskNew = raster(text());
      if (still.current) still.current.textContent = text();
      if (reduce.matches) {
        maskOld = maskNew;
        paint(0);
      } else {
        goalAt = performance.now();
        wave0 = goalAt + GOAL_WAVE;
      }
    };
    window.addEventListener('golify:goal', onGoal);

    let cancelled = false;
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => !cancelled && start(), () => !cancelled && start());

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObs.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('golify:goal', onGoal);
    };
  }, [fixtureId, homeCode, awayCode, home, away]);

  const label = home == null || away == null ? `${homeCode} VS ${awayCode}` : `${homeCode} ${home}–${away} ${awayCode}`;
  return (
    <div className="tifo-wrap" aria-hidden>
      <div className="tifo" ref={wrap}>
        <canvas ref={canvas} width={1536} height={672} />
        <div className="tifo-still" ref={still}>
          {label}
        </div>
      </div>
    </div>
  );
}
