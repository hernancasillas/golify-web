import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { competitionBySlug, competitionName, type Competition } from '@/lib/competitions';
import {
  HUB_COUNTRIES,
  competitionPath,
  homePath,
  sectionPath,
  whereToWatchPath,
  type HubCountry,
  type RouteLocale,
} from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
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
  latestChecked,
  leagueZones,
  listJoin,
  seasonsOf,
  upcomingLeagueFixtures,
  verifiedBroadcasts,
  verifiedCountries,
  watchCountrySlug,
} from '@/components/watch/data/watch';

// "Dónde ver {liga}": the league's index of verified country guides. It is
// indexable once at least one country has a verified rights entry; until
// then it is a noindex page that still links every country page and shows
// the next kickoffs in the league's home markets.

export async function generateStaticParams() {
  return [];
}
export const revalidate = 86400;

type Params = { locale: string; league: string };

const STR = {
  es: {
    home: 'Inicio',
    section: 'Dónde ver',
    kicker: 'Guía de TV',
    h1: 'Dónde ver {league}',
    lead: 'Canales y plataformas verificados por país, con su fuente, y los horarios de los próximos partidos.',
    leadNoData: 'Horarios de los próximos partidos por país y cómo seguir {league} en vivo.',
    noData:
      'Todavía no tenemos verificado qué canal transmite {league} en ningún país. No adivinamos: cada canal se publica con su fuente oficial y la fecha en que lo revisamos.',
    verified: 'Países con dato verificado',
    checked: 'Verificado el {date}',
    noVerified: 'Horarios por país',
    noVerifiedHint: 'Sin canal verificado aún',
    upcoming: 'Próximos partidos',
    faq: 'Preguntas frecuentes',
    qWhere: '¿Dónde ver {league} {inCountry}?',
    aWhere: '{inCountryCap}, {league} se ve por {channels}. Temporada {season}, verificado el {date}.',
    honestTitle: 'Golify no transmite partidos',
    honest: 'Golify no transmite partidos. En la app sigues {league} en vivo, con marcador minuto a minuto y alerta en cada gol.',
    more: 'Más de {league}',
    competition: '{league}: tabla y calendario',
    allGuides: 'Todas las guías de TV',
    appKicker: 'App Golify',
    appTitle: 'Cada gol, al instante',
    appBody: 'Marcador en vivo y alerta de gol para {league}, con la hora de tu país.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: 'Dónde ver {league}: canales de TV por país',
    metaDesc: 'Dónde ver {league} en {countries}: canales y plataformas verificados con su fuente, y horarios de los próximos partidos.',
    metaDescNoData: 'Horarios de los próximos partidos de {league} por país y cómo seguirlos en vivo con Golify. Canales aún sin verificar.',
  },
  pt: {
    home: 'Início',
    section: 'Onde assistir',
    kicker: 'Guia de TV',
    h1: 'Onde assistir {league}',
    lead: 'Canais e plataformas verificados por país, com a fonte, e os horários dos próximos jogos.',
    leadNoData: 'Horários dos próximos jogos por país e como acompanhar {league} ao vivo.',
    noData:
      'Ainda não verificamos qual canal transmite {league} em nenhum país. Não chutamos: cada canal é publicado com a fonte oficial e a data da checagem.',
    verified: 'Países com dado verificado',
    checked: 'Verificado em {date}',
    noVerified: 'Horários por país',
    noVerifiedHint: 'Canal ainda não verificado',
    upcoming: 'Próximos jogos',
    faq: 'Perguntas frequentes',
    qWhere: 'Onde assistir {league} {inCountry}?',
    aWhere: '{inCountryCap}, {league} passa em {channels}. Temporada {season}, verificado em {date}.',
    honestTitle: 'O Golify não transmite jogos',
    honest: 'O Golify não transmite jogos. No app você acompanha {league} ao vivo, com placar lance a lance e alerta a cada gol.',
    more: 'Mais de {league}',
    competition: '{league}: tabela e jogos',
    allGuides: 'Todos os guias de TV',
    appKicker: 'App Golify',
    appTitle: 'Cada gol, na hora',
    appBody: 'Placar ao vivo e alerta de gol de {league}, no horário do seu país.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: 'Onde assistir {league}: canais de TV por país',
    metaDesc: 'Onde assistir {league} em {countries}: canais e plataformas verificados com a fonte, e horários dos próximos jogos.',
    metaDescNoData: 'Horários dos próximos jogos de {league} por país e como acompanhar ao vivo no Golify. Canais ainda não verificados.',
  },
  en: {
    home: 'Home',
    section: 'Where to watch',
    kicker: 'TV guide',
    h1: 'Where to watch {league}',
    lead: 'Verified channels and platforms by country, with their source, plus upcoming kickoff times.',
    leadNoData: 'Upcoming kickoff times by country and how to follow {league} live.',
    noData:
      'We have not verified which channel shows {league} in any country yet. We do not guess: every channel goes up with its official source and the date we checked it.',
    verified: 'Countries with verified data',
    checked: 'Checked on {date}',
    noVerified: 'Kickoff times by country',
    noVerifiedHint: 'Channel not verified yet',
    upcoming: 'Upcoming matches',
    faq: 'FAQ',
    qWhere: 'Where to watch {league} {inCountry}?',
    aWhere: '{inCountryCap}, {league} is shown on {channels}. Season {season}, checked on {date}.',
    honestTitle: 'Golify does not stream matches',
    honest: 'Golify does not stream matches. In the app you follow {league} live, with a minute-by-minute score and an alert on every goal.',
    more: 'More {league}',
    competition: '{league}: table and fixtures',
    allGuides: 'All TV guides',
    appKicker: 'Golify app',
    appTitle: 'Every goal, instantly',
    appBody: 'Live score and goal alerts for {league}, in your country’s time.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: 'Where to watch {league}: TV channels by country',
    metaDesc: 'Where to watch {league} in {countries}: verified channels and platforms with their source, plus upcoming kickoff times.',
    metaDescNoData: 'Upcoming {league} kickoff times by country and how to follow them live on Golify. Channels not verified yet.',
  },
} as const;

function resolve(p: Params): { c: Competition; locale: RouteLocale } {
  const c = competitionBySlug(p.league);
  if (!c) notFound();
  return { c, locale: asLocale(p.locale) };
}

/** Countries whose (noindex) page is still worth a link: the league's home
 *  markets plus the US, where most of our Spanish-language traffic watches. */
function fallbackCountries(c: Competition, verified: HubCountry[]): HubCountry[] {
  const want = new Set<HubCountry>([...c.countries, 'us', 'mx']);
  return HUB_COUNTRIES.filter((k) => want.has(k) && !verified.includes(k));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { c, locale } = resolve(await params);
  const t = STR[locale];
  const league = competitionName(c, locale);
  const countries = verifiedCountries(c.id);
  return pageMetadata({
    locale,
    path: (l) => whereToWatchPath(l, c.id)!,
    title: fill(t.metaTitle, { league }),
    description:
      countries.length > 0
        ? fill(t.metaDesc, { league, countries: listJoin(countries.map((k) => countryName(k, locale)), locale) })
        : fill(t.metaDescNoData, { league }),
    noindex: countries.length === 0,
  });
}

export default async function WhereToWatchLeaguePage({ params }: { params: Promise<Params> }) {
  const { c, locale } = resolve(await params);
  const t = STR[locale];
  const league = competitionName(c, locale);
  const path = whereToWatchPath(locale, c.id)!;
  const countries = verifiedCountries(c.id);
  const indexable = countries.length > 0;
  const vars = { league };

  const { fixtures } = await upcomingLeagueFixtures(c);
  const zones = leagueZones(c);

  const faq: [string, string][] = countries.slice(0, 5).map((k) => {
    const entries = verifiedBroadcasts(c.id, k);
    const where = inCountry(k, locale);
    return [
      fill(t.qWhere, { league, inCountry: where }),
      fill(t.aWhere, {
        league,
        inCountryCap: cap(where),
        channels: channelSummary(entries, locale),
        season: seasonsOf(entries).join(', '),
        date: checkedDate(latestChecked(entries) ?? '', locale),
      }),
    ];
  });

  const compHref = competitionPath(locale, c.id);
  const crumbs = [
    { name: t.home, path: homePath(locale) },
    { name: t.section, path: sectionPath('whereToWatch', locale) },
    { name: league },
  ];

  const main = (
    <>
      <section>
        <Kicker>{t.kicker}</Kicker>
        <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">
          {fill(t.h1, vars)}
        </h1>
        <p className="mt-2 max-w-2xl font-semibold text-muted-foreground">{fill(indexable ? t.lead : t.leadNoData, vars)}</p>
        {indexable ? null : (
          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-5">
            <p className="leading-relaxed font-semibold">{fill(t.noData, vars)}</p>
          </div>
        )}
      </section>

      {indexable ? (
        <section className="mt-8">
          <SectionTitle>{t.verified}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {countries.map((k) => {
              const entries = verifiedBroadcasts(c.id, k);
              const names = [...new Set(entries.flatMap((e) => e.channels.map((ch) => ch.name)))];
              return (
                <Link
                  key={k}
                  href={whereToWatchPath(locale, c.id, watchCountrySlug(k))!}
                  className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/60"
                >
                  <span className="font-display text-lg font-bold uppercase">{countryName(k, locale)}</span>
                  <span className="mt-1 block font-semibold">{listJoin(names, locale)}</span>
                  <span className="mt-2 block text-xs font-semibold text-muted-foreground">
                    {seasonsOf(entries).join(', ')} · {fill(t.checked, { date: checkedDate(latestChecked(entries) ?? '', locale) })}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {fixtures.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>{t.upcoming}</SectionTitle>
          <WatchFixtures fixtures={fixtures} zones={zones} zoneHeader={(z) => z.label[locale]} locale={locale} competition={c} />
        </section>
      ) : null}

      <AdSlot id="watch-league-after-fixtures" format="leaderboard" indexable={indexable} />

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">{t.honestTitle}</h2>
        <p className="mt-1.5 leading-relaxed font-semibold text-muted-foreground">{fill(t.honest, vars)}</p>
      </section>

      <FaqSection title={t.faq} entries={faq} pagePath={path} />
    </>
  );

  const fallback = fallbackCountries(c, countries);
  const aside = (
    <>
      <AppCard
        title={t.appTitle}
        body={fill(t.appBody, vars)}
        medium="donde_ver"
        campaign={c.slug}
        labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
      />
      {fallback.length > 0 ? (
        <section>
          <SectionTitle>{t.noVerified}</SectionTitle>
          <Card className="divide-y divide-border">
            {fallback.map((k) => (
              <Link
                key={k}
                href={whereToWatchPath(locale, c.id, watchCountrySlug(k))!}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold hover:text-primary"
              >
                <span>{countryName(k, locale)}</span>
                <span className="text-xs font-semibold text-muted-foreground">{t.noVerifiedHint}</span>
              </Link>
            ))}
          </Card>
        </section>
      ) : null}
      <LinkList
        title={fill(t.more, vars)}
        links={[
          ...(compHref ? [{ href: compHref, label: fill(t.competition, vars) }] : []),
          { href: sectionPath('whereToWatch', locale), label: t.allGuides },
        ]}
      />
    </>
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={crumbs} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}
