import type { Metadata } from 'next';
import Link from 'next/link';
import { competitionName, parseRound } from '@/lib/competitions';
import { competitionPath, teamPath } from '@/lib/routes';
import { absolute, pageMetadata } from '@/lib/seo';
import { longDateIn } from '@/lib/timezones';
import { factsFor } from '@/data/competition-facts';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AdSlot } from '@/components/ads/AdSlot';
import {
  cleanGroupName,
  currentRound,
  isDone,
  referenceZone,
  roundName,
  seasonName,
  seasonStandings,
  seasonTopList,
  timeUnknown,
  type SeasonCtx,
} from '@/components/competition/data';
import { fmt, groupLabel, joinList, ui } from '@/components/competition/i18n';
import { countryLabel, hiddenTabs, seasonCrumbs } from '@/components/competition/page-helpers';
import {
  attackDefenceSentence,
  groupLeadersSentence,
  homeSentence,
  leaderSentence,
  streakSentences,
  topSentence,
  zonesSentence,
} from '@/components/competition/rules';
import { loadSeasonParams } from '@/components/competition/season-load';
import { MoreLinks, RoundNav, seasonEventNode, teamsOf } from '@/components/competition/blocks';
import {
  AnswerBlock,
  AppPromo,
  CompetitionHeader,
  FixtureCard,
  FixtureLine,
  PageShell,
  SeasonTabs,
  SectionTitle,
  Standings,
  TopFive,
  TwoColumn,
} from '@/components/competition/ui';

// Season page: /es/liga-mx/apertura-2026, /pt/brasileirao/2026,
// /en/premier-league/2026-2027.
//
// The "tabla liga mx apertura 2026" intent: full standings with the
// provider's own qualification zones, the round in play, the top-5 lists,
// the round navigation and the format. Past seasons read the same fetchers
// with a one-day TTL (data.ts seasonTtl), so their regenerations are free.
export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string; season: string };

const STR = {
  es: {
    title: '{name} {season}: tabla, jornadas y goleadores',
    titleCup: '{name} {season}: partidos, fases y goleadores',
    desc: '{name} {season}: {lead}{parts}.',
    parts: { table: 'tabla de posiciones con zonas de clasificación', round: '{round} con horarios', calendar: 'calendario completo', scorers: 'goleadores', assists: 'asistencias', cards: 'tarjetas' },
    leadDesc: '{team} va primero; ',
    leadDescDone: '{team} terminó primero; ',
    progress: '{round} de {total}',
    howItWorks: 'Cómo se juega {name} {season}',
    standings: 'Tabla de posiciones',
    roundNow: '{round}',
    roundLink: 'Horarios, pronósticos y quiniela de la {round}',
    format: 'Formato',
    scorers: 'Goleadores',
    assists: 'Asistencias',
    cards: 'Tarjetas amarillas',
    mixed: 'Temporada {year} completa: el proveedor suma Apertura y Clausura.',
    faq: 'Preguntas frecuentes',
    qLeader: '¿Quién es el líder de {name} {season}?',
    qLeaderDone: '¿Quién terminó primero en {name} {season}?',
    qScorer: '¿Quién es el goleador de {name} {season}?',
    qZones: '¿Qué puestos clasifican en {name} {season}?',
    qEnd: '¿Cuándo termina la fase regular de {name} {season}?',
    aEnd: 'La {round}, la última de la fase regular, está programada para el {date}, hora de {zone}.',
    qTeams: '¿Cuántos equipos juegan {name} {season}?',
    aTeams: 'Juegan {n} equipos.',
  },
  pt: {
    title: '{name} {season}: tabela, rodadas e artilharia',
    titleCup: '{name} {season}: jogos, fases e artilharia',
    desc: '{name} {season}: {lead}{parts}.',
    parts: { table: 'tabela de classificação com as zonas', round: '{round} com horários', calendar: 'calendário completo', scorers: 'artilheiros', assists: 'assistências', cards: 'cartões' },
    leadDesc: '{team} lidera; ',
    leadDescDone: '{team} terminou em primeiro; ',
    progress: '{round} de {total}',
    howItWorks: 'Como funciona o {name} {season}',
    standings: 'Tabela de classificação',
    roundNow: '{round}',
    roundLink: 'Horários, palpites e bolão da {round}',
    format: 'Formato',
    scorers: 'Artilheiros',
    assists: 'Assistências',
    cards: 'Cartões amarelos',
    mixed: 'Temporada {year} completa: o provedor soma Apertura e Clausura.',
    faq: 'Perguntas frequentes',
    qLeader: 'Quem lidera o {name} {season}?',
    qLeaderDone: 'Quem terminou em primeiro no {name} {season}?',
    qScorer: 'Quem é o artilheiro do {name} {season}?',
    qZones: 'Quais posições classificam no {name} {season}?',
    qEnd: 'Quando termina a fase regular do {name} {season}?',
    aEnd: 'A {round}, a última da fase regular, está marcada para {date}, horário de {zone}.',
    qTeams: 'Quantos times disputam o {name} {season}?',
    aTeams: 'São {n} times.',
  },
  en: {
    title: '{name} {season}: table, fixtures and top scorers',
    titleCup: '{name} {season}: fixtures, rounds and top scorers',
    desc: '{name} {season}: {lead}{parts}.',
    parts: { table: 'standings with qualification zones', round: '{round} with kickoff times', calendar: 'full schedule', scorers: 'top scorers', assists: 'assists', cards: 'cards' },
    leadDesc: '{team} top the table; ',
    leadDescDone: '{team} finished top; ',
    progress: '{round} of {total}',
    howItWorks: 'How {name} {season} works',
    standings: 'Standings',
    roundNow: '{round}',
    roundLink: '{round} kickoff times, predictions and pool',
    format: 'Format',
    scorers: 'Top scorers',
    assists: 'Assists',
    cards: 'Yellow cards',
    mixed: 'Whole {year} season: the provider combines Apertura and Clausura.',
    faq: 'Frequently asked questions',
    qLeader: 'Who is top of {name} {season}?',
    qLeaderDone: 'Who finished top of {name} {season}?',
    qScorer: 'Who is the top scorer of {name} {season}?',
    qZones: 'Which places qualify in {name} {season}?',
    qEnd: 'When does the {name} {season} regular season end?',
    aEnd: '{round}, the last of the regular season, is scheduled for {date}, {zone} time.',
    qTeams: 'How many teams play in {name} {season}?',
    aTeams: '{n} teams take part.',
  },
} as const;

const FINAL = ['FT', 'AET', 'PEN', 'CANC', 'AWD', 'WO', 'ABD'];

async function data(ctx: SeasonCtx) {
  const [standings, scorers, assists, cards] = await Promise.all([
    seasonStandings(ctx, true),
    seasonTopList(ctx, 'scorers', false),
    seasonTopList(ctx, 'assists', false),
    seasonTopList(ctx, 'cards', false),
  ]);
  return { standings, scorers, assists, cards };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, ctx } = await loadSeasonParams(await params);
  const S = STR[locale];
  const name = competitionName(ctx.comp, locale);
  const season = seasonName(ctx, locale);
  const { standings, scorers, assists, cards } = await data(ctx);
  const rows = standings.groups.length === 1 ? standings.groups[0].rows : null;
  const done = ctx.fixtures.length > 0 && ctx.fixtures.every((f) => FINAL.includes(f.fixture.status.short));
  const cr = currentRound(ctx.rounds);
  // The description lists only the blocks this season really has.
  const P = S.parts;
  const parts: string[] = [];
  if (standings.groups.length > 0) parts.push(P.table);
  parts.push(cr ? fmt(P.round, { round: roundName(cr, locale, ctx.comp) }) : P.calendar);
  const lists = ([['scorers', scorers], ['assists', assists], ['cards', cards]] as const)
    .filter(([, l]) => l.rows.length > 0)
    .map(([k]) => P[k]);
  parts.push(...lists);
  return pageMetadata({
    locale,
    path: (l) => competitionPath(l, ctx.comp.id, ctx.slug)!,
    title: fmt(standings.groups.length > 0 ? S.title : S.titleCup, { name, season }),
    description: fmt(S.desc, {
      name,
      season,
      lead: rows?.[0] && rows[0].all.played > 0 ? fmt(done ? S.leadDescDone : S.leadDesc, { team: rows[0].team.name }) : '',
      parts: joinList(parts, locale),
    }),
    appRoute: `league/${ctx.comp.id}`,
  });
}

export default async function SeasonPage({ params }: { params: Promise<Params> }) {
  const { locale, ctx } = await loadSeasonParams(await params);
  const { comp, info } = ctx;
  const S = STR[locale];
  const t = ui(locale);
  const name = competitionName(comp, locale);
  const season = seasonName(ctx, locale);
  const full = `${name} ${season}`;
  const path = competitionPath(locale, comp.id, ctx.slug)!;
  const facts = factsFor(comp.id);
  const zone = referenceZone(comp, locale);
  const { standings, scorers, assists, cards } = await data(ctx);
  const groups = standings.groups;
  const single = groups.length === 1 ? groups[0].rows : null;
  const groupNames = groups.map((g) => (groups.length > 1 ? cleanGroupName(g.name, comp, info) : ''));
  const done = ctx.fixtures.length > 0 && ctx.fixtures.every((f) => FINAL.includes(f.fixture.status.short));
  const cr = currentRound(ctx.rounds);
  const numbered = ctx.rounds.filter((r) => r.number != null);
  const indexable = true;

  // Rule-based summary: every sentence is computed from this season's data.
  const sentences: string[] = [];
  if (single) {
    const l = leaderSentence(single, locale, '', done);
    if (l) sentences.push(l);
    const ad = attackDefenceSentence(single, locale);
    if (ad) sentences.push(ad);
    const h = homeSentence(single, locale);
    if (h) sentences.push(h);
    if (!done) sentences.push(...streakSentences(single, locale));
  } else if (groups.length > 1) {
    const g = groupLeadersSentence(
      groups.map((gr, i) => ({ name: groupLabel(groupNames[i], locale), rows: gr.rows })),
      locale,
    );
    if (g) sentences.push(g);
  }

  const faq: [string, string][] = [];
  if (single) {
    const a = leaderSentence(single, locale, '', done);
    if (a) faq.push([fmt(done ? S.qLeaderDone : S.qLeader, { name, season }), a]);
    // "¿Cuántos clasifican a la liguilla?" answered from the provider's own
    // zone text per row, never from a rule we typed in.
    const z = zonesSentence(single, locale);
    if (z) faq.push([fmt(S.qZones, { name, season }), z]);
  }
  if (!scorers.mixed) {
    const a = topSentence(scorers.rows, 'scorers', locale, comp.id);
    if (a) faq.push([fmt(S.qScorer, { name, season }), a]);
  }
  if (comp.kind === 'league' && numbered.length > 0) {
    const lastRound = numbered[numbered.length - 1];
    const lastMatch = lastRound.fixtures[lastRound.fixtures.length - 1];
    if (!lastRound.fixtures.every(isDone) && !lastRound.fixtures.some(timeUnknown)) {
      faq.push([
        fmt(S.qEnd, { name, season }),
        fmt(S.aEnd, {
          round: roundName(lastRound, locale, comp),
          date: longDateIn(lastMatch.fixture.date, zone.zone, locale),
          zone: zone.label[locale],
        }),
      ]);
    }
  }
  if (comp.kind === 'league') {
    const n = single ? single.length : teamsOf(ctx.fixtures.filter((f) => parseRound(f.league.round).number != null)).length;
    if (n > 0) faq.push([fmt(S.qTeams, { name, season }), fmt(S.aTeams, { n })]);
  }

  const tableTeams = groups.flatMap((g) => g.rows.map((r) => r.team));
  const eventNode = seasonEventNode(
    ctx,
    locale,
    full,
    path,
    tableTeams.map((tm) => ({ name: tm.name, url: absolute(teamPath(locale, tm)) })),
  );

  const summary = facts?.formatSummary[locale];
  const points = facts?.formatPoints[locale];
  const roundNumber = ctx.isCurrent && cr?.number != null ? cr.number : null;

  return (
    <PageShell locale={locale}>
      <JsonLd data={eventNode} />
      <Breadcrumbs crumbs={seasonCrumbs(ctx, locale, season)} currentPath={path} />
      <CompetitionHeader
        comp={comp}
        eyebrow={`${countryLabel(ctx, locale)} · ${name}`}
        title={full}
        sub={
          cr && cr.number != null && numbered.length > 0 && !done
            ? fmt(S.progress, { round: roundName(cr, locale, comp), total: numbered.length })
            : undefined
        }
      />
      <SeasonTabs locale={locale} comp={comp} seasonSlug={ctx.slug} active="overview" hide={hiddenTabs(ctx)} />

      {summary ? <AnswerBlock title={fmt(S.howItWorks, { name, season })}>{summary}</AnswerBlock> : null}

      <TwoColumn
        main={
          <>
            {sentences.length > 0 ? (
              <p className="leading-relaxed font-semibold text-muted-foreground">{sentences.join(' ')}</p>
            ) : null}

            {groups.length > 0 ? (
              <section className="mt-6">
                <SectionTitle
                  action={
                    <Link href={competitionPath(locale, comp.id, ctx.slug, 'table')!} className="text-sm font-bold text-primary hover:underline">
                      {t.seeTable}
                    </Link>
                  }
                >
                  {S.standings}
                </SectionTitle>
                <div className="mt-3">
                  <Standings groups={groups} groupNames={groupNames} locale={locale} />
                </div>
                {standings.computed ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.computed}</p> : null}
              </section>
            ) : null}

            <AdSlot id="competition-season-1" format="in-article" indexable={indexable} label={t.ad} />

            {cr ? (
              <section className="mt-8">
                <SectionTitle>{fmt(S.roundNow, { round: roundName(cr, locale, comp) })}</SectionTitle>
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
                      {fmt(S.roundLink, { round: roundName(cr, locale, comp) })} ›
                    </Link>
                  </p>
                ) : null}
              </section>
            ) : null}

            <RoundNav ctx={ctx} locale={locale} active={cr?.number ?? null} />

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

            <AdSlot id="competition-season-2" format="in-article" indexable={indexable} label={t.ad} />

            <FaqSection title={S.faq} entries={faq} pagePath={path} />
            <p className="mt-8 text-sm font-semibold text-muted-foreground">{t.notStreaming}</p>
          </>
        }
        side={
          <>
            {(
              [
                ['scorers', S.scorers, scorers],
                ['assists', S.assists, assists],
                ['cards', S.cards, cards],
              ] as const
            ).map(([kind, title, list]) => (
              <TopFive
                key={kind}
                title={title}
                rows={list.rows}
                kind={kind}
                locale={locale}
                leagueId={comp.id}
                href={competitionPath(locale, comp.id, ctx.slug, kind)}
                note={list.mixed ? fmt(S.mixed, { year: ctx.ref.apiSeason }) : undefined}
              />
            ))}
            <AppPromo
              locale={locale}
              comp={comp}
              round={roundNumber}
              roundText={cr && roundNumber ? roundName(cr, locale, comp) : undefined}
              campaign="competition-season"
            />
            <MoreLinks ctx={ctx} locale={locale} name={name} />
          </>
        }
      />
    </PageShell>
  );
}
