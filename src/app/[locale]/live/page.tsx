import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { homePath, sectionPath, ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LocalTimeScript } from '@/components/LocalTime';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { DisplayHeading, Eyebrow } from '@/components/revamp/ui';
import { Board } from '@/components/hubs/Board';
import { AppPromo, CountryLinks, matchesItemList } from '@/components/hubs/blocks';
import { competitionsSentence, dayFacts, plural } from '@/components/hubs/copy';
import { competitionOrder, groupByCompetition, liveFixtures, strictAtRuntime } from '@/components/hubs/data';

// "Resultados en vivo" is the other query typed every day. Fifteen-second
// revalidation keeps the served HTML close to the real score without hammering
// the shared API quota: the single `live=all` call is shared with every other
// caller through the fetch cache. Strict at runtime, so an API failure keeps
// the last good board instead of announcing "nothing live".
export const revalidate = 15;

const STR = {
  es: {
    home: 'Inicio',
    eyebrow: 'En vivo',
    h1: 'Resultados de fútbol en vivo',
    title: 'Resultados de fútbol en vivo: marcadores al minuto',
    desc: 'Marcadores en vivo de Liga MX, Brasileirão, Liga Profesional, Libertadores, MLS, Champions y las grandes ligas de Europa. Se actualiza mientras se juega.',
    intro: 'Ahora mismo se juegan {n}: {comps}.',
    empty: 'Ahora mismo no hay partidos en juego en las competiciones que seguimos.',
    emptyCta: 'Ver los partidos de hoy',
    note: 'Esta página se actualiza cada 15 segundos: recárgala para ver el último marcador. Golify no transmite partidos.',
    todayLink: 'Partidos de hoy',
    countries: 'Partidos de hoy por país',
    match: ['partido', 'partidos'],
  },
  pt: {
    home: 'Início',
    eyebrow: 'Ao vivo',
    h1: 'Placares de futebol ao vivo',
    title: 'Placar de futebol ao vivo: jogos minuto a minuto',
    desc: 'Placar ao vivo do Brasileirão, Libertadores, Sul-Americana, Campeonato Argentino, Liga MX, MLS, Champions e das grandes ligas da Europa. Atualiza enquanto a bola rola.',
    intro: 'Agora estão rolando {n}: {comps}.',
    empty: 'Nenhum jogo em andamento agora nas competições que acompanhamos.',
    emptyCta: 'Ver os jogos de hoje',
    note: 'Esta página é atualizada a cada 15 segundos: recarregue para ver o placar mais recente. O Golify não transmite jogos.',
    todayLink: 'Jogos de hoje',
    countries: 'Jogos de hoje por país',
    match: ['jogo', 'jogos'],
  },
  en: {
    home: 'Home',
    eyebrow: 'Live',
    h1: 'Live football scores',
    title: 'Live football scores: minute-by-minute results',
    desc: 'Live scores from Liga MX, MLS, Brasileirão, Copa Libertadores, the Champions League and the big European leagues. Updated while the matches are played.',
    intro: '{n} being played right now: {comps}.',
    empty: 'No matches are being played right now in the competitions we follow.',
    emptyCta: "See today's matches",
    note: 'This page refreshes every 15 seconds: reload it for the latest score. Golify does not stream matches.',
    todayLink: "Today's matches",
    countries: "Today's matches by country",
    match: ['match', 'matches'],
  },
} as const;

function resolveLocale(v: string): RouteLocale {
  if (!(ROUTE_LOCALES as readonly string[]).includes(v)) notFound();
  return v as RouteLocale;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const L = STR[locale];
  return pageMetadata({
    locale,
    path: (l) => sectionPath('live', l),
    title: L.title,
    description: L.desc,
  });
}

export default async function LivePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const L = STR[locale];
  const fixtures = await liveFixtures(competitionOrder(), strictAtRuntime());
  const groups = groupByCompetition(fixtures);
  const facts = dayFacts(groups, locale);
  const pagePath = sectionPath('live', locale);
  const crumbs = [{ name: L.home, path: homePath(locale) }, { name: L.eyebrow }];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={matchesItemList(fixtures, locale, L.h1, pagePath)} />
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={pagePath} />

        <header className="mt-5">
          <Eyebrow tone="mint">{L.eyebrow}</Eyebrow>
          <DisplayHeading as="h1" className="mt-4 text-3xl sm:text-5xl">
            {L.h1}
          </DisplayHeading>
          <p className="mt-3 max-w-3xl leading-relaxed font-semibold text-muted-foreground">
            {facts.total > 0
              ? L.intro
                  .replace('{n}', plural(facts.total, L.match[0], L.match[1]))
                  .replace('{comps}', competitionsSentence(facts, locale))
              : L.desc}
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0">
            {groups.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="font-bold">{L.empty}</p>
                <Link href={sectionPath('today', locale)} className="mt-2 inline-block text-sm font-extrabold text-primary hover:underline">
                  {L.emptyCta}
                </Link>
              </div>
            ) : (
              <Board groups={groups} locale={locale} time={{ kind: 'local' }} adPrefix="live" indexable />
            )}
            <p className="mt-6 text-xs font-semibold text-muted-foreground">{L.note}</p>
            <p className="mt-4">
              <Link href={sectionPath('today', locale)} className="text-sm font-extrabold text-primary hover:underline">
                {L.todayLink} ›
              </Link>
            </p>
          </div>

          <aside className="mt-10 space-y-6 lg:mt-5">
            <CountryLinks locale={locale} title={L.countries} className="rounded-2xl border border-border bg-surface p-5" />
            <AppPromo locale={locale} />
          </aside>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
