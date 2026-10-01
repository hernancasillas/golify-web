import { localizeFixtures } from '@/lib/nations';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFixturesByDate } from '@/lib/api-football';
import { COMPETITIONS, competitionById, competitionName, competitionsForCountry } from '@/lib/competitions';
import { getPickSplit } from '@/lib/community';
import {
  homePath,
  hubPath,
  isHubCountry,
  sectionPath,
  ROUTE_LOCALES,
  type HubCountry,
  type RouteLocale,
} from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { HUB_COUNTRY_INFO, isoDateIn } from '@/lib/timezones';
import { broadcastsFor } from '@/data/broadcasters';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { DisplayHeading } from '@/components/revamp/ui';
import { Board, type TimeMode } from '@/components/hubs/Board';
import {
  AppPromo,
  CountryLinks,
  DayTabs,
  FeaturedMatch,
  matchesItemList,
  pickFeatured,
  WatchGuide,
} from '@/components/hubs/blocks';
import { COUNTRY_CLOCK, IN_COUNTRY, countryName, hubZones, titleIn } from '@/components/hubs/countries';
import { competitionsSentence, dayFacts, kickoffText, listJoin, matchName, plural, topCompetitions } from '@/components/hubs/copy';
import { addDays, competitionOrder, countPhases, dayLabel, groupByCompetition, zoneOffset } from '@/components/hubs/data';

// Country hub — /es/co/partidos-de-hoy (plan A4 "Hub país": one URL per
// country that updates every day, always indexable).
//
// "Today" is the country's own calendar day and every kickoff is printed on
// the server in the country's clock (plan A1.4), so the HTML a crawler reads
// says 19:30 for a Bogotá evening match, not a UTC time to be converted.
// One API call per render: /fixtures?date&timezone covers the whole day.
//
// ISR every two minutes: scores move during the day and the board is the
// page. generateStaticParams returns [] on purpose — prebuilding the 27
// country × language pages would only spend 9 API calls at build time on
// boards that are stale two minutes later; the first visit renders each one.
export const revalidate = 120;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; country: string };

const STR = {
  es: {
    home: 'Inicio',
    today: 'Partidos de hoy',
    h1: 'Partidos de hoy {in}',
    titleWatch: 'Partidos de hoy {in}: horarios y dónde ver',
    titleScores: 'Partidos de hoy {in}: horarios y resultados',
    desc: '{n} hoy {in} ({clock}): {comps}. Horarios, marcador en vivo y resultados del día.',
    descEmpty: 'Partidos de hoy {in} ({clock}): {comps} y más, con horarios, marcador en vivo y resultados.',
    introCount: 'Hoy hay {n} de {k}, con horarios en {clock}.',
    introLive: ' {n} en juego ahora mismo.',
    introSpan: ' Los horarios van de las {first} a las {last}.',
    introOne: ' Se juega a las {first}.',
    introEmpty: 'Hoy no hay partidos de las competiciones que seguimos {in}. Revisa los próximos días en el calendario de arriba.',
    match: ['partido', 'partidos'],
    comp: ['competición', 'competiciones'],
    liveWord: ['partido', 'partidos'],
    zone: 'Hora de {country}',
    liveLink: 'Resultados en vivo',
    empty: 'No hay partidos hoy en las competiciones que cubrimos.',
    faqTitle: 'Preguntas frecuentes',
    faqWhen: '¿A qué hora son los partidos de hoy {in}?',
    faqWhenMany: 'Hoy, {date}, hay {n} en {clock}. El primero es {firstMatch} ({firstComp}) a las {first} y el último, {lastMatch} ({lastComp}), a las {last}.',
    faqWhenOne: 'Hoy, {date}, hay un partido: {firstMatch} ({firstComp}) a las {first}, {clock}.',
    faqWhenNone: 'Hoy, {date}, no hay partidos de las competiciones que cubrimos {in}. Los horarios de los próximos días están en el calendario por fecha.',
    faqLeagues: '¿Qué ligas juegan hoy {in}?',
    faqLeaguesA: 'Hoy juegan {comps}.',
    faqWatch: '¿Dónde ver los partidos de hoy {in}?',
    faqWatchVerified: 'Con derechos verificados {in}: {list}. Golify no transmite partidos; en Golify sigues el marcador en vivo, las alineaciones y las alertas de gol.',
    faqWatchNone: 'Golify no transmite partidos. En Golify sigues cada partido de hoy minuto a minuto, con marcador en vivo, alineaciones y alertas de gol; la transmisión depende de quién tenga los derechos {in}.',
    on: 'en',
  },
  pt: {
    home: 'Início',
    today: 'Jogos de hoje',
    h1: 'Jogos de hoje {in}',
    titleWatch: 'Jogos de hoje {in}: horários e onde assistir',
    titleScores: 'Jogos de hoje {in}: horários e resultados',
    desc: '{n} hoje {in} ({clock}): {comps}. Horários, placar ao vivo e resultados do dia.',
    descEmpty: 'Jogos de hoje {in} ({clock}): {comps} e mais, com horários, placar ao vivo e resultados.',
    introCount: 'Hoje tem {n} de {k}, com horários no {clock}.',
    introLive: ' {n} rolando agora.',
    introSpan: ' Os horários vão das {first} às {last}.',
    introOne: ' Começa às {first}.',
    introEmpty: 'Hoje não há jogos das competições que acompanhamos {in}. Confira os próximos dias no calendário acima.',
    match: ['jogo', 'jogos'],
    comp: ['competição', 'competições'],
    liveWord: ['jogo', 'jogos'],
    zone: 'Horário: {country}',
    liveLink: 'Placares ao vivo',
    empty: 'Não há jogos hoje nas competições que cobrimos.',
    faqTitle: 'Perguntas frequentes',
    faqWhen: 'Que horas são os jogos de hoje {in}?',
    faqWhenMany: 'Hoje, {date}, tem {n} no {clock}. O primeiro é {firstMatch} ({firstComp}) às {first} e o último, {lastMatch} ({lastComp}), às {last}.',
    faqWhenOne: 'Hoje, {date}, tem um jogo: {firstMatch} ({firstComp}) às {first}, no {clock}.',
    faqWhenNone: 'Hoje, {date}, não há jogos das competições que cobrimos {in}. Os horários dos próximos dias estão no calendário por data.',
    faqLeagues: 'Quais campeonatos têm jogo hoje {in}?',
    faqLeaguesA: 'Hoje jogam {comps}.',
    faqWatch: 'Onde assistir aos jogos de hoje {in}?',
    faqWatchVerified: 'Com direitos verificados {in}: {list}. O Golify não transmite jogos; no Golify você acompanha o placar ao vivo, as escalações e os alertas de gol.',
    faqWatchNone: 'O Golify não transmite jogos. No Golify você acompanha cada jogo de hoje minuto a minuto, com placar ao vivo, escalações e alertas de gol; a transmissão depende de quem tem os direitos {in}.',
    on: 'na',
  },
  en: {
    home: 'Home',
    today: "Today's matches",
    h1: "Today's matches {in}",
    titleWatch: "Today's matches {in}: times and where to watch",
    titleScores: "Today's matches {in}: times and scores",
    desc: '{n} today {in} ({clock}): {comps}. Kickoff times, live scores and results.',
    descEmpty: "Today's matches {in} ({clock}): {comps} and more, with kickoff times, live scores and results.",
    introCount: 'There are {n} from {k} today, with kickoffs in {clock}.',
    introLive: ' {n} being played right now.',
    introSpan: ' Kickoffs run from {first} to {last}.',
    introOne: ' Kickoff at {first}.',
    introEmpty: "There are no matches today in the competitions we follow {in}. Check the coming days in the calendar above.",
    match: ['match', 'matches'],
    comp: ['competition', 'competitions'],
    liveWord: ['match', 'matches'],
    zone: '{country} time',
    liveLink: 'Live scores',
    empty: 'No matches today in the competitions we cover.',
    faqTitle: 'Frequently asked questions',
    faqWhen: "What time are today's matches {in}?",
    faqWhenMany: 'Today, {date}, there are {n} in {clock}. The first is {firstMatch} ({firstComp}) at {first} and the last, {lastMatch} ({lastComp}), at {last}.',
    faqWhenOne: 'Today, {date}, there is one match: {firstMatch} ({firstComp}) at {first}, {clock}.',
    faqWhenNone: 'Today, {date}, there are no matches {in} in the competitions we cover. Kickoff times for the coming days are in the date calendar.',
    faqLeagues: 'Which competitions are playing today {in}?',
    faqLeaguesA: 'Today: {comps}.',
    faqWatch: "Where can I watch today's matches {in}?",
    faqWatchVerified: 'With verified rights {in}: {list}. Golify does not stream matches; in Golify you follow the live score, lineups and goal alerts.',
    faqWatchNone: "Golify does not stream matches. In Golify you follow every one of today's matches minute by minute, with live scores, lineups and goal alerts; the broadcast depends on who holds the rights {in}.",
    on: 'on',
  },
} as const;

function fill(s: string, vars: Record<string, string | number>): string {
  // "EE. UU." ends in a period of its own; never print it twice.
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')).replace(/\.\./g, '.');
}

function compLabel(leagueId: number, locale: RouteLocale): string {
  const c = competitionById(leagueId);
  return c ? competitionName(c, locale) : '';
}

function resolve(p: Params): { locale: RouteLocale; cc: HubCountry } {
  if (!(ROUTE_LOCALES as readonly string[]).includes(p.locale) || !isHubCountry(p.country)) notFound();
  return { locale: p.locale as RouteLocale, cc: p.country };
}

/** True when the country has any verified broadcaster at all — decides if
 *  the title may promise "dónde ver". Stable per country, not per day. */
function hasVerifiedWatch(cc: HubCountry): boolean {
  return COMPETITIONS.some((c) => broadcastsFor(c.id, cc).length > 0);
}

async function load(cc: HubCountry, locale: RouteLocale) {
  const zone = HUB_COUNTRY_INFO[cc].zone;
  const today = isoDateIn(new Date(), zone);
  // Primary entity of the page: strict, so a failed call throws (Next keeps
  // the last good board) instead of publishing an empty day.
  const fixtures = localizeFixtures(await getFixturesByDate(today, competitionOrder(cc), zone, { strict: true }), locale);
  return { zone, today, fixtures, groups: groupByCompetition(fixtures) };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, cc } = resolve(await params);
  const L = STR[locale];
  const { groups } = await load(cc, locale);
  const facts = dayFacts(groups, locale);
  const vars = { in: IN_COUNTRY[cc][locale], clock: COUNTRY_CLOCK[cc][locale] };
  const home = competitionsForCountry(cc).map((c) => competitionName(c, locale));
  const description = facts.total
    ? fill(L.desc, {
        ...vars,
        n: plural(facts.total, L.match[0], L.match[1]),
        comps: topCompetitions(facts.competitions.map(([n]) => n), locale),
      })
    : fill(L.descEmpty, { ...vars, comps: listJoin(home.slice(0, 3), locale) });
  return pageMetadata({
    locale,
    path: (l) => hubPath(l, cc),
    title: fill(hasVerifiedWatch(cc) ? L.titleWatch : L.titleScores, { in: titleIn(cc, locale) }),
    description,
  });
}

export default async function CountryHubPage({ params }: { params: Promise<Params> }) {
  const { locale, cc } = resolve(await params);
  const L = STR[locale];
  const { today, fixtures, groups } = await load(cc, locale);
  const zones = hubZones(cc);
  const time: TimeMode = { kind: 'zones', zones };
  const counts = countPhases(fixtures);
  const facts = dayFacts(groups, locale);
  const pagePath = hubPath(locale, cc);
  const inCountry = IN_COUNTRY[cc][locale];
  const clock = COUNTRY_CLOCK[cc][locale];
  const name = countryName(cc, locale);
  const longDate = dayLabel(today, locale, 'long');

  const featured = pickFeatured(fixtures, competitionsForCountry(cc).map((c) => c.id));
  const split = featured ? await getPickSplit(featured.fixture.id) : null;

  // ---- Copy from the day's data ----
  const ko = (f: (typeof fixtures)[number]) => kickoffText(f.fixture.date, zones, locale);
  let intro: string;
  if (facts.total === 0) {
    intro = fill(L.introEmpty, { in: inCountry });
  } else {
    intro = fill(L.introCount, {
      n: plural(facts.total, L.match[0], L.match[1]),
      k: plural(facts.competitions.length, L.comp[0], L.comp[1]),
      clock,
    });
    if (facts.live > 0) intro += fill(L.introLive, { n: plural(facts.live, L.liveWord[0], L.liveWord[1]) });
    if (facts.first && facts.last) intro += fill(L.introSpan, { first: ko(facts.first), last: ko(facts.last) });
    else if (facts.first) intro += fill(L.introOne, { first: ko(facts.first) });
  }

  const faq: [string, string][] = [];
  const q = (s: string) => fill(s, { in: inCountry });
  if (facts.first && facts.last) {
    faq.push([
      q(L.faqWhen),
      fill(L.faqWhenMany, {
        date: longDate,
        n: plural(facts.total, L.match[0], L.match[1]),
        clock,
        firstMatch: matchName(facts.first, locale),
        firstComp: compLabel(facts.first.league.id, locale),
        first: ko(facts.first),
        lastMatch: matchName(facts.last, locale),
        lastComp: compLabel(facts.last.league.id, locale),
        last: ko(facts.last),
      }),
    ]);
  } else if (facts.first) {
    faq.push([
      q(L.faqWhen),
      fill(L.faqWhenOne, {
        date: longDate,
        clock,
        firstMatch: matchName(facts.first, locale),
        firstComp: compLabel(facts.first.league.id, locale),
        first: ko(facts.first),
      }),
    ]);
  } else {
    faq.push([q(L.faqWhen), fill(L.faqWhenNone, { date: longDate, in: inCountry })]);
  }
  if (facts.total > 0) {
    faq.push([q(L.faqLeagues), fill(L.faqLeaguesA, { comps: competitionsSentence(facts, locale) })]);
  }
  const watchToday = groups.flatMap((g) => {
    const ch = [...new Set(broadcastsFor(g.competition.id, cc).flatMap((b) => b.channels.map((c) => c.name)))];
    return ch.length ? [`${competitionName(g.competition, locale)} ${L.on} ${listJoin(ch, locale)}`] : [];
  });
  faq.push([
    q(L.faqWatch),
    watchToday.length
      ? fill(L.faqWatchVerified, { in: inCountry, list: watchToday.join('; ') })
      : fill(L.faqWatchNone, { in: inCountry }),
  ]);

  const crumbs = [
    { name: L.home, path: homePath(locale) },
    { name: L.today, path: sectionPath('today', locale) },
    { name },
  ];
  const offsets = zones.map((z) => `${z.short ? `${z.short} ` : ''}${zoneOffset(z.zone)}`).join(' · ');
  const tabs = [-1, 0, 1, 2, 3, 4, 5].map((n) => addDays(today, n));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={matchesItemList(fixtures, locale, `${fill(L.h1, { in: inCountry })} · ${longDate}`, pagePath)} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={pagePath} />

        <header className="mt-5">
          <p className="text-xs font-extrabold tracking-wider text-primary uppercase">{longDate}</p>
          <DisplayHeading as="h1" className="mt-2 text-3xl sm:text-5xl">
            {fill(L.h1, { in: inCountry })}
          </DisplayHeading>
          <p className="mt-3 max-w-3xl leading-relaxed font-semibold text-muted-foreground">{intro}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-extrabold text-foreground">
            <span aria-hidden="true">{HUB_COUNTRY_INFO[cc].flag}</span>
            {fill(L.zone, { country: name })}
            <span className="text-muted-foreground">({offsets})</span>
          </p>
          <DayTabs locale={locale} dates={tabs} current={today} today={today} todayHref={pagePath} />
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0">
            {groups.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="font-bold">{L.empty}</p>
              </div>
            ) : (
              <Board
                groups={groups}
                locale={locale}
                time={time}
                adPrefix="hub"
                indexable
                watchCountry={cc}
                watchCountryName={name}
                counts={counts}
              />
            )}

            <p className="mt-6">
              <Link href={sectionPath('live', locale)} className="text-sm font-extrabold text-primary hover:underline">
                {L.liveLink} ›
              </Link>
            </p>

            <FaqSection title={L.faqTitle} entries={faq} pagePath={pagePath} />
          </div>

          <aside className="mt-10 space-y-6 lg:mt-5">
            {featured ? <FeaturedMatch f={featured} locale={locale} time={time} split={split} /> : null}
            <WatchGuide country={cc} locale={locale} />
            <CountryLinks locale={locale} exclude={cc} className="rounded-2xl border border-border bg-surface p-5" />
            <AppPromo locale={locale} />
          </aside>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
