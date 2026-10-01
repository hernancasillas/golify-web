// Shared shells for the player page blocks. Server-safe (no hooks).
import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  id,
  className,
  children,
  labelledBy,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-6', className)}
    >
      {children}
    </section>
  );
}

export function CardTitle({ id, children, sub }: { id?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h2 id={id} className="font-display text-xl leading-tight font-bold tracking-wide text-foreground uppercase sm:text-2xl">
        {children}
      </h2>
      {sub ? <p className="text-sm font-semibold text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function Eyebrow({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'gold' }) {
  return (
    <div
      className={cn(
        'text-xs font-extrabold tracking-[0.14em] uppercase',
        tone === 'gold' ? 'text-gold' : 'text-primary',
      )}
    >
      {children}
    </div>
  );
}

/** Provider crest; decorative next to the team name, so empty alt. */
export function Crest({ src, size = 20, className }: { src: string | null | undefined; size?: number; className?: string }) {
  if (!src) return <span aria-hidden="true" className={cn('inline-block shrink-0 rounded-full bg-surface-2', className)} style={{ width: size, height: size }} />;
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
