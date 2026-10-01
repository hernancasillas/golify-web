import type { Metadata } from 'next';
import { localizeFixtures } from '@/lib/nations';
import { notFound } from 'next/navigation';
import { countryFromWatchSlug, type BroadcastEntry } from '@/data/broadcasters';
import { competitionBySlug, competitionName, type Competition } from '@/lib/competitions';
import {
  competitionPath,
  homePath,
  hubPath,
  sectionPath,
  whereToWatchPath,
  type HubCountry,
  type RouteLocale,
} from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { shortDateIn, timeIn, type ZoneRow } from '@/lib/timezones';
import type { Fixture } from '@/lib/api-football';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AdSlot } from '@/components/ads/AdSlot';
import { AppCard, Card, Kicker, LinkList, PageShell, SectionTitle, TwoColumn } from '@/components/watch/ui';
import { WatchFixtures } from '@/components/watch/WatchFixtures';
import { asLocale, cap, fill } from '@/components/watch/i18n';
import {
  channelSummary,
  checkedDate,
  countryName,
  inCountry,
  kindLabel,
  latestChecked,
  listJoin,
  seasonsOf,
  streamingChannels,
  upcomingLeagueFixtures,
  verifiedBroadcasts,
  verifiedCombos,
  verifiedCountries,
  watchCountrySlug,
  zonesFor,
} from '@/components/watch/data/watch';

// "Dónde ver {liga} en {país}" (plan A4): indexable only with a VERIFIED
// rights entry from src/data/broadcasters.ts. Without one the page still
// answers the other half of the query — when the matches are, in that
// country's clock — and says plainly that we have not verified the channel,
// but it stays out of the index (noindex, follow) and out of the sitemap.
//
// Golify does not stream matches; every version of the page says so.

export async function generateStaticParams() {
  return [];
}
export const revalidate = 86400;

type Params = { locale: string; league: string; country: string };

const STR = {
  es: {
    home: 'Inicio',
    section: 'Dónde ver',
    kicker: 'Guía de TV',
    updated: 'Verificado el {date}',
    h1: 'Dónde ver {league} {inCountry}',
    lead: 'Canales de TV, streaming y horarios de {league} en hora {zoneWord}.',
    leadNoData: 'Horarios de {league} en hora {zoneWord} y cómo seguir cada partido en vivo.',
    quick: 'Respuesta rápida',
    answer: '{inCountryCap}, {league} se ve por {channels}. Temporada {season}; fuente: {source}, verificado el {date}.',
    noData:
      'Todavía no tenemos verificado qué canal transmite {league} {inCountry}. Preferimos no adivinar: en cuanto lo confirmemos con una fuente oficial, lo publicamos aquí.',
    channels: 'Canales y plataformas',
    season: 'Temporada',
    source: 'Fuente',
    checked: 'verificado el',
    upcoming: 'Próximos partidos',
    upcomingAside: 'Hora {zoneWord}',
    noFixtures: 'No hay partidos de {league} programados por ahora.',
    honestTitle: 'Golify no transmite partidos',
    honest:
      'Golify no transmite partidos ni tiene derechos de TV. En la app sigues {league} en vivo: marcador minuto a minuto, alineaciones y una alerta en cada gol.',
    faq: 'Preguntas frecuentes',
    qWhere: '¿Dónde ver {league} {inCountry}?',
    qStreaming: '¿Se puede ver {league} por streaming {inCountry}?',
    aStreaming: 'Sí. {inCountryCap}, {league} se puede ver por streaming en {list}, según {source} ({date}).',
    qNext: '¿A qué hora es el próximo partido de {league} {inCountry}?',
    aNext: '{home} vs {away} se juega el {date} a las {times}.',
    timeOf: 'hora {zoneWord}',
    otherCountries: '{league} en otros países',
    otherLeagues: 'Otras guías {inCountry}',
    more: 'Más de {league}',
    hub: 'Partidos de hoy {inCountry}',
    competition: '{league}: tabla y calendario',
    appKicker: 'App Golify',
    appTitle: 'Cada gol, al instante',
    appBody: 'Marcador en vivo y alerta de gol para {league}, con la hora de tu país.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: 'Dónde ver {league} {inCountry}: TV y horarios',
    metaDesc:
      'Dónde ver {league} {inCountry}: {channels}. Horarios de los próximos partidos en hora {zoneWord}. Dato verificado el {date}.',
    metaDescNoData:
      'Horarios de los próximos partidos de {league} en hora {zoneWord} y cómo seguirlos en vivo con Golify. Canal {inCountry} aún sin verificar.',
  },
  pt: {
    home: 'Início',
    section: 'Onde assistir',
    kicker: 'Guia de TV',
    updated: 'Verificado em {date}',
    h1: 'Onde assistir {league} {inCountry}',
    lead: 'Canais de TV, streaming e horários de {league} no horário {zoneWord}.',
    leadNoData: 'Horários de {league} no horário {zoneWord} e como acompanhar cada jogo ao vivo.',
    quick: 'Resposta rápida',
    answer: '{inCountryCap}, {league} passa em {channels}. Temporada {season}; fonte: {source}, verificado em {date}.',
    noData:
      'Ainda não verificamos qual canal transmite {league} {inCountry}. Preferimos não chutar: assim que confirmarmos com uma fonte oficial, publicamos aqui.',
    channels: 'Canais e plataformas',
    season: 'Temporada',
    source: 'Fonte',
    checked: 'verificado em',
    upcoming: 'Próximos jogos',
    upcomingAside: 'Horário {zoneWord}',
    noFixtures: 'Não há jogos de {league} agendados por enquanto.',
    honestTitle: 'O Golify não transmite jogos',
    honest:
      'O Golify não transmite jogos nem tem direitos de TV. No app você acompanha {league} ao vivo: placar lance a lance, escalações e um alerta a cada gol.',
    faq: 'Perguntas frequentes',
    qWhere: 'Onde assistir {league} {inCountry}?',
    qStreaming: 'Dá para assistir {league} por streaming {inCountry}?',
    aStreaming: 'Sim. {inCountryCap}, {league} tem streaming em {list}, segundo {source} ({date}).',
    qNext: 'Que horas é o próximo jogo de {league} {inCountry}?',
    aNext: '{home} x {away} é em {date}, às {times}.',
    timeOf: 'horário {zoneWord}',
    otherCountries: '{league} em outros países',
    otherLeagues: 'Outros guias {inCountry}',
    more: 'Mais de {league}',
    hub: 'Jogos de hoje {inCountry}',
    competition: '{league}: tabela e jogos',
    appKicker: 'App Golify',
    appTitle: 'Cada gol, na hora',
    appBody: 'Placar ao vivo e alerta de gol de {league}, no horário do seu país.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: 'Onde assistir {league} {inCountry}: TV e horários',
    metaDesc:
      'Onde assistir {league} {inCountry}: {channels}. Horários dos próximos jogos no horário {zoneWord}. Dado verificado em {date}.',
    metaDescNoData:
      'Horários dos próximos jogos de {league} no horário {zoneWord} e como acompanhar ao vivo no Golify. Canal {inCountry} ainda não verificado.',
  },
  en: {
    home: 'Home',
    section: 'Where to watch',
    kicker: 'TV guide',
    updated: 'Checked on {date}',
    h1: 'Where to watch {league} {inCountry}',
    lead: 'TV channels, streaming and {league} kickoff times in {zoneWord} time.',
    leadNoData: '{league} kickoff times in {zoneWord} time and how to follow every match live.',
    quick: 'Quick answer',
    answer: '{inCountryCap}, {league} is shown on {channels}. Season {season}; source: {source}, checked on {date}.',
    noData:
      "We have not verified which channel shows {league} {inCountry} yet. We would rather not guess: as soon as an official source confirms it, it goes up here.",
    channels: 'Channels and platforms',
    season: 'Season',
    source: 'Source',
    checked: 'checked on',
    upcoming: 'Upcoming matches',
    upcomingAside: '{zoneWord} time',
    noFixtures: 'No {league} matches are scheduled right now.',
    honestTitle: 'Golify does not stream matches',
    honest:
      'Golify does not stream matches or hold TV rights. In the app you follow {league} live: minute-by-minute score, lineups and an alert on every goal.',
    faq: 'FAQ',
    qWhere: 'Where to watch {league} {inCountry}?',
    qStreaming: 'Can you stream {league} {inCountry}?',
    aStreaming: 'Yes. {inCountryCap}, {league} streams on {list}, according to {source} ({date}).',
    qNext: 'What time is the next {league} match {inCountry}?',
    aNext: '{home} vs {away} is on {date} at {times}.',
    timeOf: '{zoneWord} time',
    otherCountries: '{league} in other countries',
    otherLeagues: 'Other TV guides {inCountry}',
    more: 'More {league}',
    hub: "Today's matches {inCountry}",
    competition: '{league}: table and fixtures',
    appKicker: 'Golify app',
    appTitle: 'Every goal, instantly',
    appBody: 'Live score and goal alerts for {league}, in your country’s time.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: 'Where to watch {league} {inCountry}: TV and times',
    metaDesc:
      'Where to watch {league} {inCountry}: {channels}. Upcoming kickoff times in {zoneWord} time. Checked on {date}.',
    metaDescNoData:
      'Upcoming {league} kickoff times in {zoneWord} time and how to follow them live on Golify. Channel {inCountry} not verified yet.',
  },
} as const;

/** "del Este y del Pacífico" / "de Brasília" / "Mexico". */
const ZONE_WORD: Record<HubCountry, Record<RouteLocale, string>> = {
  mx: { es: 'del centro de México', pt: 'da Cidade do México', en: 'Mexico City' },
  co: { es: 'de Colombia', pt: 'da Colômbia', en: 'Colombia' },
  ar: { es: 'de Argentina', pt: 'da Argentina', en: 'Argentina' },
  cl: { es: 'de Chile', pt: 'do Chile', en: 'Chile' },
  pe: { es: 'de Perú', pt: 'do Peru', en: 'Peru' },
  ec: { es: 'de Ecuador', pt: 'do Equador', en: 'Ecuador' },
  us: { es: 'del Este y del Pacífico', pt: 'da Costa Leste e do Pacífico', en: 'Eastern and Pacific' },
  es: { es: 'peninsular de España', pt: 'da Espanha', en: 'Spain (mainland)' },
  br: { es: 'de Brasilia', pt: 'de Brasília', en: 'Brasília' },
};

const ZONE_CODE: Record<string, string> = { 'us-et': 'ET', 'us-pt': 'PT' };

const ZONE_SHORT: Record<string, Record<RouteLocale, string>> = {
  'us-et': { es: 'Este (ET)', pt: 'Leste (ET)', en: 'Eastern (ET)' },
  'us-pt': { es: 'Pacífico (PT)', pt: 'Pacífico (PT)', en: 'Pacific (PT)' },
};

function resolve(p: Params): { c: Competition; country: HubCountry; locale: RouteLocale } {
  const locale = asLocale(p.locale);
  const c = competitionBySlug(p.league);
  const country = countryFromWatchSlug(p.country);
  if (!c || !country) notFound();
  return { c, country, locale };
}

function zoneHeader(z: ZoneRow, locale: RouteLocale, single: boolean, timeWord: string): string {
  if (ZONE_SHORT[z.key]) return ZONE_SHORT[z.key][locale];
  return single ? timeWord : z.label[locale];
}

function nextKickoffAnswer(
  f: Fixture | undefined,
  zones: ZoneRow[],
  locale: RouteLocale,
  t: (typeof STR)[RouteLocale],
  vars: Record<string, string>,
): [string, string] | null {
  if (!f || zones.length === 0) return null;
  if (['TBD', 'PST', 'CANC', 'ABD', 'SUSP'].includes(f.fixture.status.short)) return null;
  // "21:00 ET y 18:00 PT" for the two US coasts, "20:00 (hora del centro de
  // México)" elsewhere.
  const times =
    zones.length > 1
      ? listJoin(
          zones.map((z) => `${timeIn(f.fixture.date, z.zone, locale)} ${ZONE_CODE[z.key] ?? z.label[locale]}`),
          locale,
        )
      : `${timeIn(f.fixture.date, zones[0].zone, locale)} (${fill(t.timeOf, vars)})`;
  return [
    fill(t.qNext, vars),
    fill(t.aNext, {
      ...vars,
      home: f.teams.home.name,
      away: f.teams.away.name,
      date: shortDateIn(f.fixture.date, zones[0].zone, locale),
      times,
    }),
  ];
}

function answerText(entries: BroadcastEntry[], locale: RouteLocale, t: (typeof STR)[RouteLocale], vars: Record<string, string>): string {
  const sources = listJoin([...new Set(entries.map((e) => e.source.title))], locale);
  return fill(t.answer, {
    ...vars,
    channels: channelSummary(entries, locale),
    season: seasonsOf(entries).join(', '),
    source: sources,
    date: checkedDate(latestChecked(entries) ?? '', locale),
  });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { c, country, locale } = resolve(await params);
  const t = STR[locale];
  const entries = verifiedBroadcasts(c.id, country);
  const league = competitionName(c, locale);
  const vars = { league, inCountry: inCountry(country, locale), zoneWord: ZONE_WORD[country][locale] };
  const slug = watchCountrySlug(country);
  return pageMetadata({
    locale,
    path: (l) => whereToWatchPath(l, c.id, slug)!,
    title: fill(t.metaTitle, vars),
    description:
      entries.length > 0
        ? fill(t.metaDesc, {
            ...vars,
            channels: listJoin([...new Set(entries.flatMap((e) => e.channels.map((ch) => ch.name)))], locale),
            date: checkedDate(latestChecked(entries) ?? '', locale),
          })
        : fill(t.metaDescNoData, vars),
    noindex: entries.length === 0,
  });
}

export default async function WhereToWatchCountryPage({ params }: { params: Promise<Params> }) {
  const { c, country, locale } = resolve(await params);
  const t = STR[locale];
  const entries = verifiedBroadcasts(c.id, country);
  const indexable = entries.length > 0;
  const league = competitionName(c, locale);
  const countrySlug = watchCountrySlug(country);
  const path = whereToWatchPath(locale, c.id, countrySlug)!;
  const vars = {
    league,
    inCountry: inCountry(country, locale),
    inCountryCap: cap(inCountry(country, locale)),
    zoneWord: ZONE_WORD[country][locale],
  };

  // Strict: a failed lookup throws (Next keeps the last good copy) instead of
  // publishing "no matches scheduled" when the API was simply down.
  const fixtures = localizeFixtures((await upcomingLeagueFixtures(c)).fixtures, locale);
  const zones = zonesFor(country);
  const timeWord = locale === 'en' ? 'Time' : locale === 'pt' ? 'Horário' : 'Hora';

  const answer = indexable ? answerText(entries, locale, t, vars) : null;
  const streaming = streamingChannels(entries);
  const checked = latestChecked(entries);

  const faq: [string, string][] = [];
  if (answer) faq.push([fill(t.qWhere, vars), answer]);
  if (indexable && streaming.length > 0) {
    const src = entries.find((e) => e.channels.some((ch) => ch.kind !== 'tv')) ?? entries[0];
    faq.push([
      fill(t.qStreaming, vars),
      fill(t.aStreaming, {
        ...vars,
        list: listJoin(streaming, locale),
        source: src.source.title,
        date: checkedDate(src.checked, locale),
      }),
    ]);
  }
  const next = nextKickoffAnswer(fixtures[0], zones, locale, t, vars);
  if (next) faq.push(next);

  const otherCountries = verifiedCountries(c.id)
    .filter((k) => k !== country)
    .map((k) => ({ href: whereToWatchPath(locale, c.id, watchCountrySlug(k))!, label: countryName(k, locale) }));
  const otherLeagues = verifiedCombos()
    .filter((x) => x.country === country && x.league.id !== c.id)
    .slice(0, 8)
    .map((x) => ({ href: whereToWatchPath(locale, x.league.id, countrySlug)!, label: competitionName(x.league, locale) }));
  const compHref = competitionPath(locale, c.id);
  const moreLinks = [
    ...(compHref ? [{ href: compHref, label: fill(t.competition, vars) }] : []),
    { href: hubPath(locale, country), label: fill(t.hub, vars) },
  ];

  const crumbs = [
    { name: t.home, path: homePath(locale) },
    { name: t.section, path: sectionPath('whereToWatch', locale) },
    { name: league, path: whereToWatchPath(locale, c.id)! },
    { name: countryName(country, locale) },
  ];

  const main = (
    <>
      <section>
        <Kicker>
          {t.kicker}
          {checked ? ` · ${fill(t.updated, { date: checkedDate(checked, locale) })}` : ''}
        </Kicker>
        <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">
          {fill(t.h1, vars)}
        </h1>
        <p className="mt-2 max-w-2xl font-semibold text-muted-foreground">
          {fill(indexable ? t.lead : t.leadNoData, vars)}
        </p>
        <div className="mt-5 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <p className="text-xs font-extrabold tracking-wide text-primary uppercase">{t.quick}</p>
          <p className="mt-1.5 leading-relaxed font-semibold">{answer ?? fill(t.noData, vars)}</p>
        </div>
      </section>

      {indexable ? (
        <section className="mt-8">
          <SectionTitle>{t.channels}</SectionTitle>
          <div className="space-y-3">
            {entries.map((e, i) => (
              <Card key={`${e.source.url}-${i}`} className="p-4">
                <ul className="divide-y divide-border">
                  {e.channels.map((ch) => (
                    <li key={ch.name} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2 first:pt-0 last:pb-0">
                      <span className="font-bold">{ch.name}</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {cap(kindLabel(ch.kind, locale))}
                        {ch.note ? ` · ${ch.note}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">
                  {t.season}: {e.season} · {t.source}:{' '}
                  <a href={e.source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    {e.source.title}
                  </a>{' '}
                  · {t.checked} {checkedDate(e.checked, locale)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionTitle aside={fill(t.upcomingAside, vars)}>{t.upcoming}</SectionTitle>
        {fixtures.length > 0 ? (
          <WatchFixtures
            fixtures={fixtures}
            zones={zones}
            zoneHeader={(z) => zoneHeader(z, locale, zones.length === 1, timeWord)}
            locale={locale}
            competition={c}
          />
        ) : (
          <p className="font-semibold text-muted-foreground">{fill(t.noFixtures, vars)}</p>
        )}
      </section>

      <AdSlot id="watch-after-fixtures" format="leaderboard" indexable={indexable} />

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">{t.honestTitle}</h2>
        <p className="mt-1.5 leading-relaxed font-semibold text-muted-foreground">{fill(t.honest, vars)}</p>
      </section>

      <FaqSection title={t.faq} entries={faq} pagePath={path} />
    </>
  );

  const aside = (
    <>
      <AppCard
        title={t.appTitle}
        body={fill(t.appBody, vars)}
        medium="donde_ver"
        campaign={`${c.slug}-${countrySlug}`}
        labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
      />
      <LinkList title={fill(t.otherCountries, vars)} links={otherCountries} />
      <LinkList title={fill(t.otherLeagues, vars)} links={otherLeagues} />
      <LinkList title={fill(t.more, vars)} links={moreLinks} />
    </>
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={crumbs} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}
