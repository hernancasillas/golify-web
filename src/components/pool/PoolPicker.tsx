'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { LocalTime } from '@/components/LocalTime';
import { TrackedButton, TrackedLink } from '@/components/analytics/Tracked';
import { track } from '@/lib/analytics';
import type { RouteLocale } from '@/lib/routes';
import { poolStr, tpl } from './strings';

// The interactive 1 / X / 2 sheet of a public quiniela round.
//
// Server-rendered like any component (crawlers read every fixture, kickoff,
// result and community split in the HTML); the client adds the picking.
// Picks live in this browser's localStorage and nowhere else — the page says
// so, and the only ways out are a share text and the app CTA. The store is
// read through useSyncExternalStore so the first client render matches the
// server HTML (no picks) and there is no setState-in-effect.

export type Pick = '1' | 'X' | '2';

export interface PickerMatch {
  id: number;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  iso: string;
  phase: 'scheduled' | 'live' | 'finished' | 'off';
  goals: { home: number | null; away: number | null };
  elapsed: number | null;
  href: string;
  /** Community split in %, only when Golify has ≥ 20 picks for the match. */
  split: { home: number; draw: number; away: number } | null;
  /** Share of the community that called the final result. */
  correct: number | null;
}

// ---- localStorage-backed store -------------------------------------------

const listeners = new Set<() => void>();

function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeRaw(key: string, value: Record<string, Pick>) {
  try {
    if (Object.keys(value).length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / blocked storage: picks still work for this view only.
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function parsePicks(raw: string): Record<string, Pick> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, Pick> = {};
    for (const [k, p] of Object.entries(v)) if (p === '1' || p === 'X' || p === '2') out[k] = p;
    return out;
  } catch {
    return {};
  }
}

function outcome(m: PickerMatch): Pick | null {
  if (m.phase !== 'finished' || m.goals.home == null || m.goals.away == null) return null;
  return m.goals.home > m.goals.away ? '1' : m.goals.home < m.goals.away ? '2' : 'X';
}

export function PoolPicker({
  locale,
  matches,
  storageKey,
  title,
  pageUrl,
  ctaHref,
  campaign,
}: {
  locale: RouteLocale;
  matches: PickerMatch[];
  /** One key per league + season + phase + round. */
  storageKey: string;
  /** "Quiniela Liga MX Jornada 12" — used in the share text. */
  title: string;
  /** Absolute page URL (with UTM) appended to the share text. */
  pageUrl: string;
  ctaHref: string;
  campaign: string;
}) {
  const t = poolStr(locale);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(storageKey),
    () => '',
  );
  const picks = useMemo(() => parsePicks(raw), [raw]);
  const [copied, setCopied] = useState(false);

  const open = matches.filter((m) => m.phase === 'scheduled');
  const pickedCount = matches.filter((m) => picks[m.id]).length;
  const openTotal = open.length;
  const pickedOpen = open.filter((m) => picks[m.id]).length;

  function setPick(id: number, p: Pick) {
    const next = { ...picks };
    if (next[id] === p) delete next[id];
    else next[id] = p;
    writeRaw(storageKey, next);
  }

  const shareText = useMemo(() => {
    const lines = matches
      .filter((m) => picks[m.id])
      .map((m) => {
        const p = picks[m.id];
        const who = p === '1' ? m.home.name : p === '2' ? m.away.name : t.drawShort;
        return `${m.home.name} vs ${m.away.name}: ${p} (${who})`;
      });
    return [tpl(t.shareHead, { title }), ...lines, '', `${t.shareTail} ${pageUrl}`].join('\n');
  }, [matches, picks, t, title, pageUrl]);

  const hasPicks = pickedCount > 0;
  const hint =
    openTotal > 0 && pickedOpen === openTotal
      ? t.hintDone
      : hasPicks
        ? tpl(t.hintSome, { n: pickedOpen, total: openTotal })
        : t.hintEmpty;

  async function onShare() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (nav?.share) {
      try {
        await nav.share({ title, text: shareText });
      } catch {
        // Dismissed share sheet: nothing to do.
      }
      return;
    }
    try {
      await nav?.clipboard?.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the WhatsApp link still works.
    }
  }

  const options: { p: Pick; label: (m: PickerMatch) => string }[] = [
    { p: '1', label: (m) => m.home.name },
    { p: 'X', label: () => t.drawShort },
    { p: '2', label: (m) => m.away.name },
  ];

  return (
    <section aria-labelledby="pool-picker-title" className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <h2 id="pool-picker-title" className="font-display text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {tpl(t.pickTitle, { count: `${matches.length} ${matches.length === 1 ? t.match[0] : t.match[1]}` })}
        </h2>
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="font-display text-xl font-bold text-foreground tabular-nums">
            {pickedCount}/{matches.length}
          </span>
          {t.picked}
        </span>
      </div>

      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 border-t border-border px-5 py-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase md:grid">
        <span>{t.colMatch}</span>
        <span>{t.colPick}</span>
      </div>

      <ol className="divide-y divide-border border-t border-border md:border-t-0">
        {matches.map((m) => {
          const locked = m.phase !== 'scheduled';
          const mine = picks[m.id];
          const result = outcome(m);
          const showScore = (m.phase === 'live' || m.phase === 'finished') && m.goals.home != null && m.goals.away != null;
          return (
            <li key={m.id} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-center md:gap-6">
              <div className="min-w-0">
                <Link href={m.href} className="group flex min-w-0 items-center gap-2 font-bold">
                  <Image src={m.home.logo} alt="" width={24} height={24} unoptimized className="h-6 w-6 shrink-0 object-contain" />
                  <span className="truncate group-hover:text-primary">{m.home.name}</span>
                  {showScore ? (
                    <span className={`shrink-0 font-display tabular-nums ${m.phase === 'live' ? 'text-live' : ''}`}>
                      {m.goals.home}-{m.goals.away}
                    </span>
                  ) : (
                    <span className="shrink-0 text-muted-foreground">vs</span>
                  )}
                  <span className="truncate group-hover:text-primary">{m.away.name}</span>
                  <Image src={m.away.logo} alt="" width={24} height={24} unoptimized className="h-6 w-6 shrink-0 object-contain" />
                </Link>
                <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                  {m.phase === 'live' ? (
                    <span className="font-bold text-live">
                      {t.live}
                      {m.elapsed != null ? ` · ${m.elapsed}'` : ''}
                    </span>
                  ) : m.phase === 'finished' ? (
                    <span className="font-bold text-foreground">{t.finished}</span>
                  ) : m.phase === 'off' ? (
                    <span className="font-bold">{t.off}</span>
                  ) : (
                    <LocalTime iso={m.iso} locale={locale} />
                  )}
                  {m.correct != null ? <span> · {tpl(t.correct, { pct: m.correct })}</span> : null}
                  {mine && result ? (
                    <span className={`font-bold ${mine === result ? 'text-primary' : ''}`}>
                      {' '}
                      · {mine === result ? t.youHit : t.youMissed}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex gap-2" role="group" aria-label={`${m.home.name} vs ${m.away.name}`}>
                  {options.map(({ p, label }) => {
                    const on = mine === p;
                    const isResult = result === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={locked}
                        aria-pressed={on}
                        onClick={() => setPick(m.id, p)}
                        className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-bold transition ${
                          on
                            ? 'border-primary bg-primary text-primary-foreground'
                            : isResult
                              ? 'border-primary/60 bg-primary/10 text-foreground'
                              : 'border-border bg-surface-2 text-foreground hover:border-primary/60'
                        } ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        <span className="font-display tabular-nums">{p}</span>
                        <span className="hidden truncate sm:inline">{label(m)}</span>
                      </button>
                    );
                  })}
                </div>
                {m.split ? (
                  <>
                    <div
                      role="img"
                      aria-label={tpl(t.community, { h: m.split.home, d: m.split.draw, a: m.split.away })}
                      className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full"
                    >
                      <span className="bg-primary" style={{ width: `${m.split.home}%` }} />
                      <span className="bg-muted-foreground/45" style={{ width: `${m.split.draw}%` }} />
                      <span className="flex-1 bg-gold" />
                    </div>
                    <div className="mt-1 flex justify-between text-xs font-semibold text-muted-foreground tabular-nums">
                      <span>{m.split.home} %</span>
                      <span>{m.split.draw} %</span>
                      <span>{m.split.away} %</span>
                    </div>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
          {hint}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <TrackedLink
            event="quiniela_create_click"
            params={{ campaign, placement: 'picker' }}
            href={ctaHref}
            external
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:brightness-110"
          >
            {t.appCta}
          </TrackedLink>
          {hasPicks ? (
            <>
              <TrackedLink
                event="share_click"
                params={{ method: 'whatsapp', campaign, picks: pickedCount }}
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                external
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-2 px-5 py-3 text-sm font-extrabold transition hover:border-primary/60"
              >
                {t.whatsapp}
              </TrackedLink>
              <TrackedButton
                event="share_click"
                params={{ method: 'native', campaign, picks: pickedCount }}
                onClick={onShare}
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-2 px-5 py-3 text-sm font-extrabold transition hover:border-primary/60"
              >
                {copied ? t.copied : t.share}
              </TrackedButton>
              <button
                type="button"
                onClick={() => {
                  writeRaw(storageKey, {});
                  track('share_click', { method: 'clear', campaign });
                }}
                className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                {t.clear}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Phone: the CTA stays in reach while scrolling the list. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <TrackedLink
          event="quiniela_create_click"
          params={{ campaign, placement: 'sticky' }}
          href={ctaHref}
          external
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
        >
          {t.appCta}
          <span className="font-display tabular-nums opacity-80">
            {pickedCount}/{matches.length}
          </span>
        </TrackedLink>
      </div>
    </section>
  );
}
