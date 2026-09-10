'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { DisplayHeading, Eyebrow } from '@/components/revamp/ui';
import type { Fixture } from '@/lib/api-football';

const POLL_MS = 30_000;

const NON_ELAPSED_LABEL: Record<string, { es: string; en: string }> = {
  HT: { es: 'Descanso', en: 'Half-time' },
  ET: { es: 'Prórroga', en: 'Extra time' },
  P: { es: 'Penales', en: 'Penalties' },
};

function statusText(f: Fixture, locale: string): string {
  const { short, elapsed } = f.fixture.status;
  if (elapsed != null) return `${elapsed}'`;
  const label = NON_ELAPSED_LABEL[short];
  return label ? label[locale as 'es' | 'en'] ?? label.es : short;
}

function TeamRow({
  name,
  logo,
  score,
}: {
  name: string;
  logo: string;
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2">
        <Image
          src={logo}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="h-5 w-5 shrink-0 object-contain"
        />
        <span className="truncate text-sm font-bold text-foreground">{name}</span>
      </span>
      <span className="shrink-0 font-display text-base font-bold tabular-nums text-foreground">
        {score ?? '-'}
      </span>
    </div>
  );
}

function MatchRow({ f, locale }: { f: Fixture; locale: string }) {
  return (
    <Link
      href={`/${locale}/match/${f.fixture.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-surface-2"
    >
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        <Image
          src={f.league.logo}
          alt=""
          width={14}
          height={14}
          unoptimized
          className="h-3.5 w-3.5 shrink-0 object-contain"
        />
        <span className="truncate">{f.league.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 text-center">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
          <span className="text-xs leading-tight font-extrabold text-live">
            {statusText(f, locale)}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <TeamRow name={f.teams.home.name} logo={f.teams.home.logo} score={f.goals.home} />
          <TeamRow name={f.teams.away.name} logo={f.teams.away.logo} score={f.goals.away} />
        </div>
      </div>
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2.5 h-3 w-24 rounded bg-surface-2" />
      <div className="flex items-center gap-4">
        <div className="h-8 w-11 shrink-0 rounded bg-surface-2" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-surface-2" />
          <div className="h-4 w-2/3 rounded bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

// Home widget: real live matches from the tracked leagues, polled the same
// way the app does (30s), tapping through to the reskinned match page. A
// functional taste of the app on the web, not a static screenshot.
export function LiveMatchesWidget() {
  const { t, locale } = useI18n();
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/live-fixtures', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const { fixtures: rows } = (await res.json()) as { fixtures: Fixture[] };
        if (!cancelled) setFixtures(rows);
      } catch {
        // Transient network hiccup — keep showing the last known state.
      }
    }

    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const shown = fixtures?.slice(0, 8) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-5 pt-2 pb-20 sm:px-8">
      <div className="mb-6 text-center">
        <Eyebrow tone="mint">{t('home.live.badge')}</Eyebrow>
        <DisplayHeading as="h2" className="mt-4 text-3xl sm:text-4xl">
          {t('home.live.title')}
        </DisplayHeading>
        <p className="mt-2 font-semibold text-muted-foreground">{t('home.live.subtitle')}</p>
      </div>

      {fixtures === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-bold text-foreground">{t('home.live.emptyTitle')}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {t('home.live.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shown.map((f) => (
            <MatchRow key={f.fixture.id} f={f} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
