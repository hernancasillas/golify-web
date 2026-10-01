import type { Metadata } from 'next';
import { localizeDeep } from '@/lib/nations';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache, type ReactNode } from 'react';
import { apiFootballGet, TTL, type Fixture, type TeamRef } from '@/lib/api-football';
import { getPickSplit } from '@/lib/community';
import { competitionById, competitionName } from '@/lib/competitions';
import { competitionPath, h2hPath, h2hSlug, homePath, matchPath, playerPath, poolPath, teamPath } from '@/lib/routes';
import { absolute, pageMetadata, type Crumb } from '@/lib/seo';
import { fill } from '@/lib/site';
import { idPairFromSlug } from '@/lib/slug';
import { longDateIn, timeIn } from '@/lib/timezones';
import { JsonLd } from '@/components/JsonLd';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { InstallCTA } from '@/components/InstallCTA';
import { AdSlot } from '@/components/ads/AdSlot';
import { TrackedLink } from '@/components/analytics/Tracked';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { FaqSection } from '@/components/blocks/FaqSection';
import { KickoffTable } from '@/components/blocks/KickoffTable';
import { DisplayHeading } from '@/components/revamp/ui';
import { otherClassics, type Classic } from '@/components/h2h/classics';
import { computeH2H, duelScorers, pairTeams, type H2HRecord } from '@/components/h2h/h2h-stats';
import {
  asLocale,
  dateText,
  fitTitle,
  getFixtureDetails,
  isFriendly,
  leagueText,
  nowMs,
  num,
  resultFor,
  scoreText,
  yearIn,
  zoneForLeague,
  type L,
} from '@/components/h2h/shared';
import { Crest, FactList, MatchRow, Panel, SplitBar, StatTile, SummaryBox } from '@/components/h2h/ui';

// Head-to-head page: /es/h2h/{a}-vs-{b}-{idA}-{idB}, one URL per pair (lower
// id first, see h2hSlug). Everything on it is computed from ONE provider call
// — the pair's meeting list — plus one batched events call for the scorers
// and one cheap "next match" call per team. Indexable from 3 meetings on
// record (plan A4); below that it renders as noindex,follow.
//
// ISR: rendered on first visit, then regenerated every 6 h. Every fetch below
// is cached at least that long, so no single call drags the interval down.
export const revalidate = 21600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

const INDEX_MIN_MEETINGS = 3;
const LIST_VISIBLE = 10;
const SCORER_SAMPLE = 5;

const STR = {
  es: {
    vs: 'vs',
    home: 'Inicio',
    eyebrow: 'Historial',
    h1: '{a} vs {b}: historial',
    wins: 'victorias',
    draws: 'empates',
    tMeetings: 'partidos registrados',
    tGpm: 'goles por partido',
    tBiggest: 'mayor goleada',
    tFirst: 'primer duelo registrado',
    split: 'Reparto de resultados: {a} {pa} %, empates {pd} %, {b} {pb} %',
    summary: 'En resumen',
    times: ['vez', 'veces'],
    sTotal: '{a} y {b} se enfrentaron {n} {times} en partidos oficiales registrados desde {year}: {a} ganó {wa}, {b} ganó {wb} y empataron {d}.',
    w: { win: ['victoria', 'victorias'], draw: ['empate', 'empates'], goal: ['gol', 'goles'] },
    official: ['{n} partido oficial registrado', '{n} partidos oficiales registrados'],
    plain: ['{n} partido registrado', '{n} partidos registrados'],
    scope: ['En el único partido oficial registrado entre ambos', 'En los últimos {n} partidos oficiales registrados entre ambos'],
    scopeF: ['En el único partido registrado entre ambos', 'En los últimos {n} partidos registrados entre ambos'],
    sTotalFriendly: '{a} y {b} se enfrentaron {n} {times} desde {year}, solo en amistosos: {a} ganó {wa}, {b} ganó {wb} y empataron {d}.',
    sFriendlies: ['El amistoso entre ambos no cuenta en el balance.', 'Los {n} amistosos entre ambos no cuentan en el balance.'],
    sLast: 'El último duelo fue {home} {score} {away}, el {date} ({competition}).',
    sWins: '{team} ganó los últimos {n} duelos.',
    sUnbeaten: '{team} suma {n} partidos seguidos sin perder ante {other}.',
    sNext: 'El próximo enfrentamiento es el {date} ({competition}).',
    meetings: 'Últimos enfrentamientos',
    older: 'Ver {n} partidos anteriores',
    won: 'Ganó {team}',
    draw: 'Empate',
    byComp: 'Por torneo',
    byCompLegend: '{a} · empates · {b}',
    scorers: 'Goleadores del duelo',

    goal: ['gol', 'goles'],
    pens: '{n} de penal',
    records: 'Récords del duelo',
    rBiggest: 'Mayor victoria de {team}',
    rMost: 'Partido con más goles',
    rUnbeaten: 'Racha sin perder más larga de {team}',
    rRun: '{n} partidos ({from} – {to})',
    rScope: 'Sobre {nOfficial} desde {year}.',
    atHome: 'Como local',
    homeRow: '{team} en casa',
    homeVal: '{w} G · {d} E · {l} P',
    homeNote: 'Partidos en los que cada equipo fue el local.',
    next: 'Próximo enfrentamiento',
    tbd: 'Hora por confirmar',
    predict: 'Haz tu pronóstico',
    nextKickoff: 'Horario por país',
    teams: 'Los equipos',
    others: 'Otros clásicos',
    teamNext: 'Próximo partido de {team}',
    teamPage: 'Ficha de {team}',
    faq: 'Preguntas frecuentes',
    qWho: '¿Quién ha ganado más partidos entre {a} y {b}?',
    aWho: '{scope} (desde {year}), {leader} suma {lwW} contra {tw} de {trailer}, con {dW}.',
    aWhoTie: '{scope} (desde {year}) están igualados: {wW} por lado y {dW}.',
    qBiggest: '¿Cuál fue la mayor goleada entre {a} y {b}?',
    aBiggest: '{scope} (desde {year}), la mayor diferencia fue el {home} {score} {away} del {date} ({competition}).',
    qGoals: '¿Cuántos goles se marcan en el {a} vs {b}?',
    aGoals: '{scope} se marcaron {gW}, un promedio de {avg} por partido: {a} anotó {ga} y {b} anotó {gb}.',
    qNext: '¿Cuándo es el próximo {a} vs {b}?',
    aNext: 'Se juega el {date} a las {time}, hora de {zone}{comp}{venue}.',
    aNextTbd: 'Está programado para el {date}{comp}; la hora todavía no está confirmada.',
    compFriendly: ', en partido amistoso',
    compIn: ', por {competition}',
    off: { PST: 'Aplazado', CANC: 'Cancelado', ABD: 'Suspendido', SUSP: 'Suspendido', AWD: 'Por decisión', WO: 'Por decisión' },
    atVenue: ', en el {venue}',
    source: 'Datos de los partidos registrados entre ambos equipos desde {year}. Golify no transmite partidos.',
    follow: 'Sigue el próximo {a} vs {b} en vivo, con alertas de gol y alineaciones, en la app Golify.',
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    titles: [
      '{a} vs {b}: historial, estadísticas y últimos partidos',
      '{a} vs {b}: historial y últimos partidos',
      '{a} vs {b}: historial',
    ],
    desc: '{a} vs {b}: {nOfficial} desde {year}, con {waW} de {a}, {dW} y {wbW} de {b}. Últimos resultados, goleadores, récords y próximo duelo.',
  },
  pt: {
    vs: 'x',
    home: 'Início',
    eyebrow: 'Histórico',
    h1: '{a} x {b}: histórico',
    wins: 'vitórias',
    draws: 'empates',
    tMeetings: 'jogos registrados',
    tGpm: 'gols por jogo',
    tBiggest: 'maior goleada',
    tFirst: 'primeiro duelo registrado',
    split: 'Divisão de resultados: {a} {pa} %, empates {pd} %, {b} {pb} %',
    summary: 'Resumo',
    times: ['vez', 'vezes'],
    sTotal: '{a} e {b} se enfrentaram {n} {times} em jogos oficiais registrados desde {year}: {a} venceu {wa}, {b} venceu {wb} e houve {dW}.',
    w: { win: ['vitória', 'vitórias'], draw: ['empate', 'empates'], goal: ['gol', 'gols'] },
    official: ['{n} jogo oficial registrado', '{n} jogos oficiais registrados'],
    plain: ['{n} jogo registrado', '{n} jogos registrados'],
    scope: ['No único jogo oficial registrado entre os dois', 'Nos últimos {n} jogos oficiais registrados entre os dois'],
    scopeF: ['No único jogo registrado entre os dois', 'Nos últimos {n} jogos registrados entre os dois'],
    sTotalFriendly: '{a} e {b} se enfrentaram {n} {times} desde {year}, só em amistosos: {a} venceu {wa}, {b} venceu {wb} e houve {dW}.',
    sFriendlies: ['O amistoso entre os dois fica fora do balanço.', 'Os {n} amistosos entre os dois ficam fora do balanço.'],
    sLast: 'O último duelo foi {home} {score} {away}, em {date} ({competition}).',
    sWins: '{team} venceu os últimos {n} duelos.',
    sUnbeaten: '{team} está há {n} jogos seguidos sem perder para {other}.',
    sNext: 'O próximo confronto será {date} ({competition}).',
    meetings: 'Últimos confrontos',
    older: 'Ver {n} jogos anteriores',
    won: '{team} venceu',
    draw: 'Empate',
    byComp: 'Por competição',
    byCompLegend: '{a} · empates · {b}',
    scorers: 'Artilheiros do confronto',

    goal: ['gol', 'gols'],
    pens: '{n} de pênalti',
    records: 'Recordes do confronto',
    rBiggest: 'Maior vitória: {team}',
    rMost: 'Jogo com mais gols',
    rUnbeaten: 'Maior invencibilidade: {team}',
    rRun: '{n} jogos ({from} – {to})',
    rScope: 'Sobre {nOfficial} desde {year}.',
    atHome: 'Como mandante',
    homeRow: '{team} em casa',
    homeVal: '{w} V · {d} E · {l} D',
    homeNote: 'Jogos em que cada time foi o mandante.',
    next: 'Próximo confronto',
    tbd: 'Horário a confirmar',
    predict: 'Faça seu palpite',
    nextKickoff: 'Horário por país',
    teams: 'Os times',
    others: 'Outros clássicos',
    teamNext: 'Próximo jogo: {team}',
    teamPage: 'Página do {team}',
    faq: 'Perguntas frequentes',
    qWho: 'Quem venceu mais jogos entre {a} e {b}?',
    aWho: '{scope} (desde {year}), {leader} soma {lwW} contra {tw} de {trailer}, com {dW}.',
    aWhoTie: '{scope} (desde {year}) há igualdade no retrospecto: {wW} para cada lado e {dW}.',
    qBiggest: 'Qual foi a maior goleada entre {a} e {b}?',
    aBiggest: '{scope} (desde {year}), a maior diferença foi {home} {score} {away}, em {date} ({competition}).',
    qGoals: 'Quantos gols saem em {a} x {b}?',
    aGoals: '{scope} saíram {gW}, média de {avg} por jogo: {a} marcou {ga} e {b} marcou {gb}.',
    qNext: 'Quando é o próximo {a} x {b}?',
    aNext: 'O jogo será {date}, às {time}, horário de {zone}{comp}{venue}.',
    aNextTbd: 'Está marcado para {date}{comp}; o horário ainda não foi confirmado.',
    compFriendly: ', em amistoso',
    compIn: ', pela competição {competition}',
    off: { PST: 'Adiado', CANC: 'Cancelado', ABD: 'Interrompido', SUSP: 'Interrompido', AWD: 'Decisão administrativa', WO: 'W.O.' },
    atVenue: ', no {venue}',
    source: 'Dados dos jogos registrados entre os dois times desde {year}. O Golify não transmite jogos.',
    follow: 'Acompanhe o próximo {a} x {b} ao vivo, com alertas de gol e escalações, no app Golify.',
    open: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    titles: [
      '{a} x {b}: histórico, estatísticas e últimos jogos',
      '{a} x {b}: histórico e últimos jogos',
      '{a} x {b}: histórico',
    ],
    desc: '{a} x {b}: {nOfficial} desde {year}, com {waW} do {a}, {dW} e {wbW} do {b}. Últimos resultados, artilheiros, recordes e próximo duelo.',
  },
  en: {
    vs: 'vs',
    home: 'Home',
    eyebrow: 'Head to head',
    h1: '{a} vs {b}: head to head',
    wins: 'wins',
    draws: 'draws',
    tMeetings: 'meetings on record',
    tGpm: 'goals per game',
    tBiggest: 'biggest win',
    tFirst: 'first meeting on record',
    split: 'Results split: {a} {pa} %, draws {pd} %, {b} {pb} %',
    summary: 'In short',
    times: ['time', 'times'],
    sTotal: '{a} and {b} have met {n} {times} in official matches on record since {year}: {a} won {wa}, {b} won {wb} and {d} ended level.',
    w: { win: ['win', 'wins'], draw: ['draw', 'draws'], goal: ['goal', 'goals'] },
    official: ['{n} official meeting on record', '{n} official meetings on record'],
    plain: ['{n} meeting on record', '{n} meetings on record'],
    scope: ['In the only official meeting on record', 'Across the last {n} official meetings on record'],
    scopeF: ['In the only meeting on record', 'Across the last {n} meetings on record'],
    sTotalFriendly: '{a} and {b} have met {n} {times} since {year}, only in friendlies: {a} won {wa}, {b} won {wb} and {d} ended level.',
    sFriendlies: ['The friendly between them is left out of the record.', 'The {n} friendlies between them are left out of the record.'],
    sLast: 'The latest meeting was {home} {score} {away} on {date} ({competition}).',
    sWins: '{team} have won the last {n} meetings.',
    sUnbeaten: '{team} are unbeaten in their last {n} meetings with {other}.',
    sNext: 'The next meeting is on {date} ({competition}).',
    meetings: 'Latest meetings',
    older: 'Show {n} earlier meetings',
    won: '{team} won',
    draw: 'Draw',
    byComp: 'By competition',
    byCompLegend: '{a} · draws · {b}',
    scorers: 'Top scorers in the fixture',

    goal: ['goal', 'goals'],
    pens: '{n} from the spot',
    records: 'Fixture records',
    rBiggest: 'Biggest {team} win',
    rMost: 'Most goals in a game',
    rUnbeaten: 'Longest {team} unbeaten run',
    rRun: '{n} games ({from} – {to})',
    rScope: 'Over {nOfficial} since {year}.',
    atHome: 'At home',
    homeRow: '{team} at home',
    homeVal: '{w} W · {d} D · {l} L',
    homeNote: 'Meetings where each side was the home team.',
    next: 'Next meeting',
    tbd: 'Kickoff time to be confirmed',
    predict: 'Make your pick',
    nextKickoff: 'Kickoff time by country',
    teams: 'The teams',
    others: 'Other derbies',
    teamNext: 'Next {team} match',
    teamPage: '{team} team page',
    faq: 'Frequently asked questions',
    qWho: 'Who has won more games between {a} and {b}?',
    aWho: '{scope} (since {year}), {leader} have {lwW} to {trailer}’s {tw}, with {dW}.',
    aWhoTie: '{scope} (since {year}) the record is level: {wW} each and {dW}.',
    qBiggest: 'What is the biggest win between {a} and {b}?',
    aBiggest: '{scope} (since {year}), the widest margin was {home} {score} {away} on {date} ({competition}).',
    qGoals: 'How many goals are scored in {a} vs {b}?',
    aGoals: '{scope} there were {gW}, an average of {avg} per game: {a} scored {ga} and {b} scored {gb}.',
    qNext: 'When is the next {a} vs {b}?',
    aNext: 'It is on {date} at {time} {zone} time{comp}{venue}.',
    aNextTbd: 'It is scheduled for {date}{comp}; the kickoff time is not confirmed yet.',
    compFriendly: ', as a friendly',
    compIn: ', in the {competition}',
    off: { PST: 'Postponed', CANC: 'Cancelled', ABD: 'Abandoned', SUSP: 'Suspended', AWD: 'Awarded', WO: 'Walkover' },
    atVenue: ', at {venue}',
    source: 'Data from the matches on record between both teams since {year}. Golify does not stream matches.',
    follow: 'Follow the next {a} vs {b} live, with goal alerts and lineups, in the Golify app.',
    open: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    titles: [
      '{a} vs {b}: head-to-head record, stats and results',
      '{a} vs {b}: head-to-head record and results',
      '{a} vs {b}: head to head',
    ],
    desc: '{a} vs {b}: {nOfficial} since {year}: {a} {waW}, {b} {wbW} and {dW}. Latest results, top scorers, records and the next meeting.',
  },
} as const;

interface Loaded {
  a: TeamRef;
  b: TeamRef;
  all: Fixture[];
  rec: H2HRecord;
}

// One provider call for the whole history. `strict`: a failed call throws
// (ISR keeps the last good copy); an empty answer means the pair never met
// on record → 404. Shared between generateMetadata and the page.
const loadRaw = cache(async (slug: string): Promise<Loaded | null> => {
  // `2287-2278` (ids only, a hand-typed or shared short form) is accepted
  // too and redirected to the slugged URL below.
  const bare = /^(\d+)-(\d+)$/.exec(slug);
  const pair: [number, number] | null = bare ? [Number(bare[1]), Number(bare[2])] : idPairFromSlug(slug);
  if (!pair || pair[0] === pair[1]) return null;
  const [x, y] = pair[0] < pair[1] ? pair : [pair[1], pair[0]];
  const rows = await apiFootballGet<Fixture>('/fixtures/headtohead', { h2h: `${x}-${y}` }, { revalidate: TTL.hours, strict: true });
  if (rows.length === 0) return null;
  const all = [...rows].sort((p, q) => q.fixture.date.localeCompare(p.fixture.date));
  const teams = pairTeams(all, x, y);
  if (!teams) return null;
  const [a, b] = teams;
  return { a, b, all, rec: computeH2H(all, a, b, nowMs()) };
});

async function load(slug: string, locale: L): Promise<Loaded | null> {
  const d = await loadRaw(slug);
  return d ? localizeDeep(d, locale) : d;
}

function plural(n: number, forms: readonly [string, string] | readonly string[]): string {
  return n === 1 ? forms[0] : forms[1];
}

/** "En los últimos 33 partidos oficiales registrados entre ambos" — the
 *  honest scope every answer starts with. */
function scopeText(locale: L, n: number, friendlies: boolean): string {
  const t = STR[locale];
  return plural(n, friendlies ? t.scopeF : t.scope).replace('{n}', String(n));
}

function vars(d: Loaded, locale: L) {
  const { a, b, rec } = d;
  const oldest = rec.counted[rec.counted.length - 1];
  const zone = zoneForLeague((rec.counted[0] ?? d.all[0]).league.id, locale).zone;
  const t = STR[locale];
  const n = rec.counted.length;
  const count = (k: number, forms: readonly string[]) => `${k} ${plural(k, forms)}`;
  return {
    a: a.name,
    b: b.name,
    n: String(n),
    wa: String(rec.a.wins),
    wb: String(rec.b.wins),
    d: String(rec.draws),
    waW: count(rec.a.wins, t.w.win),
    wbW: count(rec.b.wins, t.w.win),
    dW: count(rec.draws, t.w.draw),
    nOfficial: plural(n, rec.includesFriendlies ? t.plain : t.official).replace('{n}', String(n)),
    scope: scopeText(locale, n, rec.includesFriendlies),
    year: oldest ? yearIn(oldest.fixture.date, zone) : '',
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const d = await load(slug, locale);
  if (!d) return {};
  const t = STR[locale];
  const v = vars(d, locale);
  return pageMetadata({
    locale,
    path: (l) => h2hPath(l, d.a, d.b),
    title: fitTitle(t.titles.map((x) => fill(x, v))),
    description: fill(t.desc, v),
    noindex: d.rec.counted.length < INDEX_MIN_MEETINGS,
    images: [{ url: d.a.logo, alt: d.a.name }, { url: d.b.logo, alt: d.b.name }].filter((i) => i.url),
  });
}

export default async function H2HPage({ params }: { params: Promise<Params> }) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const d = await load(slug, locale);
  if (!d) notFound();

  const { a, b, all, rec } = d;
  // Reversed order, renamed club or a hand-typed slug: one hop to the
  // canonical pair URL.
  if (slug !== h2hSlug(a, b)) permanentRedirect(h2hPath(locale, a, b));

  const t = STR[locale];
  const v = vars(d, locale);
  const path = h2hPath(locale, a, b);
  const indexable = rec.counted.length >= INDEX_MIN_MEETINGS;
  const n = rec.counted.length;
  const latest = rec.counted[0] ?? null;
  const dateZone = (f: Fixture) => zoneForLeague(f.league.id, locale).zone;
  const name = (id: number) => (id === a.id ? a.name : b.name);

  // Secondary data, all cached ≥ the page interval. None of it is required:
  // a failed call drops its block instead of printing an empty one.
  const scorerIds = rec.counted.slice(0, SCORER_SAMPLE).map((f) => f.fixture.id);
  const [details, nextA, nextB, split] = await Promise.all([
    getFixtureDetails(scorerIds),
    apiFootballGet<Fixture>('/fixtures', { team: a.id, next: 1 }, { revalidate: TTL.hours }),
    apiFootballGet<Fixture>('/fixtures', { team: b.id, next: 1 }, { revalidate: TTL.hours }),
    rec.next ? getPickSplit(rec.next.fixture.id) : Promise.resolve(null),
  ]);
  const withEvents = details.filter((f) => f.events.length > 0);
  const scorers = duelScorers(withEvents).slice(0, 8);

  // ---- Generated summary (rules over the record, never filler) -----------
  const sentences: string[] = [];
  if (n > 0) {
    sentences.push(fill(rec.includesFriendlies ? t.sTotalFriendly : t.sTotal, { ...v, times: plural(n, t.times) }));
  }
  if (latest) {
    sentences.push(
      fill(t.sLast, {
        home: latest.teams.home.name,
        away: latest.teams.away.name,
        score: scoreText(latest, locale),
        date: dateText(latest.fixture.date, dateZone(latest), locale),
        competition: leagueText(latest, locale),
      }),
    );
  }
  if (rec.streak) {
    const team = rec.streak.side === 'a' ? a.name : b.name;
    const other = rec.streak.side === 'a' ? b.name : a.name;
    sentences.push(fill(rec.streak.kind === 'wins' ? t.sWins : t.sUnbeaten, { team, other, n: String(rec.streak.length) }));
  }
  if (rec.friendliesExcluded > 0) sentences.push(fill(plural(rec.friendliesExcluded, t.sFriendlies), { n: String(rec.friendliesExcluded) }));
  if (rec.next) {
    sentences.push(
      fill(t.sNext, {
        date: longDateIn(rec.next.fixture.date, dateZone(rec.next), locale),
        competition: leagueText(rec.next, locale),
      }),
    );
  }

  // ---- FAQ (visible word for word; scope stated in every answer) ---------
  const faq: [string, string][] = [];
  if (n > 0) {
    const tie = rec.a.wins === rec.b.wins;
    const lead = rec.a.wins >= rec.b.wins ? rec.a : rec.b;
    const trail = lead === rec.a ? rec.b : rec.a;
    faq.push([
      fill(t.qWho, v),
      tie
        ? fill(t.aWhoTie, { ...v, wW: `${rec.a.wins} ${plural(rec.a.wins, t.w.win)}` })
        : fill(t.aWho, { ...v, leader: lead.team.name, trailer: trail.team.name, lwW: `${lead.wins} ${plural(lead.wins, t.w.win)}`, tw: String(trail.wins) }),
    ]);
  }
  const widest = [rec.a.biggestWin, rec.b.biggestWin]
    .filter((f): f is Fixture => !!f)
    .sort((p, q) => Math.abs((q.goals.home ?? 0) - (q.goals.away ?? 0)) - Math.abs((p.goals.home ?? 0) - (p.goals.away ?? 0)))[0];
  if (widest && !rec.includesFriendlies) {
    faq.push([
      fill(t.qBiggest, v),
      fill(t.aBiggest, {
        ...v,
        home: widest.teams.home.name,
        away: widest.teams.away.name,
        score: scoreText(widest, locale),
        date: dateText(widest.fixture.date, dateZone(widest), locale),
        competition: leagueText(widest, locale),
      }),
    ]);
  }
  if (n > 0 && !rec.includesFriendlies) {
    const g = rec.a.goals + rec.b.goals;
    faq.push([
      fill(t.qGoals, v),
      fill(t.aGoals, { ...v, gW: `${g} ${plural(g, t.w.goal)}`, avg: num(g / n, locale, 1), ga: String(rec.a.goals), gb: String(rec.b.goals) }),
    ]);
  }
  const next = rec.next;
  const nextTbd = next?.fixture.status.short === 'TBD';
  const nextZone = next ? zoneForLeague(next.league.id, locale) : null;
  if (next && nextZone) {
    const nv = {
      ...v,
      date: longDateIn(next.fixture.date, nextZone.zone, locale),
      time: timeIn(next.fixture.date, nextZone.zone, locale),
      zone: nextZone.label[locale],
      // Not through fill(): it trims, and this fragment starts with a separator.
      comp: isFriendly(next) ? t.compFriendly : t.compIn.replace('{competition}', leagueText(next, locale)),
      venue: next.fixture.venue.name ? fill(t.atVenue, { venue: next.fixture.venue.name }) : '',
    };
    faq.push([fill(t.qNext, v), fill(nextTbd ? t.aNextTbd : t.aNext, nv)]);
  }

  // ---- Breadcrumb: Inicio › {competition of the latest meeting} › duel ---
  const crumbs: Crumb[] = [{ name: t.home, path: homePath(locale) }];
  const crumbComp = latest ? competitionById(latest.league.id) : null;
  const crumbCompPath = crumbComp ? competitionPath(locale, crumbComp.id) : null;
  if (crumbComp && crumbCompPath) crumbs.push({ name: competitionName(crumbComp, locale), path: crumbCompPath });
  crumbs.push({ name: `${a.name} ${t.vs} ${b.name}` });

  // ---- Structured data: the next meeting as a SportsEvent ----------------
  const eventLd = next
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: `${next.teams.home.name} ${t.vs} ${next.teams.away.name}`,
        sport: 'Soccer',
        startDate: next.fixture.date,
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: next.fixture.venue.name ?? next.league.country ?? next.league.name,
          ...(next.fixture.venue.city ? { address: next.fixture.venue.city } : {}),
        },
        homeTeam: { '@type': 'SportsTeam', name: next.teams.home.name, logo: next.teams.home.logo },
        awayTeam: { '@type': 'SportsTeam', name: next.teams.away.name, logo: next.teams.away.logo },
        organizer: { '@type': 'Organization', name: next.league.name },
        url: absolute(matchPath(locale, next)),
      }
    : null;

  const visible = all.filter((f) => f !== next).slice(0, LIST_VISIBLE);
  const older = all.filter((f) => f !== next).slice(LIST_VISIBLE);
  const tagFor = (f: Fixture) => {
    const off = t.off[f.fixture.status.short as keyof typeof t.off];
    if (off) return off;
    if (f.goals.home == null || f.goals.away == null) return undefined;
    const r = resultFor(f, a.id);
    return r === 'd' ? t.draw : fill(t.won, { team: r === 'w' ? a.name : b.name });
  };
  const biggestTile = widest ? `${Math.max(widest.goals.home ?? 0, widest.goals.away ?? 0)}-${Math.min(widest.goals.home ?? 0, widest.goals.away ?? 0)}` : null;
  const oldest = rec.counted[rec.counted.length - 1];
  const nextTeamMatches = [
    { team: a, f: nextA[0] ?? null },
    { team: b, f: nextB[0] ?? null },
  ];
  const pool = next ? poolPath(locale, next.league.id) : null;
  // Derbies of the pair's own market first, then the reader's.
  const pairMarket = crumbComp?.market;
  const localeMarkets: Classic['market'][] = locale === 'pt' ? ['br', 'ar'] : locale === 'en' ? ['es', 'mx', 'br'] : ['mx', 'ar', 'co', 'cl'];
  const preferred = [
    ...(pairMarket && ['mx', 'ar', 'br', 'co', 'cl', 'es'].includes(pairMarket) ? [pairMarket as Classic['market']] : []),
    ...localeMarkets,
  ];
  const classics = otherClassics(a.id, b.id, preferred);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={eventLd} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />

        {/* Hero: the balance, then the four numbers people search for. */}
        <section className="mt-5 flex flex-col gap-6 rounded-3xl border border-border bg-band p-5 sm:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{t.eyebrow}</p>
            <DisplayHeading as="h1" className="text-3xl sm:text-5xl">
              {fill(t.h1, v)}
            </DisplayHeading>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-8">
            <Link href={teamPath(locale, a)} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <Crest src={a.logo} alt={a.name} size={72} />
              <span className="max-w-full truncate text-sm font-bold sm:text-base">{a.name}</span>
              <span className="font-display text-4xl font-bold text-primary tabular-nums sm:text-5xl">{rec.a.wins}</span>
              <span className="text-xs font-semibold text-muted-foreground">{t.wins}</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-display text-3xl font-bold text-muted-foreground tabular-nums sm:text-4xl">{rec.draws}</span>
              <span className="text-xs font-semibold text-muted-foreground">{t.draws}</span>
            </div>
            <Link href={teamPath(locale, b)} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <Crest src={b.logo} alt={b.name} size={72} />
              <span className="max-w-full truncate text-sm font-bold sm:text-base">{b.name}</span>
              <span className="font-display text-4xl font-bold text-gold tabular-nums sm:text-5xl">{rec.b.wins}</span>
              <span className="text-xs font-semibold text-muted-foreground">{t.wins}</span>
            </Link>
          </div>

          <SplitBar
            a={rec.a.wins}
            d={rec.draws}
            b={rec.b.wins}
            label={fill(t.split, {
              a: a.name,
              b: b.name,
              pa: String(n ? Math.round((rec.a.wins / n) * 100) : 0),
              pd: String(n ? Math.round((rec.draws / n) * 100) : 0),
              pb: String(n ? Math.round((rec.b.wins / n) * 100) : 0),
            })}
          />

          {n > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile value={String(n)} label={t.tMeetings} />
              <StatTile value={num((rec.a.goals + rec.b.goals) / n, locale, 1)} label={t.tGpm} />
              {biggestTile ? <StatTile value={biggestTile} label={t.tBiggest} /> : null}
              {oldest ? <StatTile value={yearIn(oldest.fixture.date, dateZone(oldest))} label={t.tFirst} /> : null}
            </div>
          ) : null}
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-6">
            <SummaryBox title={t.summary} sentences={sentences} />

            <Panel title={t.meetings}>
              <div>
                {visible.map((f) => (
                  <MatchRow key={f.fixture.id} f={f} locale={locale} zone={dateZone(f)} tag={tagFor(f)} />
                ))}
              </div>
              {older.length > 0 ? (
                // Server-rendered and crawlable; the browser only toggles it.
                <details className="mt-2 rounded-xl border border-border">
                  <summary className="cursor-pointer px-4 py-3 text-center text-sm font-bold">
                    {fill(t.older, { n: String(older.length) })}
                  </summary>
                  <div className="px-2 pb-2">
                    {older.map((f) => (
                      <MatchRow key={f.fixture.id} f={f} locale={locale} zone={dateZone(f)} tag={tagFor(f)} />
                    ))}
                  </div>
                </details>
              ) : null}
            </Panel>

            <AdSlot id="h2h-after-meetings" format="leaderboard" indexable={indexable} />

            {rec.byCompetition.length > 0 || scorers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {rec.byCompetition.length > 0 ? (
                  <Panel title={t.byComp}>
                    <p className="text-xs font-semibold text-muted-foreground">{fill(t.byCompLegend, v)}</p>
                    <ul className="mt-2 divide-y divide-border">
                      {rec.byCompetition.map((c) => {
                        const cp = competitionPath(locale, c.leagueId);
                        const label = leagueText(c.sample, locale);
                        return (
                          <li key={c.leagueId} className="flex flex-col gap-1.5 py-2.5">
                            <div className="flex justify-between gap-3 text-sm">
                              {cp ? (
                                <Link href={cp} className="font-semibold hover:text-primary">
                                  {label}
                                </Link>
                              ) : (
                                <span className="font-semibold">{label}</span>
                              )}
                              <span className="font-bold text-muted-foreground tabular-nums">
                                {c.winsA} · {c.draws} · {c.winsB}
                              </span>
                            </div>
                            <SplitBar a={c.winsA} d={c.draws} b={c.winsB} label={`${label}: ${c.winsA} · ${c.draws} · ${c.winsB}`} />
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                ) : null}

                {scorers.length > 0 ? (
                  <Panel title={t.scorers}>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {scopeText(locale, withEvents.length, rec.includesFriendlies)}.
                    </p>
                    <ul className="mt-2 divide-y divide-border">
                      {scorers.map((s) => {
                        const team = s.teamId === a.id ? a : s.teamId === b.id ? b : null;
                        const label = (
                          <>
                            <span className="block truncate font-semibold">{s.name}</span>
                            {s.penalties > 0 ? (
                              <span className="block text-xs font-semibold text-muted-foreground">
                                {fill(t.pens, { n: String(s.penalties) })}
                              </span>
                            ) : null}
                          </>
                        );
                        return (
                          <li key={`${s.id ?? s.name}-${s.teamId}`} className="flex items-center gap-3 py-2.5 text-sm">
                            <Crest src={team?.logo} alt={team?.name ?? ''} size={24} />
                            <span className="min-w-0 flex-1">
                              {s.id ? (
                                <Link href={playerPath(locale, { id: s.id, name: s.name })} className="hover:text-primary">
                                  {label}
                                </Link>
                              ) : (
                                label
                              )}
                            </span>
                            <span className="font-display text-lg font-bold tabular-nums">
                              {s.goals} <span className="text-xs font-semibold text-muted-foreground">{plural(s.goals, t.goal)}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                ) : null}
              </div>
            ) : null}

            {n > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Panel title={t.records}>
                  <FactList
                    rows={[
                      ...[rec.a, rec.b]
                        .filter((s) => s.biggestWin)
                        .map((s): [string, ReactNode] => [
                          fill(t.rBiggest, { team: s.team.name }),
                          <RecordMatch key={s.team.id} f={s.biggestWin!} locale={locale} zone={dateZone(s.biggestWin!)} />,
                        ]),
                      ...(rec.mostGoals
                        ? [[t.rMost, <RecordMatch key="most" f={rec.mostGoals} locale={locale} zone={dateZone(rec.mostGoals)} />] as [string, ReactNode]]
                        : []),
                      ...[rec.a, rec.b]
                        .filter((s) => s.unbeaten && s.unbeaten.length >= 2)
                        .map((s): [string, ReactNode] => [
                          fill(t.rUnbeaten, { team: s.team.name }),
                          fill(t.rRun, {
                            n: String(s.unbeaten!.length),
                            from: dateText(s.unbeaten!.from.fixture.date, dateZone(s.unbeaten!.from), locale),
                            to: dateText(s.unbeaten!.to.fixture.date, dateZone(s.unbeaten!.to), locale),
                          }),
                        ]),
                    ]}
                  />
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">{fill(t.rScope, v)}</p>
                </Panel>

                <Panel title={t.atHome}>
                  <FactList
                    rows={[rec.a, rec.b]
                      .filter((s) => s.home.played > 0)
                      .map((s): [string, ReactNode] => [
                        `${fill(t.homeRow, { team: s.team.name })} (${s.home.played})`,
                        fill(t.homeVal, { w: String(s.home.w), d: String(s.home.d), l: String(s.home.l) }),
                      ])}
                  />
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.homeNote}</p>
                </Panel>
              </div>
            ) : null}

            <FaqSection title={t.faq} entries={faq} pagePath={path} className="mt-2" />

            {oldest ? (
              <p className="text-xs font-semibold text-muted-foreground">
                {fill(t.source, { year: yearIn(oldest.fixture.date, dateZone(oldest)) })}
              </p>
            ) : null}
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            {next ? (
              <Panel eyebrow={t.next}>
                <Link href={matchPath(locale, next)} className="mt-2 block text-center">
                  <span className="text-sm font-bold text-muted-foreground capitalize">
                    {longDateIn(next.fixture.date, nextZone!.zone, locale)}
                  </span>
                  <span className="mt-3 flex items-center justify-around gap-2">
                    <Crest src={next.teams.home.logo} alt={next.teams.home.name} size={48} />
                    <span className="font-display text-xl font-bold text-muted-foreground">{t.vs}</span>
                    <Crest src={next.teams.away.logo} alt={next.teams.away.name} size={48} />
                  </span>
                  <span className="mt-2 block text-sm font-bold">
                    {next.teams.home.name} {t.vs} {next.teams.away.name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                    {[leagueText(next, locale), next.fixture.venue.name].filter(Boolean).join(' · ')}
                  </span>
                </Link>
                {nextTbd ? (
                  <p className="mt-4 text-center text-sm font-bold text-muted-foreground">{t.tbd}</p>
                ) : (
                  <KickoffTable iso={next.fixture.date} locale={locale} title={t.nextKickoff} headingLevel="h3" />
                )}
                <CommunitySplit split={split} home={next.teams.home.name} away={next.teams.away.name} locale={locale} />
                {pool ? (
                  <TrackedLink
                    event="quiniela_create_click"
                    params={{ page: 'h2h', pair: h2hSlug(a, b) }}
                    href={pool}
                    className="mt-5 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:brightness-105"
                  >
                    {t.predict}
                  </TrackedLink>
                ) : null}
              </Panel>
            ) : null}

            <AdSlot id="h2h-sidebar" format="rectangle" indexable={indexable} />

            <Panel title={t.teams}>
              <ul className="divide-y divide-border">
                {nextTeamMatches.map(({ team, f }) => (
                  <li key={team.id} className="py-3">
                    <Link href={teamPath(locale, team)} className="flex items-center gap-3 text-sm font-bold hover:text-primary">
                      <Crest src={team.logo} alt="" size={28} />
                      {fill(t.teamPage, { team: team.name })}
                    </Link>
                    {f && f.fixture.id !== next?.fixture.id ? (
                      <Link href={matchPath(locale, f)} className="mt-2 block rounded-xl bg-surface-2 px-3 py-2.5 text-sm hover:bg-surface-2/70">
                        <span className="block text-xs font-bold text-muted-foreground">{fill(t.teamNext, { team: name(team.id) })}</span>
                        <span className="mt-0.5 block font-semibold">
                          {f.teams.home.name} {t.vs} {f.teams.away.name}
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">
                          {dateText(f.fixture.date, dateZone(f), locale)} · {leagueText(f, locale)}
                        </span>
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>

            {classics.length > 0 ? (
              <Panel title={t.others}>
                <ul className="divide-y divide-border">
                  {classics.map((c) => (
                    <li key={`${c.a.id}-${c.b.id}`}>
                      <Link href={h2hPath(locale, c.a, c.b)} className="flex items-center gap-3 py-2.5 text-sm font-bold hover:text-primary">
                        <span className="flex shrink-0 -space-x-1.5">
                          <Crest src={`https://media.api-sports.io/football/teams/${c.a.id}.png`} alt="" size={24} />
                          <Crest src={`https://media.api-sports.io/football/teams/${c.b.id}.png`} alt="" size={24} />
                        </span>
                        <span className="min-w-0 truncate">
                          {c.a.name} {t.vs} {c.b.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </aside>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
          <p className="leading-relaxed font-semibold text-muted-foreground">{fill(t.follow, v)}</p>
          <div className="mt-4">
            <InstallCTA
              deeplink={next ? `golify://match/${next.fixture.id}` : undefined}
              labels={{ open: t.open, ios: t.ios, android: t.android }}
            />
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}

function RecordMatch({ f, locale, zone }: { f: Fixture; locale: L; zone: string }) {
  return (
    <Link href={matchPath(locale, f)} className="hover:text-primary">
      <span className="block">
        {f.teams.home.name} {scoreText(f, locale)} {f.teams.away.name}
      </span>
      <span className="block text-xs font-semibold text-muted-foreground">
        {dateText(f.fixture.date, zone, locale)} · {leagueText(f, locale)}
      </span>
    </Link>
  );
}
