import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Building blocks shared by the match-page sections. Server-safe (no hooks).

export function Section({
  title,
  action,
  children,
  className,
  id,
}: {
  title: string;
  /** Optional link at the right of the heading ("Ver historial completo"). */
  action?: { href: string; label: string } | null;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('mt-10 min-w-0', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-sm font-bold text-primary hover:underline">
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border bg-surface', className)}>{children}</div>;
}

export function Logo({ src, size = 20, className }: { src: string | null | undefined; size?: number; className?: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** W/D/L chip. Letters are localized by the caller. */
export function OutcomeChip({ outcome, label, title }: { outcome: 'W' | 'D' | 'L'; label: string; title?: string }) {
  // Red is reserved for "live" across the site, so a loss is the neutral
  // outlined chip; the letter carries the meaning.
  const tone =
    outcome === 'W'
      ? 'bg-primary text-primary-foreground'
      : outcome === 'L'
        ? 'border border-border bg-surface-2 text-muted-foreground'
        : 'bg-muted-foreground/25 text-foreground';
  return (
    <span
      title={title}
      className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-extrabold', tone)}
    >
      {label}
    </span>
  );
}

export const OUTCOME_LETTER = {
  es: { W: 'G', D: 'E', L: 'P' },
  pt: { W: 'V', D: 'E', L: 'D' },
  en: { W: 'W', D: 'D', L: 'L' },
} as const;
