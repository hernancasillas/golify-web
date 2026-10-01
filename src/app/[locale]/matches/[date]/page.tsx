import { localizeFixtures } from '@/lib/nations';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fixturePhase, TTL, type Fixture } from '@/lib/api-football';
import { competitionById, competitionName } from '@/lib/competitions';
import { datePath, homePath, sectionPath, ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { isoDateIn } from '@/lib/timezones';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { DisplayHeading } from '@/components/revamp/ui';
import { Board, type TimeMode } from '@/components/hubs/Board';
import { AppPromo, CountryLinks, DayTabs, matchesItemList } from '@/components/hubs/blocks';
import { competitionsSentence, dayFacts, kickoffText, matchName, plural, topCompetitions } from '@/components/hubs/copy';
import {
  addDays,
  competitionOrder,
  dayLabel,
  daysBetween,
  fixturesOfDay,
  groupByCompetition,
  LOCALE_ZONE,
  parseIsoDate,
} from '@/components/hubs/data';

// Date archive — /es/partidos/2026-10-04 (plan A6: archive navigable by
// date). Every covered fixture of that calendar day, with the day counted
// and the kickoffs printed in the language's main market (Mexico City for
// es, Brasília for pt, US Eastern for en; stated on the page).
//
// Indexing (plan A4 rule: no thin pages in the index): a day is indexable
// when it is within [-400, +30] days of today AND has at least one covered
// fixture. Further out it stays reachable but noindex; outside
// [-3650, +365] it does not exist.
//
// Cache: the page revalidates hourly; the day's fetch carries its own window
// (10 min for today and the future, 1 h for the last few days, a day for
// older history), and Next revalidates at the shortest of the two.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; date: string };

const STR = {
  es: {
    home: 'Inicio',
    today: 'Partidos de hoy',
    h1: 'Partidos del {date}',
    titlePast: 'Partidos del {date}: resultados',
    titleToday: 'Partidos del {date}: horarios y resultados',
    titleFuture: 'Partidos del {date}: horarios',
    descPast: '{n} del {date}: {comps}. Resultados y marcadores finales, con horarios en {clock}.',
    descFuture: '{n} programados para el {date}: {comps}. Horarios en {clock} y enlaces a cada partido.',
    descEmpty: 'Partidos del {date} en las competiciones que cubre Golify, con horarios en {clock}.',
    introPast: 'El {date} se jugaron {n} de {k}.',
    introFuture: 'Para el {date} hay {n} de {k}.',
    introSpan: ' El primero arranca a las {first} y el último a las {last}.',
    introOne: ' Arranca a las {first}.',
    introGoals: ' El partido con más goles fue {home} {h}-{a} {away} ({comp}).',
    introOff: ' {n} no se jugó en la fecha prevista.',
    introOffMany: ' {n} no se jugaron en la fecha prevista.',
    introEmpty: 'El {date} no hay partidos de las competiciones que cubrimos.',
    zone: 'Horarios en {clock}.',
    prev: 'Día anterior',
    next: 'Día siguiente',
    todayLink: 'Ver los partidos de hoy',
    countries: 'Partidos de hoy por país',
    match: ['partido', 'partidos'],
    comp: ['competición', 'competiciones'],
    empty: 'No hay partidos de las competiciones que cubrimos en esta fecha.',
    faqTitle: 'Preguntas frecuentes',
    faqWhatPast: '¿Qué partidos se jugaron el {date}?',
    faqWhatFuture: '¿Qué partidos hay el {date}?',
    faqWhatA: 'El {date} hay {n} en las competiciones que cubre Golify: {comps}.',
    faqResults: '¿Cuáles fueron los resultados del {date}?',
    faqFirst: '¿A qué hora es el primer partido del {date}?',
    faqFirstA: 'El primero es {match} ({comp}), a las {time} ({clock}).',
    more: 'y {n} más',
  },
  pt: {
    home: 'Início',
    today: 'Jogos de hoje',
    h1: 'Jogos de {date}',
    titlePast: 'Jogos de {date}: resultados',
    titleToday: 'Jogos de {date}: horários e resultados',
    titleFuture: 'Jogos de {date}: horários',
    descPast: '{n} em {date}: {comps}. Resultados e placares finais, com horários ({clock}).',
    descFuture: '{n} marcados para {date}: {comps}. Horários ({clock}) e links para cada jogo.',
    descEmpty: 'Jogos de {date} nas competições que o Golify cobre, com horários ({clock}).',
    introPast: 'Em {date} foram disputados {n} de {k}.',
    introFuture: 'Para {date} estão marcados {n} de {k}.',
    introSpan: ' O primeiro começa às {first} e o último às {last}.',
    introOne: ' Começa às {first}.',
    introGoals: ' O jogo com mais gols foi {home} {h}-{a} {away} ({comp}).',
    introOff: ' {n} não foi disputado na data prevista.',
    introOffMany: ' {n} não foram disputados na data prevista.',
    introEmpty: 'Em {date} não há jogos das competições que cobrimos.',
    zone: 'Fuso: {clock}.',
    prev: 'Dia anterior',
    next: 'Dia seguinte',
    todayLink: 'Ver os jogos de hoje',
    countries: 'Jogos de hoje por país',
    match: ['jogo', 'jogos'],
    comp: ['competição', 'competições'],
    empty: 'Não há jogos das competições que cobrimos nesta data.',
    faqTitle: 'Perguntas frequentes',
    faqWhatPast: 'Quais jogos foram disputados em {date}?',
    faqWhatFuture: 'Quais jogos tem em {date}?',
    faqWhatA: 'Em {date} são {n} nas competições que o Golify cobre: {comps}.',
    faqResults: 'Quais foram os resultados de {date}?',
    faqFirst: 'Que horas é o primeiro jogo de {date}?',
    faqFirstA: 'O primeiro é {match} ({comp}), às {time} ({clock}).',
    more: 'e mais {n}',
  },
  en: {
    home: 'Home',
    today: "Today's matches",
    h1: 'Football matches on {date}',
    titlePast: 'Football matches on {date}: results',
    titleToday: 'Football matches on {date}: times and scores',
    titleFuture: 'Football matches on {date}: kickoff times',
    descPast: '{n} on {date}: {comps}. Results and final scores, with kickoffs in {clock}.',
    descFuture: '{n} scheduled for {date}: {comps}. Kickoffs in {clock} and a link to every match.',
    descEmpty: 'Matches on {date} in the competitions Golify covers, with kickoffs in {clock}.',
    introPast: '{n} from {k} were played on {date}.',
    introFuture: 'There are {n} from {k} on {date}.',
    introSpan: ' The first kicks off at {first} and the last at {last}.',
    introOne: ' Kickoff is at {first}.',
    introGoals: ' The highest-scoring match was {home} {h}-{a} {away} ({comp}).',
    introOff: ' {n} was not played on its scheduled date.',
    introOffMany: ' {n} were not played on their scheduled date.',
    introEmpty: 'There are no matches on {date} in the competitions we cover.',
    zone: 'Kickoffs in {clock}.',
    prev: 'Previous day',
    next: 'Next day',
    todayLink: "See today's matches",
    countries: "Today's matches by country",
    match: ['match', 'matches'],
    comp: ['competition', 'competitions'],
    empty: 'No matches in the competitions we cover on this date.',
    faqTitle: 'Frequently asked questions',
    faqWhatPast: 'Which matches were played on {date}?',
    faqWhatFuture: 'Which matches are on {date}?',
    faqWhatA: 'On {date} there are {n} in the competitions Golify covers: {comps}.',
    faqResults: 'What were the results on {date}?',
    faqFirst: 'What time is the first match on {date}?',
    faqFirstA: 'The first is {match} ({comp}), at {time} ({clock}).',
    more: 'and {n} more',
  },
} as const;

const MIN_DAYS = -3650;
const MAX_DAYS = 365;

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

function compLabel(id: number, locale: RouteLocale): string {
  const c = competitionById(id);
  return c ? competitionName(c, locale) : '';
}

function resolve(p: Params) {
  if (!(ROUTE_LOCALES as readonly string[]).includes(p.locale)) notFound();
  const locale = p.locale as RouteLocale;
  const date = parseIsoDate(p.date);
  if (!date) notFound();
  const { zone } = LOCALE_ZONE[locale];
  const today = isoDateIn(new Date(), zone);
  const offset = daysBetween(today, date);
  if (offset < MIN_DAYS || offset > MAX_DAYS) notFound();
  return { locale, date, zone, today, offset };
}

async function load(date: string, zone: string, offset: number, locale: RouteLocale) {
  const ttl = offset >= 0 ? 600 : offset >= -3 ? 3600 : TTL.daily;
  // Primary entity: strict, so a failed call throws (Next keeps the last
  // good copy) instead of publishing the day as empty.
  const fixtures = localizeFixtures(await fixturesOfDay(date, zone, competitionOrder(), { revalidate: ttl, strict: true }), locale);
  return { fixtures, groups: groupByCompetition(fixtures) };
}

function isIndexable(offset: number, fixtures: Fixture[]): boolean {
  return offset >= -400 && offset <= 30 && fixtures.length > 0;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, date, zone, offset } = resolve(await params);
  const L = STR[locale];
  const { fixtures, groups } = await load(date, zone, offset, locale);
  const facts = dayFacts(groups, locale);
  const pretty = dayLabel(date, locale, 'medium');
  const clock = LOCALE_ZONE[locale].label[locale];
  const vars = {
    date: pretty,
    clock,
    n: plural(facts.total, L.match[0], L.match[1]),
    comps: topCompetitions(facts.competitions.map(([n]) => n), locale),
  };
  const title = offset < 0 ? L.titlePast : offset === 0 ? L.titleToday : L.titleFuture;
  const description = facts.total ? fill(offset < 0 ? L.descPast : L.descFuture, vars) : fill(L.descEmpty, vars);
  return pageMetadata({
    locale,
    path: (l) => datePath(l, date),
    title: fill(title, { date: pretty }),
    description,
    noindex: !isIndexable(offset, fixtures),
  });
}

export default async function DateArchivePage({ params }: { params: Promise<Params> }) {
  const { locale, date, zone, today, offset } = resolve(await params);
  const L = STR[locale];
  const { fixtures, groups } = await load(date, zone, offset, locale);
  const indexable = isIndexable(offset, fixtures);
  const facts = dayFacts(groups, locale);
  const clock = LOCALE_ZONE[locale].label[locale];
  const zones = [{ zone }];
  const time: TimeMode = { kind: 'zones', zones };
  const pagePath = datePath(locale, date);
  const pretty = dayLabel(date, locale, 'medium');
  const longDate = dayLabel(date, locale, 'long');
  const ko = (f: Fixture) => kickoffText(f.fixture.date, zones, locale);
  const nMatches = plural(facts.total, L.match[0], L.match[1]);

  // ---- Copy from the day's data ----
  let intro: string;
  const finished = fixtures.filter((f) => fixturePhase(f) === 'finished');
  const off = fixtures.filter((f) => fixturePhase(f) === 'off').length;
  if (facts.total === 0) {
    intro = fill(L.introEmpty, { date: pretty });
  } else if (offset < 0) {
    intro = fill(L.introPast, { date: pretty, n: nMatches, k: plural(facts.competitions.length, L.comp[0], L.comp[1]) });
    const top = [...finished].sort(
      (a, b) => (b.goals.home ?? 0) + (b.goals.away ?? 0) - ((a.goals.home ?? 0) + (a.goals.away ?? 0)),
    )[0];
    if (top && (top.goals.home ?? 0) + (top.goals.away ?? 0) >= 3) {
      intro += fill(L.introGoals, {
        home: top.teams.home.name,
        away: top.teams.away.name,
        h: top.goals.home ?? 0,
        a: top.goals.away ?? 0,
        comp: compLabel(top.league.id, locale),
      });
    }
    if (off > 0) intro += fill(off === 1 ? L.introOff : L.introOffMany, { n: plural(off, L.match[0], L.match[1]) });
  } else {
    intro = fill(L.introFuture, { date: pretty, n: nMatches, k: plural(facts.competitions.length, L.comp[0], L.comp[1]) });
    if (facts.first && facts.last) intro += fill(L.introSpan, { first: ko(facts.first), last: ko(facts.last) });
    else if (facts.first) intro += fill(L.introOne, { first: ko(facts.first) });
  }

  const faq: [string, string][] = [];
  if (facts.total > 0) {
    faq.push([
      fill(offset < 0 ? L.faqWhatPast : L.faqWhatFuture, { date: pretty }),
      fill(L.faqWhatA, { date: pretty, n: nMatches, comps: competitionsSentence(facts, locale) }),
    ]);
    if (finished.length > 0 && offset <= 0) {
      const shown = finished.slice(0, 8).map(
        (f) => `${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name} (${compLabel(f.league.id, locale)})`,
      );
      const rest = finished.length - shown.length;
      const answer = rest > 0 ? `${shown.join('; ')}; ${fill(L.more, { n: rest })}.` : `${shown.join('; ')}.`;
      faq.push([fill(L.faqResults, { date: pretty }), answer]);
    }
    if (offset >= 0 && facts.first) {
      faq.push([
        fill(L.faqFirst, { date: pretty }),
        fill(L.faqFirstA, {
          match: matchName(facts.first, locale),
          comp: compLabel(facts.first.league.id, locale),
          time: ko(facts.first),
          clock,
        }),
      ]);
    }
  }

  const crumbs = [
    { name: L.home, path: homePath(locale) },
    { name: L.today, path: sectionPath('today', locale) },
    { name: pretty },
  ];
  const tabs = [-3, -2, -1, 0, 1, 2, 3]
    .map((n) => addDays(date, n))
    .filter((d) => {
      const o = daysBetween(today, d);
      return o >= MIN_DAYS && o <= MAX_DAYS;
    });
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const hasPrev = daysBetween(today, prev) >= MIN_DAYS;
  const hasNext = daysBetween(today, next) <= MAX_DAYS;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={matchesItemList(fixtures, locale, fill(L.h1, { date: longDate }), pagePath)} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={pagePath} />

        <header className="mt-5">
          <DisplayHeading as="h1" className="text-3xl sm:text-5xl">
            {fill(L.h1, { date: longDate })}
          </DisplayHeading>
          <p className="mt-3 max-w-3xl leading-relaxed font-semibold text-muted-foreground">{intro}</p>
          <p className="mt-4 inline-flex rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-extrabold text-foreground">
            {fill(L.zone, { clock })}
          </p>
          <DayTabs locale={locale} dates={tabs} current={date} today={today} todayHref={sectionPath('today', locale)} />
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0">
            {groups.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="font-bold">{L.empty}</p>
              </div>
            ) : (
              <Board groups={groups} locale={locale} time={time} adPrefix="date" indexable={indexable} />
            )}

            <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-extrabold">
              {hasPrev ? (
                <Link href={datePath(locale, prev)} rel="prev" className="text-primary hover:underline">
                  ‹ {L.prev}: {dayLabel(prev, locale, 'medium')}
                </Link>
              ) : (
                <span />
              )}
              {hasNext ? (
                <Link href={datePath(locale, next)} rel="next" className="text-primary hover:underline">
                  {L.next}: {dayLabel(next, locale, 'medium')} ›
                </Link>
              ) : null}
            </nav>

            <FaqSection title={L.faqTitle} entries={faq} pagePath={pagePath} />
          </div>

          <aside className="mt-10 space-y-6 lg:mt-5">
            <section className="rounded-2xl border border-border bg-surface p-5">
              <Link
                href={sectionPath('today', locale)}
                className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:brightness-105"
              >
                {L.todayLink}
              </Link>
              <CountryLinks locale={locale} title={L.countries} className="mt-5" />
            </section>
            <AppPromo locale={locale} />
          </aside>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
