// Layout pieces shared by the "Dónde ver", "Fichajes" and EA FC templates.
//
// The CEO's mockups put the answer and the data in a main column and the
// supporting blocks (time zones, club balance, app card) in a 320px rail on
// desktop; on a phone the rail simply follows the main column. Colors are the
// site's semantic tokens only, so light and dark both work.

import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { TrackedLink } from '@/components/analytics/Tracked';
import { withUtm } from '@/lib/analytics';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';
import type { RouteLocale } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function PageShell({ locale, children }: { locale: RouteLocale; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-4 pt-2 pb-16 sm:px-6">{children}</main>
      <SiteFooter locale={locale} />
    </div>
  );
}

/** Main column + 320px rail on desktop, stacked on mobile. */
export function TwoColumn({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{main}</div>
      <aside className="min-w-0 space-y-6">{aside}</aside>
    </div>
  );
}

export function SectionTitle({
  as: Tag = 'h2',
  children,
  aside,
}: {
  as?: 'h2' | 'h3';
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <Tag className="font-display text-xl font-bold tracking-wide uppercase">{children}</Tag>
      {aside ? <span className="text-xs font-bold text-muted-foreground">{aside}</span> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-border bg-surface', className)}>{children}</div>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-extrabold tracking-wide text-primary uppercase">{children}</p>
  );
}

/** Store buttons with the plan §0.6 event and §0.7 UTM. */
export function AppCard({
  title,
  body,
  medium,
  campaign,
  labels,
}: {
  title: string;
  body: string;
  /** utm_medium: the page type (donde_ver, fichajes, fc). */
  medium: string;
  /** utm_campaign: the page slug. */
  campaign: string;
  labels: { kicker: string; ios: string; android: string };
}) {
  const btn =
    'inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold transition';
  return (
    <div className="rounded-2xl border border-border bg-band p-5">
      <Kicker>{labels.kicker}</Kicker>
      <p className="mt-2 font-display text-lg leading-tight font-bold uppercase">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed font-semibold text-muted-foreground">{body}</p>
      <div className="mt-4 grid gap-2">
        <TrackedLink
          external
          href={withUtm(APP_STORE_URL, medium, campaign)}
          event="app_install_click"
          params={{ store: 'ios', page_type: medium, campaign }}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(btn, 'bg-primary text-primary-foreground hover:brightness-105')}
        >
          {labels.ios}
        </TrackedLink>
        <TrackedLink
          external
          href={withUtm(PLAY_STORE_URL, medium, campaign)}
          event="app_install_click"
          params={{ store: 'android', page_type: medium, campaign }}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(btn, 'border-[1.5px] border-foreground/30 text-foreground hover:bg-foreground/5')}
        >
          {labels.android}
        </TrackedLink>
      </div>
    </div>
  );
}

/** A plain list of internal links (rail blocks: "Otras guías", "Otras ligas"). */
export function LinkList({ title, links }: { title: string; links: { href: string; label: string; hint?: string }[] }) {
  if (links.length === 0) return null;
  return (
    <section>
      <SectionTitle as="h2">{title}</SectionTitle>
      <Card className="divide-y divide-border">
        {links.map((l) => (
          <RailLink key={l.href} href={l.href} label={l.label} hint={l.hint} />
        ))}
      </Card>
    </section>
  );
}

function RailLink({ href, label, hint }: { href: string; label: string; hint?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold transition-colors hover:text-primary"
    >
      <span className="min-w-0 truncate">{label}</span>
      {hint ? <span className="shrink-0 text-xs font-semibold text-muted-foreground">{hint}</span> : <span aria-hidden="true">›</span>}
    </Link>
  );
}
