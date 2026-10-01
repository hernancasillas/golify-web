import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { TrackedLink } from '@/components/analytics/Tracked';
import { Fact } from '@/components/team/ui';
import { teamPath, type RouteLocale } from '@/lib/routes';
import { cn } from '@/lib/utils';

export type TeamTab = 'overview' | 'fixtures' | 'squad' | 'stats';

// Hero of every team page (design: crest, green eyebrow with the competition,
// display H1, fact grid, "Seguir a …" button) followed by the section tabs.
// The facts are passed in already filtered: a fact the data does not have is
// simply not in the list, never a placeholder.
export function TeamHeader({
  locale,
  team,
  eyebrow,
  title,
  facts,
  follow,
  tabs,
  active,
  navLabel,
}: {
  locale: RouteLocale;
  team: { id: number; name: string; logo: string };
  eyebrow?: string | null;
  title: string;
  facts: { label: string; value: ReactNode }[];
  follow: { label: string; href: string; campaign: string };
  tabs: { label: string; key: TeamTab }[];
  active: TeamTab;
  navLabel: string;
}) {
  return (
    <>
      <section className="mt-5 flex flex-wrap items-center gap-5 sm:gap-7">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-24 sm:w-24">
          <Image
            src={team.logo}
            alt={team.name}
            width={64}
            height={64}
            unoptimized
            priority
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
        </span>
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
          {eyebrow ? (
            <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-wide uppercase sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {facts.length ? (
            <dl className="mt-1 grid max-w-2xl grid-cols-2 gap-x-7 gap-y-3 sm:grid-cols-4">
              {facts.map((f) => (
                <Fact key={f.label} label={f.label}>
                  {f.value}
                </Fact>
              ))}
            </dl>
          ) : null}
        </div>
        <TrackedLink
          external
          rel="nofollow"
          event="app_install_click"
          params={{ placement: 'team_hero', team_id: team.id }}
          href={follow.href}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-105"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {follow.label}
        </TrackedLink>
      </section>

      <nav aria-label={navLabel} className="mt-6 -mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-6 sm:gap-8">
          {tabs.map((t) => {
            const href = teamPath(locale, team, t.key === 'overview' ? undefined : t.key);
            const current = t.key === active;
            return (
              <li key={t.key}>
                <Link
                  href={href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex h-12 items-center px-1 text-[15px] font-semibold whitespace-nowrap transition-colors',
                    current
                      ? 'text-foreground shadow-[inset_0_-3px_0_var(--primary)]'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
