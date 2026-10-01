// Building blocks of the team pages (layout from the CEO's "Plantilla"
// design, colors and fonts from the site's own tokens so light mode keeps
// working). Server components: no hooks, no client JS.

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Fixture } from '@/lib/api-football';
import { LocalTime } from '@/components/LocalTime';
import { matchPath, type RouteLocale } from '@/lib/routes';
import { cn } from '@/lib/utils';

/** Card with a display heading, the design's main container. */
export function Panel({
  title,
  aside,
  children,
  className,
  flush = false,
  id,
  as: Tag = 'h2',
}: {
  title?: ReactNode;
  /** Right-aligned note next to the title ("5 jugadores", "Ver tabla"). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding (tables that run edge to edge). */
  flush?: boolean;
  id?: string;
  as?: 'h2' | 'h3';
}) {
  return (
    <section id={id} className={cn('min-w-0 scroll-mt-24 rounded-2xl border border-border bg-surface', flush ? 'overflow-hidden' : 'p-5', className)}>
      {title ? (
        <div className={cn('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1', flush ? 'px-5 pt-5 pb-2' : 'mb-3')}>
          <Tag className="font-display text-xl leading-tight font-bold tracking-wide uppercase">{title}</Tag>
          {aside ? <div className="text-sm font-semibold text-muted-foreground">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Team / league logo on a white disc (provider logos assume a light ground). */
export function Crest({ src, size = 24, className }: { src: string; size?: number; className?: string }) {
  const inner = Math.round(size * 0.72);
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-white', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" width={inner} height={inner} unoptimized className="object-contain" style={{ width: inner, height: inner }} />
      ) : null}
    </span>
  );
}

/** Round player photo with a neutral placeholder behind it. */
export function Avatar({ src, size = 32 }: { src: string | null | undefined; size?: number }) {
  return (
    <span className="inline-flex shrink-0 overflow-hidden rounded-full bg-surface-2" style={{ width: size, height: size }}>
      {src ? <Image src={src} alt="" width={size} height={size} unoptimized className="h-full w-full object-cover" /> : null}
    </span>
  );
}

const OUTCOME_CLASS = {
  W: 'bg-primary text-primary-foreground',
  D: 'bg-muted-foreground/25 text-foreground',
  L: 'bg-live/15 text-live',
} as const;

export function OutcomeBadge({
  outcome,
  letter,
  title,
  size = 'md',
}: {
  outcome: 'W' | 'D' | 'L';
  letter: string;
  title: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-display font-bold',
        size === 'sm' ? 'h-6 w-6 text-xs' : 'h-9 w-9 text-base',
        OUTCOME_CLASS[outcome],
      )}
    >
      <span aria-hidden="true">{letter}</span>
      <span className="sr-only">{title}</span>
    </span>
  );
}

/** A match from one team's point of view: date, both sides, score or local
 *  kickoff, and the whole row links to the match page. */
export function FixtureRow({
  f,
  locale,
  teamId,
  outcome,
  showDate = true,
  dateLabel,
  statusLabel,
  meta,
}: {
  f: Fixture;
  locale: RouteLocale;
  teamId: number;
  outcome?: { key: 'W' | 'D' | 'L'; letter: string; title: string } | null;
  showDate?: boolean;
  /** Fixed date text (played matches) instead of the visitor-local kickoff. */
  dateLabel?: string;
  /** Replaces the score/time column (Aplazado, En vivo…). */
  statusLabel?: { text: string; live?: boolean } | null;
  /** Competition (and round) line under the date; the provider's league
   *  name when omitted. */
  meta?: string;
}) {
  const played = f.goals.home != null && f.goals.away != null;
  const side = (t: Fixture['teams']['home'], goals: number | null) => (
    <span className="flex min-w-0 items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2">
        <Crest src={t.logo} size={20} />
        <span className={cn('truncate text-sm', t.id === teamId ? 'font-extrabold' : 'font-semibold')}>{t.name}</span>
      </span>
      {played ? <span className="font-display text-base font-bold tabular-nums">{goals}</span> : null}
    </span>
  );
  return (
    <li>
      <Link
        href={matchPath(locale, f)}
        className="flex items-center gap-3 border-t border-border px-5 py-3 transition-colors first:border-t-0 hover:bg-surface-2"
      >
        <span className="flex w-full min-w-0 flex-col gap-1.5">
          {showDate ? (
            <span className="truncate text-xs font-semibold text-muted-foreground">
              {dateLabel ? <time dateTime={f.fixture.date}>{dateLabel}</time> : <LocalTime iso={f.fixture.date} locale={locale} />} ·{' '}
              {meta ?? f.league.name}
            </span>
          ) : null}
          {side(f.teams.home, f.goals.home)}
          {side(f.teams.away, f.goals.away)}
        </span>
        <span className="flex w-12 shrink-0 justify-end">
          {statusLabel ? (
            <span className={cn('text-right text-xs font-extrabold uppercase', statusLabel.live ? 'text-live' : 'text-muted-foreground')}>
              {statusLabel.text}
            </span>
          ) : outcome ? (
            <OutcomeBadge outcome={outcome.key} letter={outcome.letter} title={outcome.title} size="sm" />
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/** Label/value pair of the hero's fact grid. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="truncate font-semibold">{children}</dd>
    </div>
  );
}
