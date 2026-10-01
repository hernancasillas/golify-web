import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFixturesByDate } from '@/lib/api-football';
import { competitionById, competitionName } from '@/lib/competitions';
import { getPickSplit } from '@/lib/community';
import { homePath, sectionPath, HUB_COUNTRIES, ROUTE_LOCALES, type HubCountry, type RouteLocale } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { isoDateIn } from '@/lib/timezones';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LocalTimeScript } from '@/components/LocalTime';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { DisplayHeading } from '@/components/revamp/ui';
import { Board, type TimeMode } from '@/components/hubs/Board';
import { AppPromo, CountryLinks, DayTabs, FeaturedMatch, matchesItemList, pickFeatured } from '@/components/hubs/blocks';
import { COUNTRY_CLOCK, countryName } from '@/components/hubs/countries';
import { HubSuggest } from '@/components/hubs/HubSuggest';
import { competitionsSentence, dayFacts, kickoffText, listJoin, matchName, plural, topCompetitions } from '@/components/hubs/copy';
import {
  addDays,
  competitionOrder,
  countPhases,
  dayLabel,
  groupByCompetition,
  LOCALE_ZONE,
  strictAtRuntime,
} from '@/components/hubs/data';

// The recurring-demand page: "partidos de hoy" is searched every single day,
// unlike a tournament page that dies with the tournament.
//
// The HTML is one cached copy for every visitor, so it cannot be cut to the
// visitor's zone on the server. Instead (plan A1.4): kickoffs are converted
// to the visitor's own clock in the browser (LocalTime), the browser's zone
// suggests the matching country hub, and the country chips are the "change
// zone" option — each hub prints its kickoffs server-side in that country's
// clock. The calendar day itself is the language's main market (Mexico City
// for es, Brasília for pt, US Eastern for en), stated on the page and shared
// with the date archive the day tabs link to.
export const revalidate = 120;

const STR = {
  es: {
    home: 'Inicio',
    eyebrow: 'Hoy',
    h1: 'Partidos de hoy',
    title: 'Partidos de hoy: horarios y resultados en vivo',
    desc: '{n} hoy: {comps}. Horarios en tu zona, marcador en vivo y resultados, con calendario por país.',
    descEmpty: 'Los partidos de hoy de Liga MX, Brasileirão, Libertadores, Champions y más, con horarios en tu zona y marcador en vivo.',
    intro: 'Hoy hay {n} de {k}.',
    introLive: ' {n} en juego ahora mismo.',
    introSpan: ' Los horarios van de las {first} a las {last} ({clock}).',
    introOne: ' Se juega a las {first} ({clock}).',
    introEmpty: 'Hoy no hay partidos de las competiciones que seguimos. Revisa los próximos días en el calendario.',
    tzNote: 'Los horarios de la lista se muestran en la hora de tu dispositivo. El día se cuenta en {clock}.',
    pickCountry: 'Elige tu país para ver los horarios en su hora',
    suggest: 'Ver los horarios en {clock}',
    match: ['partido', 'partidos'],
    comp: ['competición', 'competiciones'],
    empty: 'Hoy no hay partidos programados en las competiciones que cubrimos.',
    liveLink: 'Resultados en vivo',
    faqTitle: 'Preguntas frecuentes',
    faqWhat: '¿Qué partidos hay hoy?',
    faqWhatA: 'Hoy, {date}, hay {n}: {comps}.',
    faqWhatNone: 'Hoy, {date}, no hay partidos de las competiciones que cubrimos. El calendario por fecha muestra los próximos días.',
    faqFirst: '¿A qué hora es el primer partido de hoy?',
    faqFirstA: 'El primero es {match} ({comp}), a las {time} ({clock}).',
    faqTz: '¿En qué hora aparecen los horarios?',
    faqTzA: 'En la lista, en la hora de tu dispositivo. El día se cuenta en {clock}. Cada país tiene su página con los horarios fijos en su hora: {countries}.',
  },
  pt: {
    home: 'Início',
    eyebrow: 'Hoje',
    h1: 'Jogos de hoje',
    title: 'Jogos de hoje: horários e resultados ao vivo',
    desc: '{n} hoje: {comps}. Horários no seu fuso, placar ao vivo e resultados, com calendário por país.',
    descEmpty: 'Os jogos de hoje do Brasileirão, Libertadores, Sul-Americana, Champions e mais, com horários no seu fuso e placar ao vivo.',
    intro: 'Hoje tem {n} de {k}.',
    introLive: ' {n} rolando agora.',
    introSpan: ' Os horários vão das {first} às {last} ({clock}).',
    introOne: ' Começa às {first} ({clock}).',
    introEmpty: 'Hoje não há jogos das competições que acompanhamos. Confira os próximos dias no calendário.',
    tzNote: 'Os horários da lista aparecem no fuso do seu aparelho. O dia é contado pelo {clock}.',
    pickCountry: 'Escolha o seu país para ver os horários no fuso dele',
    suggest: 'Ver os horários no {clock}',
    match: ['jogo', 'jogos'],
    comp: ['competição', 'competições'],
    empty: 'Hoje não há jogos marcados nas competições que cobrimos.',
    liveLink: 'Placares ao vivo',
    faqTitle: 'Perguntas frequentes',
    faqWhat: 'Quais jogos tem hoje?',
    faqWhatA: 'Hoje, {date}, tem {n}: {comps}.',
    faqWhatNone: 'Hoje, {date}, não há jogos das competições que cobrimos. O calendário por data mostra os próximos dias.',
    faqFirst: 'Que horas é o primeiro jogo de hoje?',
    faqFirstA: 'O primeiro é {match} ({comp}), às {time} ({clock}).',
    faqTz: 'Em que fuso aparecem os horários?',
    faqTzA: 'Na lista, no fuso do seu aparelho. O dia é contado pelo {clock}. Cada país tem a sua página com os horários fixos no fuso local: {countries}.',
  },
  en: {
    home: 'Home',
    eyebrow: 'Today',
    h1: "Today's football matches",
    title: "Today's football matches: times and live scores",
    desc: '{n} today: {comps}. Kickoffs in your time zone, live scores and results, with a board per country.',
    descEmpty: "Today's matches from Liga MX, MLS, Brasileirão, the Champions League and more, with kickoffs in your time zone and live scores.",
    intro: 'There are {n} from {k} today.',
    introLive: ' {n} being played right now.',
    introSpan: ' Kickoffs run from {first} to {last} ({clock}).',
    introOne: ' Kickoff at {first} ({clock}).',
    introEmpty: 'There are no matches today in the competitions we follow. Check the coming days in the calendar.',
    tzNote: "Kickoffs in the list are shown in your device's time zone. The day is counted in {clock}.",
    pickCountry: 'Pick your country to see kickoffs in its local time',
    suggest: 'See kickoffs in {clock}',
    match: ['match', 'matches'],
    comp: ['competition', 'competitions'],
    empty: 'No matches scheduled today in the competitions we cover.',
    liveLink: 'Live scores',
    faqTitle: 'Frequently asked questions',
    faqWhat: 'Which matches are on today?',
    faqWhatA: 'Today, {date}, there are {n}: {comps}.',
    faqWhatNone: 'Today, {date}, there are no matches in the competitions we cover. The date calendar shows the coming days.',
    faqFirst: "What time is today's first match?",
    faqFirstA: 'The first is {match} ({comp}), at {time} ({clock}).',
    faqTz: 'Which time zone are the kickoffs in?',
    faqTzA: "In the list, your device's time zone. The day is counted in {clock}. Each country has its own page with kickoffs fixed in local time: {countries}.",
  },
} as const;

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

function resolveLocale(v: string): RouteLocale {
  if (!(ROUTE_LOCALES as readonly string[]).includes(v)) notFound();
  return v as RouteLocale;
}

async function load(locale: RouteLocale) {
  const { zone } = LOCALE_ZONE[locale];
  const today = isoDateIn(new Date(), zone);
  const fixtures = await getFixturesByDate(today, competitionOrder(), zone, { strict: strictAtRuntime() });
  return { zone, today, fixtures, groups: groupByCompetition(fixtures) };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const L = STR[locale];
  const { groups } = await load(locale);
  const facts = dayFacts(groups, locale);
  return pageMetadata({
    locale,
    path: (l) => sectionPath('today', l),
    title: L.title,
    description: facts.total
      ? fill(L.desc, {
          n: plural(facts.total, L.match[0], L.match[1]),
          comps: topCompetitions(facts.competitions.map(([n]) => n), locale),
        })
      : L.descEmpty,
  });
}

export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const L = STR[locale];
  const { zone, today, fixtures, groups } = await load(locale);
  const clock = LOCALE_ZONE[locale].label[locale];
  const zones = [{ zone }];
  const time: TimeMode = { kind: 'local' };
  const facts = dayFacts(groups, locale);
  const pagePath = sectionPath('today', locale);
  const longDate = dayLabel(today, locale, 'long');
  const featured = pickFeatured(fixtures, []);
  const split = featured ? await getPickSplit(featured.fixture.id) : null;
  const ko = (iso: string) => kickoffText(iso, zones, locale);
  const comp = (id: number) => {
    const c = competitionById(id);
    return c ? competitionName(c, locale) : '';
  };

  let intro: string;
  if (facts.total === 0) {
    intro = L.introEmpty;
  } else {
    intro = fill(L.intro, {
      n: plural(facts.total, L.match[0], L.match[1]),
      k: plural(facts.competitions.length, L.comp[0], L.comp[1]),
    });
    if (facts.live > 0) intro += fill(L.introLive, { n: plural(facts.live, L.match[0], L.match[1]) });
    if (facts.first && facts.last) {
      intro += fill(L.introSpan, { first: ko(facts.first.fixture.date), last: ko(facts.last.fixture.date), clock });
    } else if (facts.first) {
      intro += fill(L.introOne, { first: ko(facts.first.fixture.date), clock });
    }
  }

  const countries = listJoin(HUB_COUNTRIES.map((cc) => countryName(cc, locale)), locale);
  const faq: [string, string][] = [
    [
      L.faqWhat,
      facts.total
        ? fill(L.faqWhatA, {
            date: longDate,
            n: plural(facts.total, L.match[0], L.match[1]),
            comps: competitionsSentence(facts, locale),
          })
        : fill(L.faqWhatNone, { date: longDate }),
    ],
  ];
  if (facts.first) {
    faq.push([
      L.faqFirst,
      fill(L.faqFirstA, {
        match: matchName(facts.first, locale),
        comp: comp(facts.first.league.id),
        time: ko(facts.first.fixture.date),
        clock,
      }),
    ]);
  }
  faq.push([L.faqTz, fill(L.faqTzA, { clock, countries })]);

  const suggestLabels = Object.fromEntries(
    HUB_COUNTRIES.map((cc) => [cc, fill(L.suggest, { clock: COUNTRY_CLOCK[cc][locale] })]),
  ) as Record<HubCountry, string>;
  const tabs = [-1, 0, 1, 2, 3, 4, 5].map((n) => addDays(today, n));
  const crumbs = [{ name: L.home, path: homePath(locale) }, { name: L.h1 }];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={matchesItemList(fixtures, locale, `${L.h1} · ${longDate}`, pagePath)} />
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={pagePath} />

        <header className="mt-5">
          <p className="text-xs font-extrabold tracking-wider text-primary uppercase">{longDate}</p>
          <DisplayHeading as="h1" className="mt-2 text-3xl sm:text-5xl">
            {L.h1}
          </DisplayHeading>
          <p className="mt-3 max-w-3xl leading-relaxed font-semibold text-muted-foreground">{intro}</p>
          <HubSuggest locale={locale} labels={suggestLabels} />
          <CountryLinks locale={locale} title={L.pickCountry} className="mt-6" />
          <DayTabs locale={locale} dates={tabs} current={today} today={today} todayHref={pagePath} />
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0">
            {groups.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="font-bold">{L.empty}</p>
              </div>
            ) : (
              <Board groups={groups} locale={locale} time={time} adPrefix="today" indexable counts={countPhases(fixtures)} />
            )}

            <p className="mt-6 text-xs font-semibold text-muted-foreground">{fill(L.tzNote, { clock })}</p>
            <p className="mt-4">
              <Link href={sectionPath('live', locale)} className="text-sm font-extrabold text-primary hover:underline">
                {L.liveLink} ›
              </Link>
            </p>

            <FaqSection title={L.faqTitle} entries={faq} pagePath={pagePath} />
          </div>

          <aside className="mt-10 space-y-6 lg:mt-5">
            {featured ? <FeaturedMatch f={featured} locale={locale} time={time} split={split} /> : null}
            <AppPromo locale={locale} />
          </aside>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
