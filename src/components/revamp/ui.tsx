// Presentational building blocks for the "Energético" revamp. No hooks or
// browser APIs, so these render fine in both Server Components (world-cup pages)
// and Client Components (Home). Colors come from the semantic tokens defined in
// globals.css (mint = primary, gold, band, surface, surface-2) so every piece
// themes correctly in both light and dark.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getTeamFlagByName } from '@/lib/bracket/flags';

/** Small down-arrow glyph used on the app-store CTAs (matches the handoff). */
export function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 4v11" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}

// ─── Pill link / button ──────────────────────────────────────────────────────

type PillVariant = 'mint' | 'gold' | 'outline' | 'dark';

const PILL: Record<PillVariant, string> = {
  mint: 'bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(92,242,154,0.35)] hover:brightness-105',
  gold: 'bg-gold text-gold-foreground hover:brightness-105',
  outline: 'border-[1.5px] border-foreground/35 text-foreground hover:bg-foreground/5',
  dark: 'bg-[#06170D] text-[#F4F7F5] hover:brightness-125',
};

/** Rounded pill link. Renders <a> for external URLs, next/link otherwise. */
export function PillLink({
  href,
  variant = 'mint',
  className,
  children,
}: {
  href: string;
  variant?: PillVariant;
  className?: string;
  children: ReactNode;
}) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold whitespace-nowrap transition',
    PILL[variant],
    className,
  );
  const isExternal = /^https?:/.test(href);
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

// ─── Eyebrow badge (with optional pulse dot) ─────────────────────────────────

export function Eyebrow({
  tone = 'gold',
  pulse = true,
  children,
}: {
  tone?: 'gold' | 'mint';
  pulse?: boolean;
  children: ReactNode;
}) {
  const tones = {
    gold: 'bg-gold/12 border-gold/40 text-gold',
    mint: 'bg-primary/12 border-primary/40 text-primary',
  };
  const dot = { gold: 'bg-gold', mint: 'bg-primary' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold tracking-wide uppercase',
        tones[tone],
      )}
    >
      {pulse ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', dot[tone], 'animate-pulse-dot')} />
      ) : null}
      {children}
    </span>
  );
}

// ─── Section display heading (Bebas Neue) ────────────────────────────────────

export function DisplayHeading({
  as: Tag = 'h2',
  className,
  children,
}: {
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        'font-display leading-none tracking-wide text-foreground uppercase',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ─── Feature card (Home) ─────────────────────────────────────────────────────

export function FeatureCard({
  tone = 'mint',
  icon,
  title,
  description,
}: {
  tone?: 'mint' | 'gold';
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const border = tone === 'mint' ? 'border-primary/20' : 'border-gold/25';
  const iconBg =
    tone === 'mint'
      ? 'bg-primary text-primary-foreground'
      : 'bg-gold text-gold-foreground';
  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br from-surface to-band p-8',
        border,
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl',
          iconBg,
        )}
      >
        {icon}
      </div>
      <div className="mb-2.5 text-[19px] font-extrabold text-foreground">
        {title}
      </div>
      <div className="text-sm leading-relaxed font-semibold text-muted-foreground">
        {description}
      </div>
    </div>
  );
}

// ─── League chip ─────────────────────────────────────────────────────────────

export function LeagueChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-primary/20 bg-surface-2 px-5 py-2.5 text-sm font-bold text-foreground">
      {children}
    </span>
  );
}

// ─── FAQ card ────────────────────────────────────────────────────────────────

export function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-5">
      <div className="font-extrabold text-foreground">{q}</div>
      <div className="mt-2 text-sm leading-relaxed font-medium text-muted-foreground">
        {a}
      </div>
    </div>
  );
}

// ─── Calendar match card ─────────────────────────────────────────────────────

export function CalendarMatchCard({
  homeName,
  awayName,
  dateLabel,
  vs = 'vs',
  highlight = false,
}: {
  homeName: string;
  awayName: string;
  dateLabel: string;
  vs?: string;
  highlight?: boolean;
}) {
  const flagHome = getTeamFlagByName(homeName) || '⚽';
  const flagAway = getTeamFlagByName(awayName) || '⚽';
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-5 py-4',
        highlight
          ? 'border-primary/40 bg-gradient-to-br from-surface-2 to-surface'
          : 'border-border bg-surface-2',
      )}
    >
      <span
        className={cn(
          'text-sm font-bold',
          highlight ? 'text-primary' : 'text-foreground',
        )}
      >
        {flagHome} {homeName} <span className="text-muted-foreground">{vs}</span>{' '}
        {awayName} {flagAway}
      </span>
      <span
        className={cn(
          'shrink-0 text-xs font-extrabold',
          highlight ? 'text-primary' : 'text-gold',
        )}
      >
        {dateLabel}
      </span>
    </div>
  );
}
