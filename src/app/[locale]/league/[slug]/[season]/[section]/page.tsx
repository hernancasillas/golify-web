import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Fixture } from '@/lib/api-football';
import { competitionName, roundWord } from '@/lib/competitions';
import { getPickSplits } from '@/lib/community';
import { competitionPath, matchPath, poolPath, sectionPath, subsection, teamPath, type RouteLocale } from '@/lib/routes';
import { absolute, pageMetadata, type Crumb, type JsonLdNode } from '@/lib/seo';
import { longDateIn, shortDateIn } from '@/lib/timezones';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AdSlot } from '@/components/ads/AdSlot';
import { TrackedLink } from '@/components/analytics/Tracked';
import {
  cleanGroupName,
  currentRound,
  isDone,
  referenceZone,
  roundName,
  roundZones,
  seasonName,
  seasonStandings,
  seasonTopList,
  timeUnknown,
  type RoundGroup,
  type SeasonCtx,
  type StandingsResult,
  type TopKind,
  type TopListResult,
} from '@/components/competition/data';
import { fmt, groupLabel, ui } from '@/components/competition/i18n';
import { countryLabel, hiddenTabs, seasonCrumbs, type SectionKey } from '@/components/competition/page-helpers';
import {
  attackDefenceSentence,
  groupLeadersSentence,
  homeSentence,
  leaderSentence,
  roundRecap,
  streakSentences,
  topSentence,
  zonesSentence,
} from '@/components/competition/rules';
import { loadSeasonParams, type SectionSpec } from '@/components/competition/season-load';
import { MoreLinks, RoundNav } from '@/components/competition/blocks';
import {
  AppPromo,
  CompetitionHeader,
  EmptyNote,
  FixtureCard,
  FixtureLine,
  PageShell,
  RoundPager,
  SeasonTabs,
  SectionTitle,
  Standings,
  TopFive,
  TopTable,
  TwoColumn,
  ZoneTimes,
} from '@/components/competition/ui';

// Season sub-pages: /es/liga-mx/apertura-2026/{tabla|goleadores|asistencias|
// tarjetas|calendario|jornada-12} (pt: tabela|artilheiros|…|rodada-12; en:
// table|top-scorers|…|matchday-12).
//
// One file because the six sections share the param resolution (legacy id,
// split league's bare year, wrong-language section → one 308 to the
// canonical URL, see season-load.ts) and the page chrome. Each section
// loads only the list it is about, strict: a failed provider call throws
// so ISR keeps the last good copy. A section the provider has nothing for
// yet (no scorers in week one) still renders an honest empty state, but as
// noindex and without ads (plan A4 / C3).
export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string; season: string; section: string };

const STR = {
  es: {
    title: {
      table: 'Tabla {name} {season}: posiciones y zonas',
      scorers: 'Goleadores {name} {season}: tabla de goleo',
      assists: 'Asistencias {name} {season}: máximos asistidores',
      cards: 'Tarjetas {name} {season}: amarillas y rojas',
      fixtures: 'Calendario {name} {season}: partidos y resultados',
      round: '{round} {name} {season}: horarios y resultados',
    },
    h1: {
      table: 'Tabla {name} {season}',
      scorers: 'Goleadores {name} {season}',
      assists: 'Asistencias {name} {season}',
      cards: 'Tarjetas {name} {season}',
      fixtures: 'Calendario {name} {season}',
      round: '{round} · {name} {season}',
    },
    desc: {
      table: 'Tabla de posiciones de {name} {season}{lead}: puntos, diferencia de goles, local y visitante, últimos cinco y zonas de clasificación.',
      tableEmpty: 'Tabla de posiciones de {name} {season}: se publica en cuanto arranque el torneo.',
      scorers: 'Tabla de goleo de {name} {season}{lead}: los 20 máximos goleadores con goles, penales y partidos jugados.',
      assists: 'Máximos asistidores de {name} {season}{lead}: los 20 jugadores con más pases de gol.',
      cards: 'Jugadores más amonestados de {name} {season}{lead}: tarjetas amarillas y rojas de los 20 primeros.',
      topEmpty: '{list} de {name} {season}: la lista aparece cuando se jueguen los primeros partidos.',
      fixtures: 'Calendario completo de {name} {season}: {n} partidos por {word}, con horarios en hora de {zone} y resultados.',
      round: '{round} de {name} {season}{when}: {n} partidos con horarios por país, resultados y la quiniela de la jornada.',
    },
    leadTable: ' ({team} va primero)',
    leadTableDone: ' ({team} terminó primero)',
    leadTop: ' ({player} encabeza con {n})',
    when: ', del {from} al {to}',
    whenOne: ', el {from}',
    progress: '{round} de {total}',
    tableEmpty: 'Todavía no hay tabla para este torneo. En cuanto se juegue la primera jornada, aquí verás las posiciones.',
    topEmpty: 'Todavía no hay datos de {list} para este torneo. La lista se llena en cuanto se jueguen los primeros partidos.',
    mixed: 'Ojo: el proveedor de datos suma toda la temporada {year} (Apertura y Clausura), no solo este torneo.',
    list: { scorers: 'goleadores', assists: 'asistencias', cards: 'tarjetas' },
    tableIn: 'Así va la tabla',
    zones: 'Zonas de la tabla',
    scorersTop: 'Goleadores',
    assistsTop: 'Asistencias',
    cardsTop: 'Tarjetas amarillas',
    standingsTop: 'Tabla',
    roundsTitle: 'Todas las jornadas',
    roundShort: 'Horarios y quiniela',
    faq: 'Preguntas frecuentes',
    qLeader: '¿Quién es el líder de {name} {season}?',
    qLeaderDone: '¿Quién terminó primero en {name} {season}?',
    qZones: '¿Qué puestos clasifican en {name} {season}?',
    qTeams: '¿Cuántos equipos juegan {name} {season}?',
    aTeams: 'Juegan {n} equipos.',
    qTop: {
      scorers: '¿Quién es el goleador de {name} {season}?',
      assists: '¿Quién tiene más asistencias en {name} {season}?',
      cards: '¿Quién tiene más tarjetas amarillas en {name} {season}?',
    },
    qDates: '¿Cuándo empieza y termina {name} {season}?',
    aDates: 'El primer partido es el {from} y el último programado, el {to} (hora de {zone}).',
    qRounds: '¿Cuántas jornadas tiene {name} {season}?',
    aRounds: 'La fase regular tiene {n} jornadas.',
    qRoundWhen: '¿Cuándo se juega la {round} de {name} {season}?',
    aRoundWhen: 'La {round} se juega del {from} al {to}, hora de {zone}.',
    aRoundWhenOne: 'La {round} se juega el {from}, hora de {zone}.',
    qRoundGames: '¿Qué partidos tiene la {round} de {name} {season}?',
    qRoundResults: '¿Cómo quedó la {round} de {name} {season}?',
    pool: 'Juega la quiniela de la {round}',
    poolHint: 'Pronostica los {n} partidos con tus amigos en Golify.',
    printable: 'Quiniela para imprimir de la {round}',
    printableHint: 'Hoja lista para llenar a mano.',
    community: 'Pronóstico de la comunidad Golify',
    tbdNote: 'Partidos con horario por definir: el organizador aún no fija la hora.',
  },
  pt: {
    title: {
      table: 'Tabela {name} {season}: classificação e zonas',
      scorers: 'Artilharia {name} {season}: os goleadores',
      assists: 'Assistências {name} {season}: garçons do torneio',
      cards: 'Cartões {name} {season}: amarelos e vermelhos',
      fixtures: 'Calendário {name} {season}: jogos e resultados',
      round: '{round} {name} {season}: horários e resultados',
    },
    h1: {
      table: 'Tabela {name} {season}',
      scorers: 'Artilharia {name} {season}',
      assists: 'Assistências {name} {season}',
      cards: 'Cartões {name} {season}',
      fixtures: 'Calendário {name} {season}',
      round: '{round} · {name} {season}',
    },
    desc: {
      table: 'Tabela de classificação do {name} {season}{lead}: pontos, saldo de gols, mandante e visitante, últimos cinco jogos e zonas.',
      tableEmpty: 'Tabela de classificação do {name} {season}: publicada assim que o torneio começar.',
      scorers: 'Artilharia do {name} {season}{lead}: os 20 maiores artilheiros com gols, pênaltis e jogos.',
      assists: 'Líderes de assistências do {name} {season}{lead}: os 20 jogadores com mais passes para gol.',
      cards: 'Jogadores mais advertidos do {name} {season}{lead}: cartões amarelos e vermelhos dos 20 primeiros.',
      topEmpty: '{list} do {name} {season}: a lista aparece quando rolarem os primeiros jogos.',
      fixtures: 'Calendário completo do {name} {season}: {n} jogos por {word}, com horários no fuso de {zone} e resultados.',
      round: '{round} do {name} {season}{when}: {n} jogos com horários por país, resultados e o bolão da rodada.',
    },
    leadTable: ' ({team} lidera)',
    leadTableDone: ' ({team} terminou em primeiro)',
    leadTop: ' ({player} lidera com {n})',
    when: ', de {from} a {to}',
    whenOne: ', em {from}',
    progress: '{round} de {total}',
    tableEmpty: 'Ainda não há tabela para este torneio. Assim que a primeira rodada for disputada, a classificação aparece aqui.',
    topEmpty: 'Ainda não há dados de {list} para este torneio. A lista aparece quando rolarem os primeiros jogos.',
    mixed: 'Atenção: o provedor de dados soma toda a temporada {year} (Apertura e Clausura), não só este torneio.',
    list: { scorers: 'artilharia', assists: 'assistências', cards: 'cartões' },
    tableIn: 'Como está a tabela',
    zones: 'Zonas da tabela',
    scorersTop: 'Artilheiros',
    assistsTop: 'Assistências',
    cardsTop: 'Cartões amarelos',
    standingsTop: 'Tabela',
    roundsTitle: 'Todas as rodadas',
    roundShort: 'Horários e bolão',
    faq: 'Perguntas frequentes',
    qLeader: 'Quem lidera o {name} {season}?',
    qLeaderDone: 'Quem terminou em primeiro no {name} {season}?',
    qZones: 'Quais posições classificam no {name} {season}?',
    qTeams: 'Quantos times disputam o {name} {season}?',
    aTeams: 'São {n} times.',
    qTop: {
      scorers: 'Quem é o artilheiro do {name} {season}?',
      assists: 'Quem tem mais assistências no {name} {season}?',
      cards: 'Quem tem mais cartões amarelos no {name} {season}?',
    },
    qDates: 'Quando começa e termina o {name} {season}?',
    aDates: 'O primeiro jogo é em {from} e o último marcado, em {to} (horário de {zone}).',
    qRounds: 'Quantas rodadas tem o {name} {season}?',
    aRounds: 'A fase regular tem {n} rodadas.',
    qRoundWhen: 'Quando é a {round} do {name} {season}?',
    aRoundWhen: 'A {round} vai de {from} a {to}, horário de {zone}.',
    aRoundWhenOne: 'A {round} é em {from}, horário de {zone}.',
    qRoundGames: 'Quais são os jogos da {round} do {name} {season}?',
    qRoundResults: 'Como terminou a {round} do {name} {season}?',
    pool: 'Jogue o bolão da {round}',
    poolHint: 'Dê seu palpite nos {n} jogos com os amigos no Golify.',
    printable: 'Bolão para imprimir da {round}',
    printableHint: 'Folha pronta para preencher à mão.',
    community: 'Palpite da comunidade Golify',
    tbdNote: 'Jogos com horário a definir: o organizador ainda não marcou a hora.',
  },
  en: {
    title: {
      table: '{name} {season} table: standings and zones',
      scorers: '{name} {season} top scorers',
      assists: '{name} {season} assists leaders',
      cards: '{name} {season} cards: yellow and red',
      fixtures: '{name} {season} fixtures and results',
      round: '{name} {season} {round}: fixtures and times',
    },
    h1: {
      table: '{name} {season} table',
      scorers: '{name} {season} top scorers',
      assists: '{name} {season} assists',
      cards: '{name} {season} cards',
      fixtures: '{name} {season} fixtures',
      round: '{round} · {name} {season}',
    },
    desc: {
      table: '{name} {season} standings{lead}: points, goal difference, home and away splits, last five and qualification zones.',
      tableEmpty: '{name} {season} standings: published as soon as the season kicks off.',
      scorers: '{name} {season} top scorers{lead}: the top 20 with goals, penalties and appearances.',
      assists: '{name} {season} assists leaders{lead}: the 20 players with the most assists.',
      cards: '{name} {season} most booked players{lead}: yellow and red cards for the top 20.',
      topEmpty: '{name} {season} {list}: the list appears once the first matches are played.',
      fixtures: 'Full {name} {season} schedule: {n} matches by {word}, with kickoff times in {zone} time and results.',
      round: '{name} {season} {round}{when}: {n} matches with kickoff times by country, results and the matchday pool.',
    },
    leadTable: ' ({team} top the table)',
    leadTableDone: ' ({team} finished top)',
    leadTop: ' ({player} leads with {n})',
    when: ', {from} to {to}',
    whenOne: ', {from}',
    progress: '{round} of {total}',
    tableEmpty: 'No table yet for this season. As soon as the first matchday is played, the standings show up here.',
    topEmpty: 'No {list} data for this season yet. The list fills in once the first matches are played.',
    mixed: 'Heads up: the data provider counts the whole {year} season (Apertura and Clausura), not just this tournament.',
    list: { scorers: 'top scorers', assists: 'assists', cards: 'cards' },
    tableIn: 'The table right now',
    zones: 'Table zones',
    scorersTop: 'Top scorers',
    assistsTop: 'Assists',
    cardsTop: 'Yellow cards',
    standingsTop: 'Table',
    roundsTitle: 'All matchdays',
    roundShort: 'Times and pool',
    faq: 'Frequently asked questions',
    qLeader: 'Who is top of {name} {season}?',
    qLeaderDone: 'Who finished top of {name} {season}?',
    qZones: 'Which places qualify in {name} {season}?',
    qTeams: 'How many teams play in {name} {season}?',
    aTeams: '{n} teams take part.',
    qTop: {
      scorers: 'Who is the top scorer of {name} {season}?',
      assists: 'Who has the most assists in {name} {season}?',
      cards: 'Who has the most yellow cards in {name} {season}?',
    },
    qDates: 'When does {name} {season} start and end?',
    aDates: 'The first match is on {from} and the last one scheduled on {to} ({zone} time).',
    qRounds: 'How many matchdays does {name} {season} have?',
    aRounds: 'The regular season has {n} matchdays.',
    qRoundWhen: 'When is {round} of {name} {season}?',
    aRoundWhen: '{round} runs from {from} to {to}, {zone} time.',
    aRoundWhenOne: '{round} is on {from}, {zone} time.',
    qRoundGames: 'What are the {round} fixtures of {name} {season}?',
    qRoundResults: 'How did {round} of {name} {season} end?',
    pool: 'Play the {round} pool',
    poolHint: 'Call all {n} matches with your friends on Golify.',
    printable: 'Printable {round} pool sheet',
    printableHint: 'A sheet ready to fill in by hand.',
    community: 'Golify community prediction',
    tbdNote: 'Matches with kickoff TBD: the organiser has not set the time yet.',
  },
} as const;

type S = (typeof STR)[RouteLocale];
type TopSection = Extract<SectionKey, 'scorers' | 'assists' | 'cards'>;

const FINAL = ['FT', 'AET', 'PEN', 'CANC', 'AWD', 'WO', 'ABD'];

function seasonDone(ctx: SeasonCtx): boolean {
  return ctx.fixtures.length > 0 && ctx.fixtures.every((f) => FINAL.includes(f.fixture.status.short));
}

function sectionKeyOf(spec: SectionSpec): SectionKey | 'round' {
  return spec.kind === 'round' ? 'round' : spec.key;
}

function builderOf(spec: SectionSpec): Parameters<typeof competitionPath>[3] {
  return spec.kind === 'round' ? { round: spec.number } : spec.key;
}

/** Rounds of the season carrying this number (normally one; merged if the
 *  provider splits a matchday into two round strings). */
function roundOf(ctx: SeasonCtx, n: number): RoundGroup | null {
  const hits = ctx.rounds.filter((r) => r.number === n);
  if (hits.length === 0) return null;
  if (hits.length === 1) return hits[0];
  const fixtures = hits.flatMap((r) => r.fixtures).sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  return { ...hits[0], fixtures, first: fixtures[0].fixture.date, last: fixtures[fixtures.length - 1].fixture.date };
}

/** First and last calendar day of a set of fixtures in the reference zone,
 *  ignoring kickoffs the organiser has not fixed yet. */
function dateSpan(fixtures: Fixture[], zone: string, locale: RouteLocale, long = false) {
  const known = fixtures.filter((f) => !timeUnknown(f));
  if (known.length === 0) return null;
  const fmtDate = long ? longDateIn : shortDateIn;
  const from = fmtDate(known[0].fixture.date, zone, locale);
  const to = fmtDate(known[known.length - 1].fixture.date, zone, locale);
  return { from, to, same: from === to };
}

// ---- Data per section ---------------------------------------------------------

type SectionData =
  | { kind: 'table'; standings: StandingsResult }
  | { kind: 'top'; key: TopSection; list: TopListResult }
  | { kind: 'fixtures' }
  | { kind: 'round'; round: RoundGroup };

async function sectionData(ctx: SeasonCtx, spec: SectionSpec): Promise<SectionData> {
  if (spec.kind === 'round') {
    const round = roundOf(ctx, spec.number);
    if (!round) notFound();
    return { kind: 'round', round };
  }
  switch (spec.key) {
    case 'table':
      return { kind: 'table', standings: await seasonStandings(ctx, true) };
    case 'fixtures':
      return { kind: 'fixtures' };
    default:
      return { kind: 'top', key: spec.key, list: await seasonTopList(ctx, spec.key, true) };
  }
}

function hasContent(d: SectionData): boolean {
  if (d.kind === 'table') return d.standings.groups.length > 0;
  if (d.kind === 'top') return d.list.rows.length > 0;
  return true;
}

function topLead(list: TopListResult, kind: TopKind, ctx: SeasonCtx, S: S): string {
  if (list.mixed) return '';
  const p = list.rows[0];
  if (!p) return '';
  const s = p.statistics.find((x) => x.league.id === ctx.comp.id) ?? p.statistics[0];
  const n = kind === 'scorers' ? s?.goals.total : kind === 'assists' ? s?.goals.assists : s?.cards.yellow;
  return n ? fmt(S.leadTop, { player: p.player.name, n }) : '';
}

// ---- Metadata --------------------------------------------------------------------

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, ctx, section } = await loadSeasonParams(await params);
  if (!section) notFound();
  const S = STR[locale];
  const name = competitionName(ctx.comp, locale);
  const season = seasonName(ctx, locale);
  const zone = referenceZone(ctx.comp, locale);
  const d = await sectionData(ctx, section);
  const key = sectionKeyOf(section);
  let title: string = fmt(S.title[key], { name, season });
  let description: string;

  if (d.kind === 'table') {
    const rows = d.standings.groups.length === 1 ? d.standings.groups[0].rows : null;
    const lead = rows?.[0] && rows[0].all.played > 0 ? fmt(seasonDone(ctx) ? S.leadTableDone : S.leadTable, { team: rows[0].team.name }) : '';
    description = hasContent(d) ? fmt(S.desc.table, { name, season, lead }) : fmt(S.desc.tableEmpty, { name, season });
  } else if (d.kind === 'top') {
    description = hasContent(d)
      ? fmt(S.desc[d.key], { name, season, lead: topLead(d.list, d.key, ctx, S) })
      : fmt(S.desc.topEmpty, { name, season, list: S.list[d.key] });
  } else if (d.kind === 'fixtures') {
    description = fmt(S.desc.fixtures, {
      name,
      season,
      n: ctx.fixtures.length,
      word: roundWord(ctx.comp, locale).toLowerCase(),
      zone: zone.label[locale],
    });
  } else {
    const r = d.round;
    const round = roundName(r, locale, ctx.comp);
    title = fmt(S.title.round, { name, season, round });
    const span = dateSpan(r.fixtures, zone.zone, locale);
    description = fmt(S.desc.round, {
      name,
      season,
      round,
      n: r.fixtures.length,
      when: span ? (span.same ? fmt(S.whenOne, { from: span.from }) : fmt(S.when, { from: span.from, to: span.to })) : '',
    });
  }

  return pageMetadata({
    locale,
    path: (l) => competitionPath(l, ctx.comp.id, ctx.slug, builderOf(section))!,
    title,
    description,
    noindex: !hasContent(d),
    appRoute: `league/${ctx.comp.id}`,
  });
}

// ---- Page ---------------------------------------------------------------------------

export default async function SeasonSectionPage({ params }: { params: Promise<Params> }) {
  const { locale, ctx, section } = await loadSeasonParams(await params);
  if (!section) notFound();
  const { comp } = ctx;
  const S = STR[locale];
  const t = ui(locale);
  const name = competitionName(comp, locale);
  const season = seasonName(ctx, locale);
  const path = competitionPath(locale, comp.id, ctx.slug, builderOf(section))!;
  const zone = referenceZone(comp, locale);
  const d = await sectionData(ctx, section);
  const indexable = hasContent(d);
  const key = sectionKeyOf(section);
  const done = seasonDone(ctx);
  const cr = currentRound(ctx.rounds);
  const numbered = ctx.rounds.filter((r) => r.number != null);

  const roundTitle = d.kind === 'round' ? roundName(d.round, locale, comp) : '';
  const h1 = fmt(S.h1[key], { name, season, round: roundTitle });
  const crumbName =
    d.kind === 'round' ? roundTitle : t.tabs[key as Exclude<typeof key, 'round'>];
  const crumbs: Crumb[] = [...seasonCrumbs(ctx, locale, season), { name: crumbName, path }];

  // Side column: the other lists of the same season, non-strict (a failed
  // secondary list just does not render; the page's own data was strict).
  const sideKinds: TopKind[] =
    d.kind === 'top' ? (['scorers', 'assists', 'cards'] as TopKind[]).filter((k) => k !== d.key) : ['scorers'];
  const hidden = hiddenTabs(ctx);
  const [sideLists, sideTable] = await Promise.all([
    Promise.all(sideKinds.map((k) => seasonTopList(ctx, k, false).then((l) => [k, l] as const))),
    d.kind === 'fixtures' || d.kind === 'round' ? seasonStandings(ctx, false) : Promise.resolve(null),
  ]);

  const faq: [string, string][] = [];
  const ld: JsonLdNode[] = [];
  let main: ReactNode = null;

  if (d.kind === 'table') {
    const groups = d.standings.groups;
    const single = groups.length === 1 ? groups[0].rows : null;
    const groupNames = groups.map((g) => (groups.length > 1 ? cleanGroupName(g.name, comp, ctx.info) : ''));
    const sentences: string[] = [];
    if (single) {
      const l = leaderSentence(single, locale, '', done);
      if (l) {
        sentences.push(l);
        faq.push([fmt(done ? S.qLeaderDone : S.qLeader, { name, season }), l]);
      }
      const ad = attackDefenceSentence(single, locale);
      if (ad) sentences.push(ad);
      const h = homeSentence(single, locale);
      if (h) sentences.push(h);
      if (!done) sentences.push(...streakSentences(single, locale));
      const z = zonesSentence(single, locale);
      if (z) faq.push([fmt(S.qZones, { name, season }), z]);
      if (comp.kind === 'league') faq.push([fmt(S.qTeams, { name, season }), fmt(S.aTeams, { n: single.length })]);
    } else if (groups.length > 1) {
      const g = groupLeadersSentence(
        groups.map((gr, i) => ({ name: groupLabel(groupNames[i], locale), rows: gr.rows })),
        locale,
      );
      if (g) sentences.push(g);
    }
    let pos = 0;
    if (groups.length > 0) {
      ld.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${absolute(path)}#teams`,
        name: h1,
        numberOfItems: groups.reduce((s, g) => s + g.rows.length, 0),
        itemListElement: groups.flatMap((g) =>
          g.rows.map((r) => ({
            '@type': 'ListItem',
            position: ++pos,
            name: r.team.name,
            url: absolute(teamPath(locale, r.team)),
          })),
        ),
      });
    }
    main = (
      <>
        {sentences.length > 0 ? <p className="leading-relaxed font-semibold text-muted-foreground">{sentences.join(' ')}</p> : null}
        {groups.length > 0 ? (
          <section className="mt-6">
            <Standings groups={groups} groupNames={groupNames} locale={locale} splits />
            {d.standings.computed ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.computed}</p> : null}
          </section>
        ) : (
          <EmptyNote>{S.tableEmpty}</EmptyNote>
        )}
        <AdSlot id="competition-section-1" format="in-article" indexable={indexable} label={t.ad} />
        <RoundNav ctx={ctx} locale={locale} active={null} />
      </>
    );
  } else if (d.kind === 'top') {
    const rows = d.list.rows;
    const sentence = d.list.mixed ? null : topSentence(rows, d.key, locale, comp.id);
    if (sentence) faq.push([fmt(S.qTop[d.key], { name, season }), sentence]);
    main = (
      <>
        {sentence ? <p className="leading-relaxed font-semibold text-muted-foreground">{sentence}</p> : null}
        {d.list.mixed ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{fmt(S.mixed, { year: ctx.ref.apiSeason })}</p>
        ) : null}
        {rows.length > 0 ? (
          <div className="mt-6">
            <TopTable rows={rows} kind={d.key} locale={locale} leagueId={comp.id} />
          </div>
        ) : (
          <EmptyNote>{fmt(S.topEmpty, { list: S.list[d.key] })}</EmptyNote>
        )}
        <AdSlot id="competition-section-1" format="in-article" indexable={indexable} label={t.ad} />
      </>
    );
  } else if (d.kind === 'fixtures') {
    const span = dateSpan(ctx.fixtures, zone.zone, locale, true);
    if (span) faq.push([fmt(S.qDates, { name, season }), fmt(S.aDates, { from: span.from, to: span.to, zone: zone.label[locale] })]);
    if (comp.kind === 'league' && numbered.length > 0) {
      faq.push([fmt(S.qRounds, { name, season }), fmt(S.aRounds, { n: numbered.length })]);
    }
    main = (
      <>
        <p className="text-xs font-semibold text-muted-foreground">{fmt(t.timesIn, { zone: zone.label[locale] })}</p>
        {ctx.rounds.map((r, i) => (
          <section key={r.raw} id={r.anchor} className="mt-8 scroll-mt-24">
            <SectionTitle
              as="h2"
              action={
                r.number != null ? (
                  <Link
                    href={competitionPath(locale, comp.id, ctx.slug, { round: r.number })!}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    {S.roundShort} ›
                  </Link>
                ) : undefined
              }
            >
              {roundName(r, locale, comp)}
            </SectionTitle>
            <div className="mt-3">
              <FixtureCard>
                {r.fixtures.map((f) => (
                  <FixtureLine key={f.fixture.id} f={f} locale={locale} zone={zone} />
                ))}
              </FixtureCard>
            </div>
            {/* Ads between rounds, never above the first one. */}
            {i === 2 ? <AdSlot id="competition-section-1" format="in-article" indexable={indexable} label={t.ad} /> : null}
            {i === 8 ? <AdSlot id="competition-section-2" format="in-article" indexable={indexable} label={t.ad} /> : null}
          </section>
        ))}
      </>
    );
  } else {
    const r = d.round;
    const zones = roundZones(comp, locale);
    const splits = await getPickSplits(r.fixtures.map((f) => f.fixture.id));
    const recap = roundRecap(r.fixtures, locale);
    const allDone = r.fixtures.every(isDone);
    const open = ctx.isCurrent && !allDone;
    const pool = open ? poolPath(locale, comp.id, r.number!) : null;
    const printable = open
      ? sectionPath('downloads', locale, `quiniela-${comp.slug}-${subsection('round', locale)}-${r.number}`)
      : null;
    const span = dateSpan(r.fixtures, zone.zone, locale, true);
    if (span) {
      faq.push([
        fmt(S.qRoundWhen, { name, season, round: roundTitle }),
        span.same
          ? fmt(S.aRoundWhenOne, { round: roundTitle, from: span.from, zone: zone.label[locale] })
          : fmt(S.aRoundWhen, { round: roundTitle, from: span.from, to: span.to, zone: zone.label[locale] }),
      ]);
    }
    if (recap) {
      faq.push([fmt(S.qRoundResults, { name, season, round: roundTitle }), recap]);
    } else {
      faq.push([
        fmt(S.qRoundGames, { name, season, round: roundTitle }),
        `${r.fixtures.map((f) => `${f.teams.home.name} ${t.vs} ${f.teams.away.name}`).join(', ')}.`,
      ]);
    }
    const idx = numbered.findIndex((x) => x.number === r.number);
    const prev = idx > 0 ? numbered[idx - 1] : null;
    const next = idx >= 0 && idx < numbered.length - 1 ? numbered[idx + 1] : null;
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${absolute(path)}#matches`,
      name: h1,
      numberOfItems: r.fixtures.length,
      itemListElement: r.fixtures.map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absolute(matchPath(locale, f)),
        name: `${f.teams.home.name} ${t.vs} ${f.teams.away.name}`,
      })),
    });
    const anyTbd = r.fixtures.some(timeUnknown);
    main = (
      <>
        {recap ? <p className="leading-relaxed font-semibold text-muted-foreground">{recap}</p> : null}
        <p className="mt-2 text-xs font-semibold text-muted-foreground">{fmt(t.timesIn, { zone: zone.label[locale] })}</p>
        <div className="mt-3">
          <FixtureCard>
            {r.fixtures.map((f) => {
              const split = splits.get(f.fixture.id) ?? null;
              const showZones = !timeUnknown(f) && !isDone(f) && f.fixture.status.short === 'NS';
              if (!showZones && !split) return <FixtureLine key={f.fixture.id} f={f} locale={locale} zone={zone} />;
              return (
                <FixtureLine
                  key={f.fixture.id}
                  f={f}
                  locale={locale}
                  zone={zone}
                  extra={
                    <div className="space-y-3">
                      {showZones ? <ZoneTimes iso={f.fixture.date} zones={zones} locale={locale} /> : null}
                      {split ? (
                        <div>
                          <p className="mb-1.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{S.community}</p>
                          <CommunitySplit split={split} home={f.teams.home.name} away={f.teams.away.name} locale={locale} compact />
                        </div>
                      ) : null}
                    </div>
                  }
                />
              );
            })}
          </FixtureCard>
        </div>
        {anyTbd ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{S.tbdNote}</p> : null}
        <p className="mt-4 text-sm font-semibold text-muted-foreground">{t.notStreaming}</p>

        {pool || printable ? (
          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            {pool ? (
              <TrackedLink
                event="quiniela_create_click"
                params={{ league: comp.slug, round: r.number ?? undefined, placement: 'competition-round' }}
                href={pool}
                className="block rounded-2xl border border-primary/40 bg-surface p-4 hover:border-primary"
              >
                <span className="block font-display text-lg font-bold tracking-wide text-foreground uppercase">
                  {fmt(S.pool, { round: roundTitle })}
                </span>
                <span className="mt-1 block text-sm font-semibold text-muted-foreground">
                  {fmt(S.poolHint, { n: r.fixtures.length })}
                </span>
              </TrackedLink>
            ) : null}
            {printable ? (
              <Link href={printable} className="block rounded-2xl border border-border bg-surface p-4 hover:border-primary/50">
                <span className="block font-display text-lg font-bold tracking-wide text-foreground uppercase">
                  {fmt(S.printable, { round: roundTitle })}
                </span>
                <span className="mt-1 block text-sm font-semibold text-muted-foreground">{S.printableHint}</span>
              </Link>
            ) : null}
          </section>
        ) : null}

        <AdSlot id="competition-section-1" format="in-article" indexable={indexable} label={t.ad} />
        <RoundPager
          prev={
            prev
              ? { href: competitionPath(locale, comp.id, ctx.slug, { round: prev.number! })!, label: roundName(prev, locale, comp) }
              : null
          }
          next={
            next
              ? { href: competitionPath(locale, comp.id, ctx.slug, { round: next.number! })!, label: roundName(next, locale, comp) }
              : null
          }
        />
        <RoundNav ctx={ctx} locale={locale} active={r.number} />
      </>
    );
  }

  const sideTitle: Record<TopKind, string> = { scorers: S.scorersTop, assists: S.assistsTop, cards: S.cardsTop };
  const roundNumber = ctx.isCurrent && cr?.number != null ? cr.number : null;
  const sideGroups = sideTable?.groups ?? [];

  return (
    <PageShell locale={locale}>
      {ld.map((node, i) => (
        <JsonLd key={i} data={node} />
      ))}
      <Breadcrumbs crumbs={crumbs} currentPath={path} />
      <CompetitionHeader
        comp={comp}
        eyebrow={`${countryLabel(ctx, locale)} · ${name}`}
        title={h1}
        sub={
          cr && cr.number != null && numbered.length > 0 && !done && d.kind !== 'round'
            ? fmt(S.progress, { round: roundName(cr, locale, comp), total: numbered.length })
            : undefined
        }
      />
      <SeasonTabs
        locale={locale}
        comp={comp}
        seasonSlug={ctx.slug}
        active={d.kind === 'round' ? 'fixtures' : (key as Exclude<typeof key, 'round'>)}
        hide={hidden}
      />
      <TwoColumn
        main={
          <>
            {main}
            <AdSlot id="competition-section-2" format="in-article" indexable={indexable && d.kind !== 'fixtures'} label={t.ad} />
            <FaqSection title={S.faq} entries={faq} pagePath={path} />
          </>
        }
        side={
          <>
            {sideGroups.length === 1 ? (
              <section>
                <SectionTitle
                  action={
                    <Link href={competitionPath(locale, comp.id, ctx.slug, 'table')!} className="text-sm font-bold text-primary hover:underline">
                      {t.seeAll}
                    </Link>
                  }
                >
                  {S.standingsTop}
                </SectionTitle>
                <div className="mt-3">
                  <Standings groups={sideGroups} groupNames={['']} locale={locale} full={false} limit={8} />
                </div>
                {sideTable?.computed ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.computed}</p> : null}
              </section>
            ) : null}
            {sideLists.map(([k, list]) =>
              hidden.includes(k) ? null : (
                <TopFive
                  key={k}
                  title={sideTitle[k]}
                  rows={list.rows}
                  kind={k}
                  locale={locale}
                  leagueId={comp.id}
                  href={competitionPath(locale, comp.id, ctx.slug, k)}
                  note={list.mixed ? fmt(S.mixed, { year: ctx.ref.apiSeason }) : undefined}
                />
              ),
            )}
            <AppPromo
              locale={locale}
              comp={comp}
              round={d.kind === 'round' ? null : roundNumber}
              roundText={d.kind !== 'round' && cr && roundNumber ? roundName(cr, locale, comp) : undefined}
              campaign={`competition-${key}`}
            />
            <MoreLinks ctx={ctx} locale={locale} name={name} />
          </>
        }
      />
    </PageShell>
  );
}
