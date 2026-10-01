import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { competitionName, seasonLabel, seasonSlug } from '@/lib/competitions';
import { competitionPath, poolPath, sectionPath, transfersPath, whereToWatchPath } from '@/lib/routes';
import { pageMetadata, absolute } from '@/lib/seo';
import { factsFor } from '@/data/competition-facts';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { AdSlot } from '@/components/ads/AdSlot';
import {
  currentRound,
  cleanGroupName,
  loadCurrentSeason,
  loadLeague,
  referenceZone,
  recentSeasons,
  resolveCompetitionParam,
  roundName,
  seasonName,
  seasonStandings,
  seasonTopList,
  type SeasonCtx,
} from '@/components/competition/data';
import { asLocale, fmt, groupLabel, joinList, ui } from '@/components/competition/i18n';
import { countryLabel, hiddenTabs, hubCrumbs, kindLabel } from '@/components/competition/page-helpers';
import { groupLeadersSentence, leaderSentence, streakSentences } from '@/components/competition/rules';
import {
  AnswerBlock,
  AppPromo,
  Card,
  CompetitionHeader,
  FixtureCard,
  FixtureLine,
  LinkList,
  PageShell,
  SeasonTabs,
  SectionTitle,
  Standings,
  TopFive,
  TwoColumn,
} from '@/components/competition/ui';

// Competition hub: /es/liga-mx, /pt/brasileirao, /en/premier-league.
//
// The evergreen page for a competition — what it is, how it is played, who
// won it — plus a snapshot of the season being played right now (leader,
// the round in progress with kickoff times, top scorers) that links down
// into the season pages. The legacy /es/league/262 reaches this file too and
// leaves with one permanent redirect.
//
// ISR: rendered on first request, then cached. A failed provider call throws
// so Next keeps serving the last good copy instead of caching an empty page.
export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

const STR = {
  es: {
    title: '{name}: tabla, resultados y próximos partidos',
    desc: '{name} {season}: {lead}{parts}. Todo en Golify.',
    descNoSeason: '{name} en Golify: {parts}.',
    parts: { table: 'tabla de posiciones', round: '{round} con horarios', scorers: 'goleadores', format: 'el formato explicado', champions: 'campeones', seasons: 'temporadas anteriores' },
    leadDesc: '{team} es líder; ',
    currentSeason: 'Temporada actual',
    snapshot: '{season}: así va',
    fullTable: 'Tabla completa',
    round: '{round}',
    allFixtures: 'Calendario completo',
    roundPage: 'Partidos y quiniela de la {round}',
    howItWorks: '¿Cómo se juega {name}?',
    format: 'Formato',
    champions: 'Campeones',
    championsSeason: 'Temporada',
    champion: 'Campeón',
    runnerUp: 'Subcampeón',
    seasons: 'Temporadas',
    more: 'Más de {name}',
    watch: 'Dónde ver {name}',
    watchHint: 'Canales y plataformas por país',
    transfers: 'Fichajes de {name}',
    transfersHint: 'Altas y bajas de la temporada',
    pool: 'Quiniela de {name}',
    poolHint: 'Pronostica la jornada con tus amigos',
    downloads: 'Descargas',
    downloadsHint: 'Quinielas y calendarios para imprimir',
    scorers: 'Goleadores',
    scorersMixed: 'Temporada {year} completa (Apertura y Clausura juntos).',
    sources: 'Fuentes',
  },
  pt: {
    title: '{name}: tabela, resultados e próximos jogos',
    desc: '{name} {season}: {lead}{parts}. Tudo no Golify.',
    descNoSeason: '{name} no Golify: {parts}.',
    parts: { table: 'tabela de classificação', round: '{round} com horários', scorers: 'artilharia', format: 'o formato explicado', champions: 'campeões', seasons: 'temporadas anteriores' },
    leadDesc: '{team} lidera; ',
    currentSeason: 'Temporada atual',
    snapshot: '{season}: como está',
    fullTable: 'Tabela completa',
    round: '{round}',
    allFixtures: 'Calendário completo',
    roundPage: 'Jogos e bolão da {round}',
    howItWorks: 'Como funciona o {name}?',
    format: 'Formato',
    champions: 'Campeões',
    championsSeason: 'Temporada',
    champion: 'Campeão',
    runnerUp: 'Vice',
    seasons: 'Temporadas',
    more: 'Mais do {name}',
    watch: 'Onde assistir {name}',
    watchHint: 'Canais e plataformas por país',
    transfers: 'Transferências do {name}',
    transfersHint: 'Chegadas e saídas da temporada',
    pool: 'Bolão do {name}',
    poolHint: 'Dê seu palpite na rodada com os amigos',
    downloads: 'Downloads',
    downloadsHint: 'Bolões e calendários para imprimir',
    scorers: 'Artilheiros',
    scorersMixed: 'Temporada {year} completa (Apertura e Clausura somados).',
    sources: 'Fontes',
  },
  en: {
    title: '{name}: table, results and upcoming fixtures',
    desc: '{name} {season}: {lead}{parts}. All on Golify.',
    descNoSeason: '{name} on Golify: {parts}.',
    parts: { table: 'standings', round: '{round} with kickoff times', scorers: 'top scorers', format: 'the format explained', champions: 'past champions', seasons: 'past seasons' },
    leadDesc: '{team} top the table; ',
    currentSeason: 'Current season',
    snapshot: '{season} so far',
    fullTable: 'Full table',
    round: '{round}',
    allFixtures: 'All fixtures',
    roundPage: '{round} fixtures and pool',
    howItWorks: 'How does {name} work?',
    format: 'Format',
    champions: 'Champions',
    championsSeason: 'Season',
    champion: 'Champion',
    runnerUp: 'Runner-up',
    seasons: 'Seasons',
    more: 'More {name}',
    watch: 'Where to watch {name}',
    watchHint: 'Channels and platforms by country',
    transfers: '{name} transfers',
    transfersHint: 'Ins and outs this season',
    pool: '{name} pool',
    poolHint: 'Call the matchday with your friends',
    downloads: 'Downloads',
    downloadsHint: 'Printable pools and calendars',
    scorers: 'Top scorers',
    scorersMixed: 'Whole {year} season (Apertura and Clausura combined).',
    sources: 'Sources',
  },
} as const;

async function load(params: Params) {
  const locale = asLocale(params.locale);
  if (locale !== params.locale) notFound();
  const res = resolveCompetitionParam(params.slug);
  if (res.kind === 'none') notFound();
  if (res.kind === 'legacy') permanentRedirect(competitionPath(locale, res.comp.id)!);
  const comp = res.comp;
  const info = await loadLeague(comp.id);
  if (!info) notFound();
  const ctx = await loadCurrentSeason(comp, info);
  return { locale, comp, info, ctx };
}

async function snapshot(ctx: SeasonCtx) {
  const [standings, scorers] = await Promise.all([
    seasonStandings(ctx, true),
    seasonTopList(ctx, 'scorers', false),
  ]);
  return { standings, scorers };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const res = resolveCompetitionParam(p.slug);
  if (res.kind !== 'ok') return {};
  const { locale, comp, ctx } = await load(p);
  const S = STR[locale];
  const name = competitionName(comp, locale);
  // Only promise what the page actually shows: a cup without standings
  // does not get "tabla", a competition without researched facts does not
  // get "formato explicado".
  const facts = factsFor(comp.id);
  const P = S.parts;
  const extras: string[] = [];
  if (facts?.formatSummary[locale]) extras.push(P.format);
  if (facts && facts.champions.length > 0) extras.push(P.champions);
  let description: string = fmt(S.descNoSeason, { name, parts: joinList([...extras, P.seasons], locale) });
  if (ctx) {
    const { standings, scorers } = await snapshot(ctx);
    const rows = standings.groups.length === 1 ? standings.groups[0].rows : null;
    const cr = currentRound(ctx.rounds);
    const parts: string[] = [];
    if (standings.groups.length > 0) parts.push(P.table);
    if (cr) parts.push(fmt(P.round, { round: roundName(cr, locale, comp) }));
    if (scorers.rows.length > 0) parts.push(P.scorers);
    parts.push(...extras);
    description = fmt(S.desc, {
      name,
      season: seasonName(ctx, locale),
      lead: rows?.[0] && rows[0].all.played > 0 ? fmt(S.leadDesc, { team: rows[0].team.name }) : '',
      parts: joinList(parts.length > 0 ? parts : [P.seasons], locale),
    });
  }
  return pageMetadata({
    locale,
    path: (l) => competitionPath(l, comp.id)!,
    title: fmt(S.title, { name }),
    description,
    appRoute: `league/${comp.id}`,
  });
}

export default async function CompetitionHub({ params }: { params: Promise<Params> }) {
  const { locale, comp, info, ctx } = await load(await params);
  const S = STR[locale];
  const t = ui(locale);
  const name = competitionName(comp, locale);
  const facts = factsFor(comp.id);
  const path = competitionPath(locale, comp.id)!;
  const snap = ctx ? await snapshot(ctx) : null;
  const zone = referenceZone(comp, locale);
  const seasonText = ctx ? seasonName(ctx, locale) : null;
  const cr = ctx ? currentRound(ctx.rounds) : null;
  const groups = snap?.standings.groups ?? [];
  const single = groups.length === 1 ? groups[0].rows : null;
  const finished = !!ctx && ctx.fixtures.length > 0 && ctx.fixtures.every((f) => ['FT', 'AET', 'PEN', 'CANC', 'AWD', 'WO', 'ABD'].includes(f.fixture.status.short));
  const sentences: string[] = [];
  if (single && seasonText) {
    const s = leaderSentence(single, locale, `${name} ${seasonText}`, finished);
    if (s) sentences.push(s);
    sentences.push(...streakSentences(single, locale));
  } else if (groups.length > 1) {
    const s = groupLeadersSentence(
      groups.map((g) => ({ name: groupLabel(cleanGroupName(g.name, comp, info), locale), rows: g.rows })),
      locale,
    );
    if (s) sentences.push(s);
  }
  const summary = facts?.formatSummary[locale];
  const points = facts?.formatPoints[locale];
  const indexable = true;

  const seasonsLinks = ctx
    ? recentSeasons(ctx).map((ref) => ({
        href: competitionPath(locale, comp.id, seasonSlug(comp, ref))!,
        label: `${name} ${seasonLabel(comp, ref, locale)}`,
        hint: ref.apiSeason === ctx.ref.apiSeason && ref.phase === ctx.ref.phase ? S.currentSeason : undefined,
      }))
    : [];

  const more: ({ href: string | null; label: string; hint: string } | null)[] = [
    { href: whereToWatchPath(locale, comp.id), label: fmt(S.watch, { name }), hint: S.watchHint },
    { href: transfersPath(locale, comp.id), label: fmt(S.transfers, { name }), hint: S.transfersHint },
    ctx?.isCurrent ? { href: poolPath(locale, comp.id), label: fmt(S.pool, { name }), hint: S.poolHint } : null,
    { href: sectionPath('downloads', locale), label: S.downloads, hint: S.downloadsHint },
  ];
  const moreLinks = more.filter((l): l is { href: string; label: string; hint: string } => !!l && !!l.href);

  const roundNumber = ctx?.isCurrent && cr?.number != null ? cr.number : null;
  const scorersMixed = snap?.scorers.mixed ?? false;

  const orgNode = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    '@id': `${absolute(path)}#competition`,
    name,
    alternateName: info.league.name !== name ? info.league.name : undefined,
    sport: 'Soccer',
    logo: info.league.logo,
    url: absolute(path),
    location: info.country.name !== 'World' ? { '@type': 'Country', name: info.country.name } : undefined,
  };

  return (
    <PageShell locale={locale}>
      <JsonLd data={orgNode} />
      <Breadcrumbs crumbs={hubCrumbs(comp, locale)} currentPath={path} />
      <CompetitionHeader
        comp={comp}
        eyebrow={`${countryLabel({ info }, locale)} · ${kindLabel(comp, locale)}`}
        title={name}
        sub={
          ctx && seasonText ? (
            <>
              {S.currentSeason}:{' '}
              <Link href={competitionPath(locale, comp.id, ctx.slug)!} className="font-bold text-primary hover:underline">
                {seasonText}
              </Link>
            </>
          ) : null
        }
      />

      {summary ? <AnswerBlock title={fmt(S.howItWorks, { name })}>{summary}</AnswerBlock> : null}

      {ctx ? <SeasonTabs locale={locale} comp={comp} seasonSlug={ctx.slug} active={null} hide={hiddenTabs(ctx)} /> : null}

      <TwoColumn
        main={
          <>
            {ctx && seasonText && (groups.length > 0 || sentences.length > 0) ? (
              <section>
                <SectionTitle
                  action={
                    groups.length > 0 ? (
                      <Link href={competitionPath(locale, comp.id, ctx.slug, 'table')!} className="text-sm font-bold text-primary hover:underline">
                        {S.fullTable}
                      </Link>
                    ) : undefined
                  }
                >
                  {fmt(S.snapshot, { season: `${name} ${seasonText}` })}
                </SectionTitle>
                {sentences.length > 0 ? (
                  <p className="mt-2 leading-relaxed font-semibold text-muted-foreground">{sentences.join(' ')}</p>
                ) : null}
                {single ? (
                  <div className="mt-4">
                    <Standings groups={groups} groupNames={['']} locale={locale} full={false} limit={6} />
                    {snap?.standings.computed ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.computed}</p> : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            <AdSlot id="competition-hub-1" format="in-article" indexable={indexable} label={t.ad} />

            {ctx && cr ? (
              <section className="mt-8">
                <SectionTitle
                  action={
                    <Link href={competitionPath(locale, comp.id, ctx.slug, 'fixtures')!} className="text-sm font-bold text-primary hover:underline">
                      {S.allFixtures}
                    </Link>
                  }
                >
                  {roundName(cr, locale, comp)}
                </SectionTitle>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{fmt(t.timesIn, { zone: zone.label[locale] })}</p>
                <div className="mt-3">
                  <FixtureCard>
                    {cr.fixtures.map((f) => (
                      <FixtureLine key={f.fixture.id} f={f} locale={locale} zone={zone} />
                    ))}
                  </FixtureCard>
                </div>
                {cr.number != null ? (
                  <p className="mt-3">
                    <Link
                      href={competitionPath(locale, comp.id, ctx.slug, { round: cr.number })!}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      {fmt(S.roundPage, { round: roundName(cr, locale, comp) })} ›
                    </Link>
                  </p>
                ) : null}
              </section>
            ) : null}

            {points && points.length > 0 ? (
              <section className="mt-10">
                <SectionTitle>{S.format}</SectionTitle>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed font-semibold text-muted-foreground">
                  {points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {facts && facts.champions.length > 0 ? (
              <section className="mt-10">
                <SectionTitle>{S.champions}</SectionTitle>
                <Card className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[20rem] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
                        <th className="px-4 py-2.5">{S.championsSeason}</th>
                        <th className="px-4 py-2.5">{S.champion}</th>
                        <th className="px-4 py-2.5">{S.runnerUp}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facts.champions.map((c) => (
                        <tr key={c.season} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-2.5 font-semibold text-muted-foreground">{c.season}</td>
                          <td className="px-4 py-2.5 font-bold">{c.champion}</td>
                          <td className="px-4 py-2.5 font-semibold">{c.runnerUp ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                {facts.sources.length > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    {S.sources}:{' '}
                    {facts.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 ? ' · ' : ''}
                        <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline hover:text-foreground">
                          {s.title}
                        </a>
                      </span>
                    ))}
                  </p>
                ) : null}
              </section>
            ) : null}

            <AdSlot id="competition-hub-2" format="in-article" indexable={indexable} label={t.ad} />

            <p className="mt-8 text-sm font-semibold text-muted-foreground">{t.notStreaming}</p>
          </>
        }
        side={
          <>
            {snap && !scorersMixed ? (
              <TopFive
                title={S.scorers}
                rows={snap.scorers.rows}
                kind="scorers"
                locale={locale}
                leagueId={comp.id}
                href={ctx ? competitionPath(locale, comp.id, ctx.slug, 'scorers') : null}
              />
            ) : null}
            {snap && scorersMixed ? (
              <TopFive
                title={S.scorers}
                rows={snap.scorers.rows}
                kind="scorers"
                locale={locale}
                leagueId={comp.id}
                note={fmt(S.scorersMixed, { year: ctx!.ref.apiSeason })}
              />
            ) : null}
            <AppPromo
              locale={locale}
              comp={comp}
              round={roundNumber}
              roundText={cr && roundNumber ? roundName(cr, locale, comp) : undefined}
              campaign="competition-hub"
            />
            <LinkList title={S.seasons} links={seasonsLinks} />
            <LinkList title={fmt(S.more, { name })} links={moreLinks} />
          </>
        }
      />
    </PageShell>
  );
}
