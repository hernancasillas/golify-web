import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { localizeFixture, nationName } from '@/lib/nations';
import { notFound } from 'next/navigation';
import {
  currentSeason,
  fixturePhase,
  getCurrentRound,
  getFixturesByDate,
  getLeagueInfoCached,
  getLiveFixtures,
  getSeasonFixtures,
  getStandings,
  getTopScorers,
  type Fixture,
} from '@/lib/api-football';
import {
  COMPETITIONS,
  COVERED_IDS,
  competitionById,
  competitionName,
  parseRound,
  roundLabel,
  seasonSlug,
  type Competition,
} from '@/lib/competitions';
import { getPickSplits, type PickSplit } from '@/lib/community';
import {
  competitionPath,
  datePath,
  h2hPath,
  hubPath,
  matchPath,
  playerPath,
  poolPath,
  sectionPath,
  transfersPath,
  whereToWatchPath,
  type RouteLocale,
} from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { HUB_COUNTRY_INFO, intlLocale, isoDateIn, longDateIn } from '@/lib/timezones';
import { HUB_COUNTRIES } from '@/lib/routes';
import { latestPieces } from '@/content';
import { AdSlot } from '@/components/ads/AdSlot';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { FaqSection } from '@/components/blocks/FaqSection';
import { InstallCTA } from '@/components/InstallCTA';
import { LocalTime, LocalTimeScript } from '@/components/LocalTime';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { MatchLine } from '@/components/home/MatchLine';
import { DisplayHeading, Eyebrow, LeagueChip, PillLink } from '@/components/revamp/ui';
import { SmartDownload } from '@/components/SmartDownload';

// ISR: one render per 2 minutes serves everyone. Budget per render: live 1,
// today 1, league info 1, current round 1, season fixtures 1, scorers 1,
// standings 2 = 8 API calls (all cached by the fetchers).
export const revalidate = 120;

const LOCALES = ['es', 'pt', 'en'] as const;

// Timezone that defines "today" for the page, per language (the mobile app's
// biggest audiences). The visitor's own clock is applied to kickoff times by
// <LocalTime>; this only decides which day the board shows.
const DAY_ZONE: Record<RouteLocale, string> = {
  es: 'America/Mexico_City',
  pt: 'America/Sao_Paulo',
  en: 'America/New_York',
};

const STR = {
  es: {
    metaTitle: 'Golify: resultados en vivo, horarios y quinielas',
    metaDesc: 'Resultados en vivo, partidos de hoy, tablas, goleadores y quinielas con tus amigos de Liga MX, Brasileirão, MLS, Libertadores y más.',
    eyebrow: 'Fútbol en tiempo real',
    h1: 'Resultados en vivo y quinielas con tus amigos',
    heroP: 'Marcadores al minuto, partidos de hoy, tablas y goleadores. Arma tu quiniela por jornada y compite con tu grupo.',
    ctaToday: 'Ver partidos de hoy', ctaApp: 'Descarga la app',
    live: 'En vivo ahora', liveAll: 'Ver todos los partidos en vivo',
    pool: 'Quiniela abierta', poolRound: 'Cierra con el primer partido', poolStarted: 'Ya empezó la jornada', poolPreds: 'pronósticos hasta ahora', poolCta: 'Hacer mi quiniela',
    chips: 'Ligas y torneos',
    today: 'Partidos de hoy', yesterday: 'Ayer', tomorrow: 'Mañana', todayTab: 'Hoy', todayAll: (n: number) => `Ver los ${n} partidos de hoy`, noToday: 'Hoy no hay partidos de las competiciones que cubrimos.',
    featured: 'Partido del día', featuredCta: 'Ver el partido y hacer mi pronóstico',
    scorers: 'Goleadores', goals: 'goles', allScorers: 'Ver todos los goleadores',
    searched: 'Lo más buscado', tableOf: (n: string) => `Tabla de ${n}`, h2hLabel: 'América vs Chivas: historial', watchMx: 'Dónde ver la Liga MX en EE. UU.', transfersOf: (n: string) => `Fichajes ${n}`,
    tournaments: 'Torneos en juego', leader: 'Líder', table: 'Tabla', scorersLink: 'Goleadores', calendar: 'Calendario', hub: 'Ver torneo',
    reports: 'Reportajes y previas',
    promoH: 'Lleva el fútbol en tu bolsillo', promoP: 'Alertas de gol en vivo, quinielas y retas con tus amigos, y widgets para tu pantalla de inicio. Todo con los marcadores de las ligas que sigues.',
    open: 'Abrir en la app', ios: 'App Store', android: 'Google Play',
    countries: 'Fútbol hoy en tu país', countryOf: (n: string) => `Partidos de hoy en ${n}`,
    whatH: 'Qué es Golify',
    what: (n: number) => `Golify es una app y un sitio de fútbol con resultados en vivo, horarios en tu zona, tablas, goleadores y quinielas para jugar con tus amigos. Cubrimos ${n} competiciones, entre ellas Liga MX, Brasileirão, Liga Profesional, MLS y Copa Libertadores. No transmitimos partidos ni ofrecemos apuestas.`,
    faqH: 'Preguntas frecuentes',
    faq: (n: number, names: string) => [
      ['¿Qué es Golify?', 'Golify es una app y un sitio de fútbol con resultados en vivo, partidos de hoy, tablas, goleadores y quinielas para jugar con tus amigos.'],
      ['¿Golify transmite los partidos?', 'No. Golify no transmite partidos: te muestra marcadores, horarios, alineaciones y estadísticas, y en las páginas de “Dónde ver” te decimos en qué canales se pasan.'],
      ['¿Qué competiciones cubre Golify?', `Hoy cubrimos ${n} competiciones: ${names}.`],
      ['¿Qué es una quiniela en Golify?', 'Es un juego gratuito entre amigos: predices el resultado de los partidos de cada jornada, sumas puntos por acertar y compites en la tabla de tu grupo.'],
      ['¿Golify ofrece apuestas?', 'No. Golify no es una casa de apuestas ni maneja dinero: las quinielas son solo por diversión y por el orgullo de ganarle a tus amigos.'],
      ['¿En qué dispositivos funciona?', 'Golify está disponible para iPhone en el App Store y para Android en Google Play, y este sitio funciona en cualquier navegador.'],
    ] as [string, string][],
  },
  pt: {
    metaTitle: 'Golify: resultados ao vivo, horários e bolões',
    metaDesc: 'Resultados ao vivo, jogos de hoje, tabelas, artilheiros e bolões com seus amigos do Brasileirão, Libertadores, Liga MX, MLS e mais.',
    eyebrow: 'Futebol em tempo real',
    h1: 'Resultados ao vivo e bolões com seus amigos',
    heroP: 'Placares minuto a minuto, jogos de hoje, tabelas e artilheiros. Monte seu bolão por rodada e dispute com a sua turma.',
    ctaToday: 'Ver jogos de hoje', ctaApp: 'Baixe o app',
    live: 'Ao vivo agora', liveAll: 'Ver todos os jogos ao vivo',
    pool: 'Bolão aberto', poolRound: 'Fecha com o primeiro jogo', poolStarted: 'A rodada já começou', poolPreds: 'palpites até agora', poolCta: 'Fazer meu bolão',
    chips: 'Ligas e torneios',
    today: 'Jogos de hoje', yesterday: 'Ontem', tomorrow: 'Amanhã', todayTab: 'Hoje', todayAll: (n: number) => `Ver os ${n} jogos de hoje`, noToday: 'Hoje não há jogos das competições que cobrimos.',
    featured: 'Jogo do dia', featuredCta: 'Ver o jogo e dar meu palpite',
    scorers: 'Artilheiros', goals: 'gols', allScorers: 'Ver todos os artilheiros',
    searched: 'Mais buscados', tableOf: (n: string) => `Tabela do ${n}`, h2hLabel: 'América vs Chivas: histórico', watchMx: 'Onde assistir à Liga MX nos EUA', transfersOf: (n: string) => `Transferências ${n}`,
    tournaments: 'Torneios em andamento', leader: 'Líder', table: 'Tabela', scorersLink: 'Artilheiros', calendar: 'Calendário', hub: 'Ver torneio',
    reports: 'Reportagens e prévias',
    promoH: 'Leve o futebol no bolso', promoP: 'Alertas de gol ao vivo, bolões e desafios com os amigos, e widgets para a tela inicial. Tudo com os placares das ligas que você acompanha.',
    open: 'Abrir no app', ios: 'App Store', android: 'Google Play',
    countries: 'Futebol hoje no seu país', countryOf: (n: string) => `Jogos de hoje: ${n}`,
    whatH: 'O que é o Golify',
    what: (n: number) => `O Golify é um app e um site de futebol com resultados ao vivo, horários no seu fuso, tabelas, artilheiros e bolões para jogar com os amigos. Cobrimos ${n} competições, entre elas Brasileirão, Copa Libertadores, Liga MX, MLS e Liga Profesional. Não transmitimos jogos nem oferecemos apostas.`,
    faqH: 'Perguntas frequentes',
    faq: (n: number, names: string) => [
      ['O que é o Golify?', 'O Golify é um app e um site de futebol com resultados ao vivo, jogos de hoje, tabelas, artilheiros e bolões para jogar com os amigos.'],
      ['O Golify transmite os jogos?', 'Não. O Golify não transmite jogos: mostra placares, horários, escalações e estatísticas, e nas páginas “Onde assistir” indicamos em quais canais passam.'],
      ['Quais competições o Golify cobre?', `Hoje cobrimos ${n} competições: ${names}.`],
      ['O que é um bolão no Golify?', 'É um jogo gratuito entre amigos: você palpita o resultado dos jogos de cada rodada, soma pontos por acertar e disputa a tabela do seu grupo.'],
      ['O Golify oferece apostas?', 'Não. O Golify não é casa de apostas nem movimenta dinheiro: os bolões são só por diversão e pela honra de ganhar dos amigos.'],
      ['Em quais dispositivos funciona?', 'O Golify está disponível para iPhone na App Store e para Android no Google Play, e este site funciona em qualquer navegador.'],
    ] as [string, string][],
  },
  en: {
    metaTitle: 'Golify: live scores, fixtures and football pools',
    metaDesc: 'Live scores, today’s matches, tables, top scorers and prediction pools with your friends for Liga MX, Brasileirão, MLS, Libertadores and more.',
    eyebrow: 'Football in real time',
    h1: 'Live scores and prediction pools with your friends',
    heroP: 'Minute-by-minute scores, today’s matches, tables and top scorers. Build your pool for every matchday and compete with your group.',
    ctaToday: 'See today’s matches', ctaApp: 'Get the app',
    live: 'Live now', liveAll: 'See all live matches',
    pool: 'Open pool', poolRound: 'Closes at the first kickoff', poolStarted: 'The matchday has started', poolPreds: 'predictions so far', poolCta: 'Make my picks',
    chips: 'Leagues and cups',
    today: 'Today’s matches', yesterday: 'Yesterday', tomorrow: 'Tomorrow', todayTab: 'Today', todayAll: (n: number) => `See all ${n} matches today`, noToday: 'No matches today in the competitions we cover.',
    featured: 'Match of the day', featuredCta: 'See the match and make my pick',
    scorers: 'Top scorers', goals: 'goals', allScorers: 'See all top scorers',
    searched: 'Most searched', tableOf: (n: string) => `${n} table`, h2hLabel: 'América vs Chivas: head to head', watchMx: 'Where to watch Liga MX in the US', transfersOf: (n: string) => `${n} transfers`,
    tournaments: 'Tournaments in play', leader: 'Leader', table: 'Table', scorersLink: 'Top scorers', calendar: 'Fixtures', hub: 'See tournament',
    reports: 'Features and previews',
    promoH: 'Take football in your pocket', promoP: 'Live goal alerts, pools and challenges with your friends, and home-screen widgets. All with the scores of the leagues you follow.',
    open: 'Open in the app', ios: 'App Store', android: 'Google Play',
    countries: 'Football today in your country', countryOf: (n: string) => `Today’s matches in ${n}`,
    whatH: 'What is Golify',
    what: (n: number) => `Golify is a football app and website with live scores, kickoff times in your timezone, tables, top scorers and prediction pools to play with friends. We cover ${n} competitions, including Liga MX, Brasileirão, Liga Profesional, MLS and Copa Libertadores. We do not stream matches or offer betting.`,
    faqH: 'Frequently asked questions',
    faq: (n: number, names: string) => [
      ['What is Golify?', 'Golify is a football app and website with live scores, today’s matches, tables, top scorers and prediction pools to play with friends.'],
      ['Does Golify stream matches?', 'No. Golify does not stream matches: it shows scores, kickoff times, lineups and stats, and our “Where to watch” pages tell you which channels carry them.'],
      ['Which competitions does Golify cover?', `We currently cover ${n} competitions: ${names}.`],
      ['What is a pool on Golify?', 'It is a free game among friends: you predict the result of each matchday’s matches, earn points for being right and compete on your group’s table.'],
      ['Does Golify offer betting?', 'No. Golify is not a betting site and handles no money: pools are just for fun and bragging rights.'],
      ['Which devices does it work on?', 'Golify is available for iPhone on the App Store and for Android on Google Play, and this website works in any browser.'],
    ] as [string, string][],
  },
} as const;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!(locale in STR)) return {};
  const t = STR[locale as RouteLocale];
  return pageMetadata({
    locale: locale as RouteLocale,
    path: (l) => `/${l}`,
    title: t.metaTitle,
    description: t.metaDesc,
  });
}

function Block({ title, href, linkText, children, className }: { title: string; href?: string; linkText?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className ?? 'mt-10'}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <DisplayHeading className="text-2xl sm:text-3xl">{title}</DisplayHeading>
        {href && linkText ? (
          <Link href={href} className="shrink-0 text-sm font-bold text-primary hover:underline">
            {linkText}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const CARD = 'rounded-2xl border border-border bg-surface';

/** Season slug for a competition when we can name it without guessing:
 *  single-season formats use the year; Liga MX derives its tournament from
 *  the API's own current round. Everything else links to the hub instead. */
function slugFor(c: Competition, year: number, mainSeason: { c: Competition; slug: string } | null): string | null {
  if (mainSeason && mainSeason.c.id === c.id) return mainSeason.slug;
  if (c.format === 'single') return String(year);
  return null;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(locale in STR)) notFound();
  const l = locale as RouteLocale;
  const t = STR[l];
  const now = new Date();
  const zone = DAY_ZONE[l];
  const todayIso = isoDateIn(now, zone);
  const dayMs = 86400000;
  const yIso = isoDateIn(new Date(now.getTime() - dayMs), zone);
  const tIso = isoDateIn(new Date(now.getTime() + dayMs), zone);
  const year = Number(todayIso.slice(0, 4));

  // The market's main league drives the pool, scorers and the first tournament
  // card: Brasileirão for Portuguese, Liga MX otherwise.
  const main = competitionById(l === 'pt' ? 71 : 262)!;
  const other = competitionById(l === 'pt' ? 262 : 71)!;

  // Non-critical blocks fail soft: a quota hiccup empties a block, not the page.
  const [liveRaw, todayRaw, info] = await Promise.all([
    getLiveFixtures(COVERED_IDS).catch(() => [] as Fixture[]),
    getFixturesByDate(todayIso, COVERED_IDS, zone).catch(() => [] as Fixture[]),
    getLeagueInfoCached(main.id).catch(() => null),
  ]);
  const liveAll = liveRaw.map((f) => localizeFixture(f, l));
  const todayAll = todayRaw.map((f) => localizeFixture(f, l));
  const season = info ? currentSeason(info) : null;
  const [round, seasonFxRaw, scorers, standings, otherStandings] = await Promise.all([
    season ? getCurrentRound(main.id, season).catch(() => null) : null,
    season ? getSeasonFixtures(main.id, season).catch(() => [] as Fixture[]) : [],
    season ? getTopScorers(main.id, season).catch(() => []) : [],
    season ? getStandings(main.id, season).catch(() => []) : [],
    getStandings(other.id, year).catch(() => []),
  ]);

  const seasonFx = seasonFxRaw.map((f) => localizeFixture(f, l));
  const roundFx = round ? seasonFx.filter((f) => f.league.round === round) : [];
  const picks = await getPickSplits([...roundFx.map((f) => f.fixture.id), ...todayAll.map((f) => f.fixture.id)]);

  const live = liveAll.slice(0, 6);
  const board = new Map<number, Fixture[]>();
  for (const f of todayAll) board.set(f.league.id, [...(board.get(f.league.id) ?? []), f]);

  // Match of the day: most community picks among matches not yet finished;
  // with no picks, the first match of the highest-priority competition
  // (todayAll is already in registry order).
  const open = todayAll.filter((f) => fixturePhase(f) !== 'finished');
  const pool = open.length ? open : todayAll;
  let featured: Fixture | null = pool[0] ?? null;
  let best = 0;
  for (const f of pool) {
    const n = picks.get(f.fixture.id)?.total ?? 0;
    if (n > best) {
      best = n;
      featured = f;
    }
  }
  const featuredSplit: PickSplit | null = featured ? (picks.get(featured.fixture.id) ?? null) : null;

  // Pool card.
  const poolHref = round ? poolPath(l, main.id, parseRound(round).number ?? undefined) : null;
  const firstKick = roundFx.length ? roundFx.map((f) => f.fixture.date).sort()[0] : null;
  const roundPicks = roundFx.reduce((s, f) => s + (picks.get(f.fixture.id)?.total ?? 0), 0);
  const kickPassed = firstKick ? new Date(firstKick) <= now : false;

  const mainSlug = (() => {
    if (main.format === 'single') return season ? String(season) : null;
    if (!season || !round) return null;
    const phase = parseRound(round).phase ?? (now.getUTCMonth() >= 6 ? 'apertura' : 'clausura');
    return seasonSlug(main, { apiSeason: season, phase });
  })();
  const mainSeason = mainSlug ? { c: main, slug: mainSlug } : null;

  const mainName = competitionName(main, l);
  const pieces = await latestPieces(l, 4);
  const names = COMPETITIONS.map((c) => competitionName(c, l)).join(', ');
  const faq = t.faq(COMPETITIONS.length, names);

  const leaderOf = (g: { rows: { team: { name: string }; points: number }[] }[]) => g[0]?.rows[0] ?? null;
  const cardComps = [main, other, competitionById(128), competitionById(253)].filter(
    (c): c is Competition => !!c,
  );
  const leaders = new Map<number, { team: string; points: number } | null>([
    [main.id, leaderOf(standings) ? { team: nationName(leaderOf(standings)!.team.name, l), points: leaderOf(standings)!.points } : null],
    [other.id, leaderOf(otherStandings) ? { team: nationName(leaderOf(otherStandings)!.team.name, l), points: leaderOf(otherStandings)!.points } : null],
  ]);

  const top3 = scorers.slice(0, 3);
  const mainSeasonPath = (s: 'table' | 'scorers' | 'fixtures') =>
    mainSlug ? competitionPath(l, main.id, mainSlug, s) : null;

  const searched: { href: string; text: string }[] = [
    mainSeasonPath('table') ? { href: mainSeasonPath('table')!, text: t.tableOf(mainName) } : null,
    {
      href: h2hPath(l, { id: 2287, name: 'Club America' }, { id: 2278, name: 'Guadalajara Chivas' }),
      text: t.h2hLabel,
    },
    whereToWatchPath(l, 262, 'us') ? { href: whereToWatchPath(l, 262, 'us')!, text: t.watchMx } : null,
    transfersPath(l, main.id) ? { href: transfersPath(l, main.id)!, text: t.transfersOf(mainName) } : null,
  ].filter((x): x is { href: string; text: string } => !!x);

  const dayTab = 'rounded-full border px-4 py-2 text-sm font-bold transition-colors';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LocalTimeScript locale={intlLocale(l)} />
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        {/* Hero */}
        <section className="pt-4 pb-2 sm:pt-8">
          <Eyebrow tone="mint">{t.eyebrow}</Eyebrow>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.02] font-bold tracking-wide text-foreground uppercase sm:text-6xl">
            {t.h1}
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold text-muted-foreground">{t.heroP}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PillLink href={sectionPath('today', l)} variant="mint">{t.ctaToday}</PillLink>
            <SmartDownload variant="outline" className="px-6 py-3.5">{t.ctaApp}</SmartDownload>
          </div>
        </section>

        {/* Live now + open pool */}
        {live.length || poolHref ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {live.length ? (
              <section className={poolHref ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl">
                    <span aria-hidden className="h-3 w-3 rounded-full bg-live" />
                    {t.live}
                  </h2>
                  <Link href={sectionPath('live', l)} className="shrink-0 text-sm font-bold text-primary hover:underline">{t.liveAll}</Link>
                </div>
                <div className={`${CARD} divide-y divide-border overflow-hidden sm:grid sm:grid-cols-2 sm:divide-y-0`}>
                  {live.map((f) => (
                    <div key={f.fixture.id} className="border-border sm:border-b sm:odd:border-r">
                      <MatchLine f={f} locale={l} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {poolHref ? (
              <section>
                <div className="mb-4">
                  <DisplayHeading className="text-2xl sm:text-3xl">{t.pool}</DisplayHeading>
                </div>
                <div className={`${CARD} p-5`}>
                  <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{mainName}</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-wide uppercase">{round ? roundLabel(round, l, main) : ''}</p>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">
                    {firstKick && !kickPassed ? (
                      <>
                        {t.poolRound}: <LocalTime iso={firstKick} locale={intlLocale(l)} />
                      </>
                    ) : (
                      t.poolStarted
                    )}
                  </p>
                  {roundPicks > 0 ? (
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {roundPicks.toLocaleString(intlLocale(l))} {t.poolPreds}
                    </p>
                  ) : null}
                  <PillLink href={poolHref} variant="mint" className="mt-4 w-full">{t.poolCta}</PillLink>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {/* League chips */}
        <section className="mt-8" aria-label={t.chips}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COMPETITIONS.slice(0, 12).map((c) => {
              const href = competitionPath(l, c.id);
              if (!href) return null;
              return (
                <span key={c.id} className="shrink-0">
                  <LeagueChip href={href}>{competitionName(c, l)}</LeagueChip>
                </span>
              );
            })}
          </div>
        </section>

        <AdSlot id="home-leaderboard-1" format="leaderboard" indexable />

        {/* Today */}
        <Block title={t.today}>
          <div className="mb-4 flex gap-2">
            <Link href={datePath(l, yIso)} className={`${dayTab} border-border text-muted-foreground hover:text-foreground`}>{t.yesterday}</Link>
            <span className={`${dayTab} border-primary bg-primary text-primary-foreground`} aria-current="date">{t.todayTab}</span>
            <Link href={datePath(l, tIso)} className={`${dayTab} border-border text-muted-foreground hover:text-foreground`}>{t.tomorrow}</Link>
          </div>
          <p className="mb-4 text-sm font-semibold text-muted-foreground">{longDateIn(now.toISOString(), zone, l)}</p>
          {todayAll.length === 0 ? (
            <p className="font-semibold text-muted-foreground">{t.noToday}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {[...board.entries()].slice(0, 6).map(([id, fxs]) => {
                const c = competitionById(id);
                return (
                  <div key={id} className={`${CARD} overflow-hidden`}>
                    <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3.5 py-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                        <Image src={fxs[0].league.logo} alt="" width={14} height={14} unoptimized className="h-3.5 w-3.5 object-contain" />
                      </span>
                      <h3 className="text-xs font-extrabold tracking-wide text-foreground uppercase">{c ? competitionName(c, l) : fxs[0].league.name}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {fxs.slice(0, 5).map((f) => (
                        <MatchLine key={f.fixture.id} f={f} locale={l} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {todayAll.length ? (
            <div className="mt-5">
              <PillLink href={sectionPath('today', l)} variant="outline">{t.todayAll(todayAll.length)}</PillLink>
            </div>
          ) : null}
        </Block>

        {/* Match of the day + scorers */}
        {featured || top3.length ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {featured ? (
              <section>
                <DisplayHeading className="mb-4 text-2xl sm:text-3xl">{t.featured}</DisplayHeading>
                <div className={`${CARD} p-5`}>
                  <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                    {featured.league.name} · <LocalTime iso={featured.fixture.date} locale={intlLocale(l)} style="time" />
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {([featured.teams.home, featured.teams.away] as const).map((tm, i) => (
                      <div key={tm.id} className={`flex min-w-0 flex-1 flex-col items-center gap-2 text-center ${i === 1 ? 'order-3' : ''}`}>
                        <Image src={tm.logo} alt="" width={56} height={56} unoptimized className="h-14 w-14 object-contain" />
                        <span className="text-sm font-extrabold text-foreground">{tm.name}</span>
                      </div>
                    ))}
                    <span className="order-2 font-display text-xl font-bold text-muted-foreground">VS</span>
                  </div>
                  <div className="mt-5">
                    <CommunitySplit split={featuredSplit} home={featured.teams.home.name} away={featured.teams.away.name} locale={l} compact />
                  </div>
                  <PillLink href={matchPath(l, featured)} variant="mint" className="mt-5 w-full">{t.featuredCta}</PillLink>
                </div>
              </section>
            ) : null}
            {top3.length ? (
              <section>
                <DisplayHeading className="mb-4 text-2xl sm:text-3xl">{`${t.scorers} ${mainName}`}</DisplayHeading>
                <ol className={`${CARD} divide-y divide-border`}>
                  {top3.map((p, i) => (
                    <li key={p.player.id}>
                      <Link href={playerPath(l, p.player)} className="flex items-center gap-3 p-3.5 transition-colors hover:bg-surface-2">
                        <span className="w-6 font-display text-xl font-bold text-muted-foreground">{i + 1}</span>
                        <Image src={p.player.photo} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-foreground">{p.player.name}</span>
                          <span className="block truncate text-xs font-semibold text-muted-foreground">{p.statistics[0]?.team.name}</span>
                        </span>
                        <span className="font-display text-xl font-bold text-primary">{p.statistics[0]?.goals.total ?? 0}</span>
                        <span className="sr-only">{t.goals}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
                {mainSeasonPath('scorers') ? (
                  <Link href={mainSeasonPath('scorers')!} className="mt-3 inline-block text-sm font-bold text-primary hover:underline">{t.allScorers}</Link>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}

        {/* Most searched */}
        <Block title={t.searched}>
          <div className="flex flex-wrap gap-2.5">
            {searched.map((x) => (
              <Link key={x.href} href={x.href} className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-surface-2">
                {x.text}
              </Link>
            ))}
          </div>
        </Block>

        {/* Tournaments */}
        <Block title={t.tournaments}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cardComps.map((c) => {
              const slug = slugFor(c, year, mainSeason);
              const lead = leaders.get(c.id) ?? null;
              const hub = competitionPath(l, c.id);
              const links = slug
                ? (
                    [['table', t.table], ['scorers', t.scorersLink], ['fixtures', t.calendar]] as [
                      'table' | 'scorers' | 'fixtures',
                      string,
                    ][]
                  ).flatMap(([s, label]) => {
                    const href = competitionPath(l, c.id, slug, s);
                    return href ? [{ label, href }] : [];
                  })
                : hub
                  ? [{ label: t.hub, href: hub }]
                  : [];
              return (
                <div key={c.id} className={`${CARD} p-4`}>
                  <h3 className="font-display text-lg font-bold tracking-wide uppercase">{competitionName(c, l)}</h3>
                  {lead ? (
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">
                      {t.leader}: <span className="font-extrabold text-foreground">{lead.team}</span> · {lead.points} pts
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-bold">
                    {links.map((x) => (
                      <Link key={x.href} href={x.href} className="text-primary hover:underline">{x.label}</Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Block>

        {/* Editorial: renders nothing until content exists */}
        {pieces.length ? (
          <Block title={t.reports}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pieces.map((p) => (
                <Link key={p.path} href={p.path} className={`${CARD} block p-4 transition-colors hover:bg-surface-2`}>
                  <p className="text-xs font-extrabold tracking-wide text-primary uppercase">{p.label}</p>
                  <h3 className="mt-2 font-bold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">{p.byline}</p>
                </Link>
              ))}
            </div>
          </Block>
        ) : null}

        <AdSlot id="home-leaderboard-2" format="leaderboard" indexable />

        {/* App promo */}
        <section className="mt-10 rounded-3xl bg-band p-6 sm:p-10">
          <DisplayHeading className="text-3xl sm:text-4xl">{t.promoH}</DisplayHeading>
          <p className="mt-3 max-w-2xl font-semibold text-muted-foreground">{t.promoP}</p>
          <div className="mt-6">
            <InstallCTA labels={{ open: t.open, ios: t.ios, android: t.android }} />
          </div>
        </section>

        {/* Country hubs */}
        <Block title={t.countries}>
          <div className="flex flex-wrap gap-2.5">
            {HUB_COUNTRIES.map((c) => (
              <Link key={c} href={hubPath(l, c)} className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-surface-2">
                {HUB_COUNTRY_INFO[c].flag} {t.countryOf(HUB_COUNTRY_INFO[c].name[l])}
              </Link>
            ))}
          </div>
        </Block>

        {/* Definition + FAQ */}
        <section className="mt-10 max-w-3xl">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.whatH}</h2>
          <p className="mt-3 leading-relaxed font-semibold text-muted-foreground">{t.what(COMPETITIONS.length)}</p>
        </section>
        <div className="max-w-3xl">
          <FaqSection title={t.faqH} entries={faq} pagePath={`/${l}`} />
        </div>
      </main>
      <SiteFooter locale={l} />
    </div>
  );
}
