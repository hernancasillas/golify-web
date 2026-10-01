import Image from 'next/image';
import Link from 'next/link';
import { fixturePhase, type Fixture } from '@/lib/api-football';
import { COMPETITIONS, competitionName } from '@/lib/competitions';
import type { PickSplit } from '@/lib/community';
import {
  datePath,
  hubPath,
  matchPath,
  whereToWatchPath,
  HUB_COUNTRIES,
  type HubCountry,
  type RouteLocale,
} from '@/lib/routes';
import { absolute, type JsonLdNode } from '@/lib/seo';
import { HUB_COUNTRY_INFO } from '@/lib/timezones';
import { broadcastsFor, WATCH_COUNTRY_SLUGS } from '@/data/broadcasters';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { InstallCTA } from '@/components/InstallCTA';
import { Eyebrow } from '@/components/revamp/ui';
import { StatusCell, type TimeMode } from './Board';
import { countryName, IN_COUNTRY } from './countries';
import { dayLabel } from './data';

// Side blocks of the daily boards (design: Hoy-Colombia). Each one renders
// only when real data backs it.

const S = {
  es: {
    today: 'Hoy',
    days: 'Elegir día',
    featured: 'Destacado del día',
    follow: 'Seguir minuto a minuto',
    otherCountries: 'Partidos de hoy en otros países',
    pickCountry: 'Partidos de hoy en tu país',
    watchTitle: 'Dónde ver fútbol {in}',
    watchNote: 'Golify no transmite partidos: te mostramos quién tiene los derechos, verificado con la fuente oficial.',
    watchGuide: 'Ver la guía',
    appEyebrow: 'App Golify',
    appTitle: 'Que no se te escape ningún gol',
    appText: 'Alertas de gol de tus equipos, marcador en vivo y la quiniela de la jornada con tus amigos.',
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    vs: 'vs',
  },
  pt: {
    today: 'Hoje',
    days: 'Escolher dia',
    featured: 'Destaque do dia',
    follow: 'Acompanhar minuto a minuto',
    otherCountries: 'Jogos de hoje em outros países',
    pickCountry: 'Jogos de hoje no seu país',
    watchTitle: 'Onde assistir futebol {in}',
    watchNote: 'O Golify não transmite jogos: mostramos quem tem os direitos, verificado na fonte oficial.',
    watchGuide: 'Ver o guia',
    appEyebrow: 'App Golify',
    appTitle: 'Não perca nenhum gol',
    appText: 'Alertas de gol dos seus times, placar ao vivo e o bolão da rodada com os amigos.',
    open: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    vs: 'x',
  },
  en: {
    today: 'Today',
    days: 'Pick a day',
    featured: 'Match of the day',
    follow: 'Follow it minute by minute',
    otherCountries: "Today's matches in other countries",
    pickCountry: "Today's matches in your country",
    watchTitle: 'Where to watch football {in}',
    watchNote: 'Golify does not stream matches: we show who holds the rights, checked against the official source.',
    watchGuide: 'See the guide',
    appEyebrow: 'Golify app',
    appTitle: 'Never miss a goal',
    appText: "Goal alerts for your teams, live scores and this round's pool with your friends.",
    open: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    vs: 'vs',
  },
} as const;

// ---- Day tabs -------------------------------------------------------------

export function DayTabs({
  locale,
  dates,
  current,
  today,
  todayHref,
}: {
  locale: RouteLocale;
  dates: string[];
  current: string;
  /** The board's "today" (that tab links to the live board, not the archive). */
  today: string;
  todayHref: string;
}) {
  const L = S[locale];
  return (
    <nav aria-label={L.days} className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <ol className="flex w-max gap-1.5">
        {dates.map((d) => {
          const isCurrent = d === current;
          const label = d === today ? `${L.today} ${Number(d.slice(8))}` : dayLabel(d, locale, 'tab');
          return (
            <li key={d}>
              <Link
                href={d === today ? todayHref : datePath(locale, d)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`inline-flex min-w-[4.25rem] justify-center rounded-xl border px-3 py-2 text-xs font-extrabold whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-surface text-foreground hover:bg-surface-2'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---- Featured match ---------------------------------------------------------

/** The match the hub leads with: the first one live in the visitor's
 *  competitions, else the next to kick off, else the last finished. */
export function pickFeatured(fixtures: Fixture[], priorityIds: readonly number[]): Fixture | null {
  const prio = new Set(priorityIds);
  const pool = fixtures.filter((f) => prio.has(f.league.id));
  const from = pool.length ? pool : fixtures;
  return (
    from.find((f) => fixturePhase(f) === 'live') ??
    from.find((f) => fixturePhase(f) === 'scheduled') ??
    [...from].reverse().find((f) => fixturePhase(f) === 'finished') ??
    null
  );
}

export function FeaturedMatch({
  f,
  locale,
  time,
  split,
}: {
  f: Fixture;
  locale: RouteLocale;
  time: TimeMode;
  split: PickSplit | null;
}) {
  const L = S[locale];
  const phase = fixturePhase(f);
  const scored = f.goals.home != null && f.goals.away != null;
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-surface to-band p-5">
      <p className="text-[11px] font-extrabold tracking-wider text-primary uppercase">{L.featured}</p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center">
        <TeamBadge team={f.teams.home} />
        <div className="flex flex-col items-center gap-1">
          {scored ? (
            <span className={`font-display text-3xl leading-none font-bold tabular-nums ${phase === 'live' ? 'text-live' : 'text-foreground'}`}>
              {f.goals.home}–{f.goals.away}
            </span>
          ) : null}
          <StatusCell f={f} phase={phase} locale={locale} time={time} />
        </div>
        <TeamBadge team={f.teams.away} />
      </div>
      {split ? (
        <div className="mt-4">
          <CommunitySplit split={split} home={f.teams.home.name} away={f.teams.away.name} locale={locale} compact />
        </div>
      ) : null}
      <Link
        href={matchPath(locale, f)}
        className="mt-4 flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:brightness-105"
      >
        {L.follow}
      </Link>
    </section>
  );
}

function TeamBadge({ team }: { team: { name: string; logo: string } }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-2">
      <Image src={team.logo} alt="" width={40} height={40} unoptimized className="h-10 w-10 object-contain" />
      <span className="line-clamp-2 text-sm leading-tight font-bold text-foreground">{team.name}</span>
    </span>
  );
}

// ---- Where to watch (verified data only) -----------------------------------

export function WatchGuide({ country, locale }: { country: HubCountry; locale: RouteLocale }) {
  const L = S[locale];
  const rows = COMPETITIONS.flatMap((c) => {
    const entries = broadcastsFor(c.id, country);
    if (entries.length === 0) return [];
    const channels = [...new Set(entries.flatMap((e) => e.channels.map((ch) => ch.name)))];
    return [{ c, channels, href: whereToWatchPath(locale, c.id, WATCH_COUNTRY_SLUGS[country]) }];
  });
  if (rows.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-bold tracking-wide uppercase">
        {L.watchTitle.replace('{in}', IN_COUNTRY[country][locale])}
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {rows.map(({ c, channels, href }) => (
          <li key={c.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
            <span className="font-bold text-foreground">{competitionName(c, locale)}</span>
            {href ? (
              <Link href={href} className="text-right font-semibold text-muted-foreground hover:text-foreground">
                {channels.join(' · ')}
              </Link>
            ) : (
              <span className="text-right font-semibold text-muted-foreground">{channels.join(' · ')}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">{L.watchNote}</p>
    </section>
  );
}

// ---- Country hubs -------------------------------------------------------------

export function CountryLinks({
  locale,
  exclude,
  title,
  className,
}: {
  locale: RouteLocale;
  exclude?: HubCountry;
  /** Defaults to "other countries" when a country is excluded. */
  title?: string;
  className?: string;
}) {
  const L = S[locale];
  const list = HUB_COUNTRIES.filter((c) => c !== exclude);
  return (
    <section className={className}>
      <h2 className="font-display text-lg font-bold tracking-wide uppercase">
        {title ?? (exclude ? L.otherCountries : L.pickCountry)}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {list.map((cc) => (
          <li key={cc}>
            <Link
              href={hubPath(locale, cc)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-surface-2"
            >
              <span aria-hidden="true">{HUB_COUNTRY_INFO[cc].flag}</span>
              {countryName(cc, locale)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- App promo ----------------------------------------------------------------

export function AppPromo({ locale }: { locale: RouteLocale }) {
  const L = S[locale];
  return (
    <section className="rounded-2xl border border-border bg-band p-6">
      <Eyebrow tone="mint" pulse={false}>
        {L.appEyebrow}
      </Eyebrow>
      <h2 className="mt-4 font-display text-2xl leading-tight font-bold tracking-wide text-foreground uppercase">{L.appTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed font-semibold text-muted-foreground">{L.appText}</p>
      <div className="mt-5">
        <InstallCTA deeplink="golify://" labels={{ open: L.open, ios: L.ios, android: L.android }} />
      </div>
    </section>
  );
}

// ---- Structured data ------------------------------------------------------------

// schema.org EventStatusType has no "live" or "finished" member; only the
// abnormal states change it.
function eventStatus(f: Fixture): string {
  const s = f.fixture.status.short;
  if (s === 'PST') return 'https://schema.org/EventPostponed';
  if (s === 'CANC' || s === 'ABD') return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

/** ItemList of SportsEvent for the matches listed on a board (cap 50). */
export function matchesItemList(fixtures: Fixture[], locale: RouteLocale, name: string, pagePath: string): JsonLdNode | null {
  if (fixtures.length === 0) return null;
  const list = fixtures.slice(0, 50);
  const vs = S[locale].vs;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absolute(pagePath)}#matches`,
    name,
    numberOfItems: list.length,
    itemListElement: list.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SportsEvent',
        name: `${f.teams.home.name} ${vs} ${f.teams.away.name}`,
        sport: 'Soccer',
        startDate: f.fixture.date,
        eventStatus: eventStatus(f),
        url: absolute(matchPath(locale, f)),
        homeTeam: { '@type': 'SportsTeam', name: f.teams.home.name },
        awayTeam: { '@type': 'SportsTeam', name: f.teams.away.name },
      },
    })),
  };
}
