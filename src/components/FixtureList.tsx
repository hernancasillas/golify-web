import Image from 'next/image';
import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';
import { LocalTime } from '@/components/LocalTime';

// Server-rendered fixture rows. Same visual language as LiveMatchesWidget, but
// no client JS: these lists exist so Google and the answer engines can read
// scores, kickoff times and the links through to every match page.

const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

export function isLive(f: Fixture): boolean {
  return LIVE_STATUSES.includes(f.fixture.status.short);
}

export function isFinished(f: Fixture): boolean {
  return FINISHED_STATUSES.includes(f.fixture.status.short);
}

export function hasScore(f: Fixture): boolean {
  return f.goals.home != null && f.goals.away != null;
}

function statusChip(f: Fixture, locale: string, labels: FixtureLabels) {
  if (isLive(f)) {
    const elapsed = f.fixture.status.elapsed;
    return (
      <span className="flex flex-col items-center gap-1">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
        <span className="text-xs leading-tight font-extrabold text-live">
          {elapsed != null ? `${elapsed}'` : labels.live}
        </span>
      </span>
    );
  }
  if (isFinished(f)) {
    return (
      <span className="text-xs leading-tight font-extrabold text-muted-foreground uppercase">
        {labels.finished}
      </span>
    );
  }
  return (
    <span className="text-xs leading-tight font-extrabold tabular-nums text-muted-foreground">
      <LocalTime iso={f.fixture.date} locale={locale} style="time" />
    </span>
  );
}

export type FixtureLabels = {
  live: string;
  finished: string;
};

function TeamLine({
  name,
  logo,
  score,
  showScore,
}: {
  name: string;
  logo: string;
  score: number | null;
  showScore: boolean;
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
      {showScore ? (
        <span className="shrink-0 font-display text-base font-bold tabular-nums text-foreground">
          {score ?? '-'}
        </span>
      ) : null}
    </div>
  );
}

export function FixtureRow({
  f,
  locale,
  labels,
  showLeague = true,
}: {
  f: Fixture;
  locale: string;
  labels: FixtureLabels;
  showLeague?: boolean;
}) {
  const score = hasScore(f);
  return (
    <Link
      href={`/${locale}/match/${f.fixture.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-surface-2"
    >
      {showLeague ? (
        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {/* White backdrop: some league crests are dark on transparency. */}
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src={f.league.logo}
              alt=""
              width={11}
              height={11}
              unoptimized
              className="h-[11px] w-[11px] object-contain"
            />
          </span>
          <span className="truncate">
            {f.league.name}
            {f.league.round ? ` · ${f.league.round}` : ''}
          </span>
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <div className="flex w-14 shrink-0 items-center justify-center text-center">
          {statusChip(f, locale, labels)}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <TeamLine
            name={f.teams.home.name}
            logo={f.teams.home.logo}
            score={f.goals.home}
            showScore={score}
          />
          <TeamLine
            name={f.teams.away.name}
            logo={f.teams.away.logo}
            score={f.goals.away}
            showScore={score}
          />
        </div>
      </div>
    </Link>
  );
}

export function FixtureGrid({
  fixtures,
  locale,
  labels,
  showLeague = true,
}: {
  fixtures: Fixture[];
  locale: string;
  labels: FixtureLabels;
  showLeague?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fixtures.map((f) => (
        <FixtureRow
          key={f.fixture.id}
          f={f}
          locale={locale}
          labels={labels}
          showLeague={showLeague}
        />
      ))}
    </div>
  );
}

/** Groups fixtures by league, keeping the incoming order (which the callers
 *  sort by our own market priority). */
export function groupByLeague(fixtures: Fixture[]): { league: Fixture['league']; fixtures: Fixture[] }[] {
  const groups = new Map<number, { league: Fixture['league']; fixtures: Fixture[] }>();
  for (const f of fixtures) {
    const g = groups.get(f.league.id);
    if (g) g.fixtures.push(f);
    else groups.set(f.league.id, { league: f.league, fixtures: [f] });
  }
  return [...groups.values()];
}

/** schema.org ItemList of SportsEvent — how an answer engine reads a results
 *  board as a list of matches instead of a wall of text. */
export function fixtureListJsonLd(
  fixtures: Fixture[],
  siteUrl: string,
  locale: string,
  name: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: fixtures.length,
    itemListElement: fixtures.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SportsEvent',
        name: `${f.teams.home.name} vs ${f.teams.away.name}`,
        sport: 'Soccer',
        startDate: f.fixture.date,
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: f.fixture.venue.name ?? f.league.country ?? f.league.name,
        },
        homeTeam: { '@type': 'SportsTeam', name: f.teams.home.name },
        awayTeam: { '@type': 'SportsTeam', name: f.teams.away.name },
        url: `${siteUrl}/${locale}/match/${f.fixture.id}`,
      },
    })),
  };
}
