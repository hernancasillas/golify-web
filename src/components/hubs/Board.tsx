import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { fixturePhase, type Fixture } from '@/lib/api-football';
import { competitionName, roundLabel } from '@/lib/competitions';
import { competitionPath, matchPath, whereToWatchPath, type HubCountry, type RouteLocale } from '@/lib/routes';
import { timeIn } from '@/lib/timezones';
import { broadcastsFor, WATCH_COUNTRY_SLUGS } from '@/data/broadcasters';
import { AdSlot } from '@/components/ads/AdSlot';
import { LocalTime } from '@/components/LocalTime';
import type { BoardCounts, BoardPhase, CompetitionGroup } from './data';

// The day board: one card per competition, one row per match, every row a
// link to its match page. Server-rendered in full — the filter chips only
// hide rows with CSS, so crawlers (and visitors without JS) always get the
// whole list in the HTML.

const B = {
  es: {
    seeCompetition: 'Ver torneo',
    final: 'Final',
    pens: 'pen.',
    ht: 'MT',
    live: 'En vivo',
    off: { PST: 'Aplazado', CANC: 'Cancelado', ABD: 'Suspendido', SUSP: 'Suspendido', AWD: 'Por mesa', WO: 'Por mesa' },
    vs: 'vs',
    filterLabel: 'Filtrar partidos',
    filters: { all: 'Todos', live: 'En vivo', scheduled: 'Por jugar', finished: 'Finalizados' },
    watchIn: 'Dónde ver en {country}:',
    ad: 'Publicidad',
  },
  pt: {
    seeCompetition: 'Ver campeonato',
    final: 'Encerrado',
    pens: 'pên.',
    ht: 'INT',
    live: 'Ao vivo',
    off: { PST: 'Adiado', CANC: 'Cancelado', ABD: 'Suspenso', SUSP: 'Suspenso', AWD: 'W.O.', WO: 'W.O.' },
    vs: 'x',
    filterLabel: 'Filtrar jogos',
    filters: { all: 'Todos', live: 'Ao vivo', scheduled: 'A jogar', finished: 'Encerrados' },
    watchIn: 'Onde assistir ({country}):',
    ad: 'Publicidade',
  },
  en: {
    seeCompetition: 'View competition',
    final: 'FT',
    pens: 'pens',
    ht: 'HT',
    live: 'Live',
    off: { PST: 'Postponed', CANC: 'Cancelled', ABD: 'Abandoned', SUSP: 'Suspended', AWD: 'Awarded', WO: 'Walkover' },
    vs: 'vs',
    filterLabel: 'Filter matches',
    filters: { all: 'All', live: 'Live', scheduled: 'Upcoming', finished: 'Finished' },
    watchIn: 'Where to watch in {country}:',
    ad: 'Advertising',
  },
} as const;

/** How kickoff times are printed.
 *  zones — server-side in fixed zones (country hubs, archive): the crawler
 *          reads the same time the visitor will see. Two zones = US ET + PT.
 *  local — UTC in the HTML, rewritten to the visitor's zone by LocalTime. */
export type TimeMode =
  | { kind: 'zones'; zones: { zone: string; short?: string }[] }
  | { kind: 'local' };

export interface BoardProps {
  groups: CompetitionGroup[];
  locale: RouteLocale;
  time: TimeMode;
  /** Placement id prefix for the in-list ads ("hub-co" → "hub-co-list-1"). */
  adPrefix: string;
  indexable: boolean;
  /** Country whose verified broadcasters to show per competition. */
  watchCountry?: HubCountry;
  watchCountryName?: string;
  /** Render the CSS-only filter chips (needs `counts`). */
  counts?: BoardCounts;
}

// Plan C3 for "partidos de hoy / en vivo": one ad after the first three
// competitions, then one every six. Never above the first block.
function adAfter(index: number): boolean {
  const n = index + 1;
  return n === 3 || (n > 3 && (n - 3) % 6 === 0);
}

export function Board({ groups, locale, time, adPrefix, indexable, watchCountry, watchCountryName, counts }: BoardProps) {
  const L = B[locale];
  let ads = 0;
  return (
    <div className="hub-board">
      {counts ? <FilterChips counts={counts} locale={locale} /> : null}
      {groups.map((g, i) => {
        const showAd = adAfter(i);
        if (showAd) ads++;
        return (
          <Fragment key={g.competition.id}>
            <CompetitionCard
              group={g}
              locale={locale}
              time={time}
              watchCountry={watchCountry}
              watchCountryName={watchCountryName}
            />
            {showAd ? (
              <AdSlot id={`${adPrefix}-list-${ads}`} format="leaderboard" indexable={indexable} label={L.ad} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

// ---- Filter chips ---------------------------------------------------------
// Native radios + :has() selectors: no client JS, no hydration, keyboard
// accessible, and the list stays complete in the markup.

const FILTER_CSS = (['live', 'scheduled', 'finished'] as const)
  .map(
    (p) =>
      `.hub-board:has(input[data-filter="${p}"]:checked) [data-phase]:not([data-phase="${p}"]){display:none}` +
      `.hub-board:has(input[data-filter="${p}"]:checked) [data-group]:not(:has([data-phase="${p}"])){display:none}`,
  )
  .join('');

function FilterChips({ counts, locale }: { counts: BoardCounts; locale: RouteLocale }) {
  const L = B[locale];
  const chips = [
    ['all', counts.all],
    ['live', counts.live],
    ['scheduled', counts.scheduled],
    ['finished', counts.finished],
  ] as const;
  return (
    <>
      {/* href + precedence: React 19 hoists it into <head> once per page. */}
      <style href="hub-board-filters" precedence="default">
        {FILTER_CSS}
      </style>
      <fieldset className="-mx-4 mt-4 min-w-0 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <legend className="sr-only">{L.filterLabel}</legend>
        <div className="flex w-max gap-2">
          {chips.map(([key, n]) => {
            const disabled = key !== 'all' && n === 0;
            return (
              <label
                key={key}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-extrabold whitespace-nowrap text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60 ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-surface-2'}`}
              >
                <input
                  type="radio"
                  name="hub-filter"
                  value={key}
                  data-filter={key}
                  defaultChecked={key === 'all'}
                  disabled={disabled}
                  className="sr-only"
                />
                {key === 'live' && n > 0 ? <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" /> : null}
                {L.filters[key]}
                <span className="tabular-nums opacity-70">· {n}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

// ---- Competition card -----------------------------------------------------

function CompetitionCard({
  group,
  locale,
  time,
  watchCountry,
  watchCountryName,
}: {
  group: CompetitionGroup;
  locale: RouteLocale;
  time: TimeMode;
  watchCountry?: HubCountry;
  watchCountryName?: string;
}) {
  const L = B[locale];
  const { competition: c, fixtures } = group;
  const first = fixtures[0];
  // A single round label only when every match of the day shares it.
  const rounds = new Set(fixtures.map((f) => f.league.round));
  const round = rounds.size === 1 && first.league.round ? roundLabel(first.league.round, locale, c) : null;
  const href = competitionPath(locale, c.id);
  const watch = watchCountry ? broadcastsFor(c.id, watchCountry) : [];
  const watchHref = watchCountry ? whereToWatchPath(locale, c.id, WATCH_COUNTRY_SLUGS[watchCountry]) : null;
  const channels = [...new Set(watch.flatMap((b) => b.channels.map((ch) => ch.name)))];

  return (
    <section data-group className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 font-display text-[15px] leading-tight font-bold tracking-wide text-foreground uppercase">
          {/* White backdrop: some league crests are dark on transparency. */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
            <Image src={first.league.logo} alt="" width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
          </span>
          {/* Name + round may wrap to a second line on phones: a truncated
              "FECHA…" hides the one detail the header is there for. */}
          <span className="line-clamp-2 min-w-0">
            {competitionName(c, locale)}
            {round ? <span className="text-muted-foreground"> · {round}</span> : null}
          </span>
        </h2>
        {href ? (
          <Link href={href} className="shrink-0 text-xs font-extrabold text-primary hover:underline">
            {L.seeCompetition} ›
          </Link>
        ) : null}
      </header>
      <ul className="divide-y divide-border">
        {fixtures.map((f) => (
          <MatchRow key={f.fixture.id} f={f} locale={locale} time={time} />
        ))}
      </ul>
      {channels.length > 0 && watchCountryName ? (
        <p className="border-t border-border px-4 py-2.5 text-xs font-bold text-muted-foreground">
          {L.watchIn.replace('{country}', watchCountryName)}{' '}
          {watchHref ? (
            <Link href={watchHref} className="text-foreground underline-offset-2 hover:underline">
              {channels.join(' · ')}
            </Link>
          ) : (
            <span className="text-foreground">{channels.join(' · ')}</span>
          )}
        </p>
      ) : null}
    </section>
  );
}

// ---- Match row --------------------------------------------------------------
// One markup, two layouts: stacked teams on phones, home | score | away on
// wider screens (grid positions switch at `sm`).

function MatchRow({ f, locale, time }: { f: Fixture; locale: RouteLocale; time: TimeMode }) {
  const L = B[locale];
  const phase = fixturePhase(f);
  const scored = f.goals.home != null && f.goals.away != null;
  const decided = phase === 'finished';
  const homeLost = decided && f.teams.home.winner === false;
  const awayLost = decided && f.teams.away.winner === false;

  return (
    <li data-phase={phase}>
      <Link
        href={matchPath(locale, f)}
        className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-surface-2 sm:grid-cols-[4.75rem_minmax(0,1fr)_1.75rem_0.75rem_1.75rem_minmax(0,1fr)] sm:gap-y-0"
      >
        <span className="col-start-1 row-span-2 row-start-1 flex flex-col items-start justify-center sm:row-span-1">
          <StatusCell f={f} phase={phase} locale={locale} time={time} />
        </span>
        <TeamCell team={f.teams.home} muted={homeLost} className="col-start-2 row-start-1 sm:flex-row-reverse sm:text-right" />
        {scored ? (
          <Score value={f.goals.home} live={phase === 'live'} muted={homeLost} className="col-start-3 row-start-1" />
        ) : null}
        <span
          aria-hidden={scored ? true : undefined}
          className="hidden text-center text-xs font-bold text-muted-foreground sm:col-start-4 sm:row-start-1 sm:block"
        >
          {scored ? '–' : L.vs}
        </span>
        {scored ? (
          <Score
            value={f.goals.away}
            live={phase === 'live'}
            muted={awayLost}
            className="col-start-3 row-start-2 sm:col-start-5 sm:row-start-1"
          />
        ) : null}
        <TeamCell team={f.teams.away} muted={awayLost} className="col-start-2 row-start-2 sm:col-start-6 sm:row-start-1" />
      </Link>
    </li>
  );
}

export function StatusCell({ f, phase, locale, time }: { f: Fixture; phase: BoardPhase; locale: RouteLocale; time: TimeMode }) {
  const L = B[locale];
  const s = f.fixture.status;
  if (phase === 'live') {
    const label = s.short === 'HT' ? L.ht : s.elapsed != null ? `${s.elapsed}'` : L.live;
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-live">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
        <span className="sr-only">{L.live} </span>
        {label}
      </span>
    );
  }
  if (phase === 'finished') {
    return (
      <span className="text-xs font-extrabold text-muted-foreground uppercase">
        {L.final}
        {s.short === 'PEN' ? <span className="block normal-case">{L.pens}</span> : null}
      </span>
    );
  }
  if (phase === 'off') {
    const label = (L.off as Record<string, string>)[s.short] ?? s.long;
    return <span className="text-xs font-extrabold text-muted-foreground">{label}</span>;
  }
  if (time.kind === 'local') {
    return (
      <span className="text-sm font-extrabold tabular-nums text-foreground">
        <LocalTime iso={f.fixture.date} locale={locale} style="time" />
      </span>
    );
  }
  return (
    <span className="flex flex-col text-sm leading-tight font-extrabold tabular-nums text-foreground">
      {time.zones.map((z, i) => (
        <time key={z.zone} dateTime={f.fixture.date} className={i > 0 ? 'text-xs text-muted-foreground' : undefined}>
          {timeIn(f.fixture.date, z.zone, locale)}
          {z.short ? <span className="ml-1 text-[10px] font-bold text-muted-foreground">{z.short}</span> : null}
        </time>
      ))}
    </span>
  );
}

function TeamCell({
  team,
  muted,
  className,
}: {
  team: { name: string; logo: string };
  muted: boolean;
  className: string;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      <Image src={team.logo} alt="" width={22} height={22} unoptimized className="h-[22px] w-[22px] shrink-0 object-contain" />
      <span className={`truncate text-sm font-bold ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{team.name}</span>
    </span>
  );
}

function Score({ value, live, muted, className }: { value: number | null; live: boolean; muted: boolean; className: string }) {
  return (
    <span
      className={`${className} text-right font-display text-lg leading-none font-bold tabular-nums sm:text-center ${live ? 'text-live' : muted ? 'text-muted-foreground' : 'text-foreground'}`}
    >
      {value ?? '–'}
    </span>
  );
}
