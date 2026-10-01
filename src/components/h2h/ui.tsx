// Presentational pieces shared by the H2H, stadium and referee templates.
// Server Components only: plain markup on the site's semantic tokens, so both
// themes work and nothing here ships JS.

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Fixture } from '@/lib/api-football';
import { matchPath } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { dateText, leagueText, roundText, scoreText, type L } from './shared';

export function Panel({
  title,
  eyebrow,
  children,
  className,
  id,
  action,
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  id?: string;
  action?: ReactNode;
}) {
  return (
    <section id={id} className={cn('min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6', className)}>
      {eyebrow ? <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{eyebrow}</p> : null}
      {title || action ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="font-display text-xl font-bold tracking-wide uppercase sm:text-2xl">{title}</h2> : null}
          {action}
        </div>
      ) : null}
      <div className={title ? 'mt-3' : undefined}>{children}</div>
    </section>
  );
}

export function Crest({ src, alt, size = 40, className }: { src?: string | null; alt: string; size?: number; className?: string }) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-muted-foreground', className)}
      >
        {alt.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="font-display text-2xl font-bold tabular-nums sm:text-[26px]">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}

/** Three-part bar (A / draws / B). Widths are real shares of the sample. */
export function SplitBar({ a, d, b, label }: { a: number; d: number; b: number; label: string }) {
  const total = a + d + b;
  if (total === 0) return null;
  const w = (n: number) => `${(n / total) * 100}%`;
  return (
    <div role="img" aria-label={label} className="flex h-3 gap-[3px] overflow-hidden rounded-full">
      {a > 0 ? <div className="bg-primary" style={{ width: w(a) }} /> : null}
      {d > 0 ? <div className="bg-muted-foreground/40" style={{ width: w(d) }} /> : null}
      {b > 0 ? <div className="bg-gold" style={{ width: w(b) }} /> : null}
    </div>
  );
}

/** One match as a link row: home – score – away, then date and competition.
 *  Stacks on phones (the meta line drops below the teams). */
export function MatchRow({
  f,
  locale,
  zone,
  tag,
  extra,
}: {
  f: Fixture;
  locale: L;
  /** IANA zone the calendar date is printed in. */
  zone: string;
  /** Short result note ("Ganó América", "Empate"). */
  tag?: string;
  /** Right-aligned extra facts (cards in this match…). */
  extra?: ReactNode;
}) {
  const score = scoreText(f, locale);
  const round = roundText(f, locale);
  const meta = [dateText(f.fixture.date, zone, locale), leagueText(f, locale), round].filter(Boolean).join(' · ');
  return (
    <Link
      href={matchPath(locale, f)}
      className="block border-t border-border py-3 transition-colors first:border-t-0 hover:bg-surface-2/60"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <span className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold">
          <span className="truncate">{f.teams.home.name}</span>
          <Crest src={f.teams.home.logo} alt="" size={22} />
        </span>
        <span className="min-w-[3.25rem] rounded-lg bg-surface-2 px-2 py-1 text-center font-display text-base font-bold tabular-nums">
          {score.split(' ')[0] || 'vs'}
        </span>
        <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <Crest src={f.teams.away.logo} alt="" size={22} />
          <span className="truncate">{f.teams.away.name}</span>
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-xs font-semibold text-muted-foreground">
        <span>{meta}</span>
        {score.includes('(') ? <span>{score.slice(score.indexOf('('))}</span> : null}
        {tag ? <span className="font-bold text-foreground">{tag}</span> : null}
        {extra}
      </div>
    </Link>
  );
}

/** Plain list of facts (label → value). */
export function FactList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
          <dt className="font-semibold text-muted-foreground">{k}</dt>
          <dd className="text-right font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Generated summary ("En resumen"): sentences built from rules over data. */
export function SummaryBox({ title, sentences }: { title: string; sentences: string[] }) {
  if (sentences.length === 0) return null;
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <span aria-hidden="true" className="mt-0.5 text-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      </span>
      <div>
        <h2 className="text-[15px] font-bold">{title}</h2>
        <p className="mt-1.5 leading-relaxed font-semibold text-muted-foreground">{sentences.join(' ')}</p>
      </div>
    </div>
  );
}
