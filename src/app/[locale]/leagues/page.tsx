import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentRound, getLeagueInfoCached } from '@/lib/api-football';
import {
  COMPETITIONS,
  competitionName,
  parseRound,
  seasonLabel,
  seasonSlug,
  type Competition,
  type Market,
  type SeasonRef,
} from '@/lib/competitions';
import { competitionPath, homePath, sectionPath, type RouteLocale } from '@/lib/routes';
import { absolute, pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { currentApiSeason } from '@/components/competition/data';
import { asLocale, fmt, ui } from '@/components/competition/i18n';
import { kindLabel } from '@/components/competition/page-helpers';
import { AppPromo, LeagueLogo, PageShell } from '@/components/competition/ui';

// Leagues index: /es/ligas, /pt/ligas, /en/leagues — the "Ligas" nav target.
//
// Every competition the site publishes, grouped by market, each linking to
// its hub and to the season being played. The registry is static; the only
// provider data is "which season is current", read from the same cached
// league row the hubs use (one-day TTL) plus, for the three split leagues,
// the current round to know whether it is the Apertura or the Clausura.
// That is ~24 cached calls on a cold cache and none after. A failed lookup
// only drops that competition's season link: the hub link always works.
export const revalidate = 3600;

type Params = { locale: string };

const STR = {
  es: {
    title: 'Ligas y torneos de fútbol: tablas y calendarios',
    h1: 'Ligas y torneos',
    desc: 'Las {n} ligas y copas que sigue Golify ({list} y más): tabla de posiciones, calendario, goleadores y formato de cada temporada.',
    intro: 'Elige tu liga o torneo para ver la tabla, los partidos de la jornada con horario de tu país, los goleadores y cómo se juega.',
    current: 'Temporada actual',
    markets: {
      mx: 'México',
      br: 'Brasil',
      ar: 'Argentina',
      co: 'Colombia',
      ec: 'Ecuador',
      cl: 'Chile',
      pe: 'Perú',
      us: 'Estados Unidos',
      sudamerica: 'Sudamérica',
      europa: 'Europa',
      mundo: 'Concacaf y otras ligas',
    },
    listName: 'Competiciones en Golify',
  },
  pt: {
    title: 'Ligas e campeonatos de futebol: tabelas e jogos',
    h1: 'Ligas e campeonatos',
    desc: 'As {n} ligas e copas que o Golify acompanha ({list} e mais): tabela, calendário, artilharia e formato de cada temporada.',
    intro: 'Escolha sua liga ou campeonato para ver a tabela, os jogos da rodada no horário do seu país, os artilheiros e como funciona.',
    current: 'Temporada atual',
    markets: {
      mx: 'México',
      br: 'Brasil',
      ar: 'Argentina',
      co: 'Colômbia',
      ec: 'Equador',
      cl: 'Chile',
      pe: 'Peru',
      us: 'Estados Unidos',
      sudamerica: 'América do Sul',
      europa: 'Europa',
      mundo: 'Concacaf e outras ligas',
    },
    listName: 'Competições no Golify',
  },
  en: {
    title: 'Football leagues and cups: tables and fixtures',
    h1: 'Leagues and cups',
    desc: 'The {n} leagues and cups Golify follows ({list} and more): standings, fixtures, top scorers and the format of every season.',
    intro: 'Pick a league or cup to see the table, the matchday fixtures in your local time, the top scorers and how it works.',
    current: 'Current season',
    markets: {
      mx: 'Mexico',
      br: 'Brazil',
      ar: 'Argentina',
      co: 'Colombia',
      ec: 'Ecuador',
      cl: 'Chile',
      pe: 'Peru',
      us: 'United States',
      sudamerica: 'South America',
      europa: 'Europe',
      mundo: 'Concacaf and other leagues',
    },
    listName: 'Competitions on Golify',
  },
} as const;

function checkLocale(raw: string): RouteLocale {
  const locale = asLocale(raw);
  if (locale !== raw) notFound();
  return locale;
}

/** The season being played, or null when the provider could not say. */
async function currentRef(comp: Competition): Promise<SeasonRef | null> {
  const info = await getLeagueInfoCached(comp.id);
  const meta = info ? currentApiSeason(info) : null;
  if (!meta) return null;
  if (comp.format !== 'split') return { apiSeason: meta.year, phase: null };
  const round = await getCurrentRound(comp.id, meta.year);
  const phase = round ? parseRound(round).phase : null;
  return phase ? { apiSeason: meta.year, phase } : null;
}

function groups(): { market: Market; comps: Competition[] }[] {
  const out: { market: Market; comps: Competition[] }[] = [];
  for (const c of COMPETITIONS) {
    const g = out.find((x) => x.market === c.market);
    if (g) g.comps.push(c);
    else out.push({ market: c.market, comps: [c] });
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale = checkLocale((await params).locale);
  const S = STR[locale];
  const list = COMPETITIONS.slice(0, 4)
    .map((c) => competitionName(c, locale))
    .join(', ');
  return pageMetadata({
    locale,
    path: (l) => sectionPath('leagues', l),
    title: S.title,
    description: fmt(S.desc, { n: COMPETITIONS.length, list }),
  });
}

export default async function LeaguesIndex({ params }: { params: Promise<Params> }) {
  const locale = checkLocale((await params).locale);
  const S = STR[locale];
  const t = ui(locale);
  const path = sectionPath('leagues', locale);
  const refs = await Promise.all(COMPETITIONS.map((c) => currentRef(c)));
  const refById = new Map(COMPETITIONS.map((c, i) => [c.id, refs[i]]));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absolute(path)}#competitions`,
    name: S.listName,
    numberOfItems: COMPETITIONS.length,
    itemListElement: COMPETITIONS.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: competitionName(c, locale),
      url: absolute(competitionPath(locale, c.id)!),
    })),
  };

  return (
    <PageShell locale={locale}>
      <JsonLd data={itemList} />
      <Breadcrumbs crumbs={[{ name: t.home, path: homePath(locale) }, { name: t.leagues, path }]} currentPath={path} />
      <header className="mt-5">
        <h1 className="font-display text-3xl leading-tight font-bold tracking-wide text-foreground uppercase sm:text-4xl">{S.h1}</h1>
        <p className="mt-2 max-w-2xl leading-relaxed font-semibold text-muted-foreground">{S.intro}</p>
      </header>

      {groups().map((g) => (
        <section key={g.market} className="mt-10">
          <h2 className="font-display text-xl font-bold tracking-wide text-foreground uppercase">{S.markets[g.market]}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.comps.map((c) => {
              const ref = refById.get(c.id) ?? null;
              const name = competitionName(c, locale);
              const seasonHref = ref ? competitionPath(locale, c.id, seasonSlug(c, ref)) : null;
              return (
                <li key={c.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                  <LeagueLogo id={c.id} size={44} />
                  <div className="min-w-0 flex-1">
                    <Link href={competitionPath(locale, c.id)!} className="block truncate font-bold text-foreground hover:text-primary">
                      {name}
                    </Link>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {kindLabel(c, locale)}
                      {ref && seasonHref ? (
                        <>
                          {' · '}
                          <Link href={seasonHref} className="font-bold text-primary hover:underline">
                            <span className="sr-only">{S.current}: </span>
                            {seasonLabel(c, ref, locale)}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="mt-12 max-w-xl">
        <AppPromo locale={locale} comp={COMPETITIONS[0]} campaign="leagues-index" />
      </div>
    </PageShell>
  );
}
