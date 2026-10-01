import type { Metadata } from 'next';
import { localizeDeep, localizeFixtures } from '@/lib/nations';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import type { Fixture } from '@/lib/api-football';
import { competitionById, competitionName } from '@/lib/competitions';
import { competitionPath, homePath, refereePath, refereeSlug } from '@/lib/routes';
import { absolute, pageMetadata, type Crumb } from '@/lib/seo';
import { fill } from '@/lib/site';
import { longDateIn, timeIn } from '@/lib/timezones';
import { JsonLd } from '@/components/JsonLd';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { InstallCTA } from '@/components/InstallCTA';
import { AdSlot } from '@/components/ads/AdSlot';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { DisplayHeading } from '@/components/revamp/ui';
import { findReferee, type RefereeRecord } from '@/components/h2h/referee-data';
import { disciplineStats, sampleStats } from '@/components/h2h/sample-stats';
import {
  asLocale,
  countryText,
  dateText,
  fitTitle,
  getFixtureDetails,
  isPlayed,
  isUpcoming,
  leagueText,
  nowMs,
  num,
  pct,
  scoreText,
  zoneForLeague,
  type L,
} from '@/components/h2h/shared';
import { FactList, MatchRow, Panel, SplitBar, StatTile, SummaryBox } from '@/components/h2h/ui';

// Referee page: /es/arbitro/{name-slug}. No id exists for referees anywhere
// in the provider, so the slug IS the key: findReferee() scans the covered
// domestic leagues' current-season fixture lists (and the previous season
// where he shows up) for matches whose referee slugs to it.
//
// Discipline numbers (cards, penalties) come from the event feeds of his last
// ≤ 10 finished matches — one batched request — and always print that sample
// size. Indexable from 5 matches found (plan A4); below, noindex,follow.
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

const INDEX_MIN_MATCHES = 5;
const DETAIL_SAMPLE = 10;
const LIST_VISIBLE = 10;

const STR = {
  es: {
    home: 'Inicio',
    eyebrow: 'Árbitro',
    job: 'Árbitro de fútbol',
    tMatches: 'partidos dirigidos',
    tYellow: 'amarillas por partido',
    tRed: 'rojas en total',
    tPens: 'penales señalados',
    summary: 'En resumen',
    sTotal: '{name} dirigió {nReg} de {comps} {span}.',
    span: ['el {from}', 'entre el {from} y el {to}'],
    nReg: ['{n} partido registrado', '{n} partidos registrados'],
    nDir: ['{n} partido dirigido', '{n} partidos dirigidos'],
    lastM: ['su último partido', 'sus últimos {m} partidos'],
    yW: ['{n} amarilla', '{n} amarillas'],
    rW: ['{n} roja', '{n} rojas'],
    pW: ['{n} penal', '{n} penales'],
    sCards: 'En {lastM} con datos mostró {yW} y {rW} ({ypm} amarillas por partido) y señaló {pW}.',
    sHome: 'El local ganó el {hp} % de los partidos que dirigió.',
    sLast: 'Su último partido fue {home} {score} {away}, el {date}.',
    sNext: 'Tiene designado el {home} vs {away} del {date}.',
    upcoming: 'Próximos partidos designados',
    matches: 'Partidos dirigidos',
    older: 'Ver {n} partidos anteriores',
    cardsRow: '{y} TA · {r} TR',
    discipline: 'Tarjetas y penales',
    dScope: 'Sobre {lastM} con eventos registrados.',
    dYellow: 'Tarjetas amarillas',
    dRed: 'Tarjetas rojas',
    dPens: 'Penales señalados',
    dHome: 'Tarjetas al local',
    dAway: 'Tarjetas al visitante',
    perMatch: '{total} ({avg} por partido)',
    results: 'Resultados en sus partidos',
    legend: 'Local · empate · visitante',
    split: 'Local {h} %, empate {d} %, visitante {a} %',
    rScope: 'Sobre los {n} partidos terminados que dirigió en la muestra.',
    competitions: 'Torneos',
    matchesN: ['{n} partido', '{n} partidos'],
    faq: 'Preguntas frecuentes',
    qCards: '¿Cuántas tarjetas saca {name} por partido?',
    aCards: 'En {lastM} con datos, {name} mostró {yW} y {rW}: un promedio de {ypm} amarillas y {rpm} rojas por partido.',
    qPens: '¿Cuántos penales marca {name}?',
    aPens: 'En {lastM} con datos, {name} señaló {pW}, {ppm} por partido.',
    qWhich: '¿Qué partidos ha dirigido {name}?',
    aWhich: '{name} dirigió {nReg} de {comps} {span}. El más reciente fue {home} {score} {away}.',
    qCountry: '¿De qué país es el árbitro {name}?',
    aCountry: '{name} es árbitro de {country} y dirige en {comps}.',
    and: 'y',
    scope: 'Partidos de liga registrados en las temporadas que cubrimos; no incluye copas internacionales ni partidos de selecciones. Golify no transmite partidos.',
    follow: 'Sigue los partidos en vivo, con alertas de gol, tarjetas y alineaciones, en la app Golify.',
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    titles: ['{name}: árbitro, tarjetas y partidos dirigidos', '{name}: árbitro, tarjetas y partidos', '{name}: árbitro'],
    desc: '{name}, árbitro de {comps}: {nDir}{cardsText}. Tarjetas, penales, resultados y próximos partidos designados.',
    descCards: ', {ypm} amarillas por partido en {lastM}',
  },
  pt: {
    home: 'Início',
    eyebrow: 'Árbitro',
    job: 'Árbitro de futebol',
    tMatches: 'jogos apitados',
    tYellow: 'amarelos por jogo',
    tRed: 'vermelhos no total',
    tPens: 'pênaltis marcados',
    summary: 'Resumo',
    sTotal: '{name} apitou {nReg} da competição {comps} {span}.',
    span: ['em {from}', 'entre {from} e {to}'],
    nReg: ['{n} jogo registrado', '{n} jogos registrados'],
    nDir: ['{n} jogo apitado', '{n} jogos apitados'],
    lastM: ['seu último jogo', 'seus últimos {m} jogos'],
    yW: ['{n} amarelo', '{n} amarelos'],
    rW: ['{n} vermelho', '{n} vermelhos'],
    pW: ['{n} pênalti', '{n} pênaltis'],
    sCards: 'Em {lastM} com dados, mostrou {yW} e {rW} ({ypm} amarelos por jogo) e marcou {pW}.',
    sHome: 'O mandante venceu {hp} % dos jogos que ele apitou.',
    sLast: 'O último jogo foi {home} {score} {away}, em {date}.',
    sNext: 'Está escalado para {home} x {away}, em {date}.',
    upcoming: 'Próximos jogos escalados',
    matches: 'Jogos apitados',
    older: 'Ver {n} jogos anteriores',
    cardsRow: '{y} CA · {r} CV',
    discipline: 'Cartões e pênaltis',
    dScope: 'Sobre {lastM} com eventos registrados.',
    dYellow: 'Cartões amarelos',
    dRed: 'Cartões vermelhos',
    dPens: 'Pênaltis marcados',
    dHome: 'Cartões ao mandante',
    dAway: 'Cartões ao visitante',
    perMatch: '{total} ({avg} por jogo)',
    results: 'Resultados nos jogos dele',
    legend: 'Mandante · empate · visitante',
    split: 'Mandante {h} %, empate {d} %, visitante {a} %',
    rScope: 'Sobre os {n} jogos encerrados que ele apitou na amostra.',
    competitions: 'Competições',
    matchesN: ['{n} jogo', '{n} jogos'],
    faq: 'Perguntas frequentes',
    qCards: 'Quantos cartões {name} dá por jogo?',
    aCards: 'Em {lastM} com dados, {name} mostrou {yW} e {rW}: média de {ypm} amarelos e {rpm} vermelhos por jogo.',
    qPens: 'Quantos pênaltis {name} marca?',
    aPens: 'Em {lastM} com dados, {name} marcou {pW}, {ppm} por jogo.',
    qWhich: 'Quais jogos {name} apitou?',
    aWhich: '{name} apitou {nReg} da competição {comps} {span}. O mais recente foi {home} {score} {away}.',
    qCountry: 'De que país é o árbitro {name}?',
    aCountry: '{name} é árbitro {country} e apita na competição {comps}.',
    and: 'e',
    scope: 'Jogos de liga registrados nas temporadas que cobrimos; não inclui copas internacionais nem jogos de seleções. O Golify não transmite jogos.',
    follow: 'Acompanhe os jogos ao vivo, com alertas de gol, cartões e escalações, no app Golify.',
    open: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    titles: ['{name}: árbitro, cartões e jogos apitados', '{name}: árbitro, cartões e jogos', '{name}: árbitro'],
    desc: '{name}, árbitro da competição {comps}: {nDir}{cardsText}. Cartões, pênaltis, resultados e próximos jogos escalados.',
    descCards: ', {ypm} amarelos por jogo em {lastM}',
  },
  en: {
    home: 'Home',
    eyebrow: 'Referee',
    job: 'Football referee',
    tMatches: 'matches refereed',
    tYellow: 'yellows per game',
    tRed: 'reds in total',
    tPens: 'penalties awarded',
    summary: 'In short',
    sTotal: '{name} has refereed {nReg} in the {comps} {span}.',
    span: ['on {from}', 'between {from} and {to}'],
    nReg: ['{n} match on record', '{n} matches on record'],
    nDir: ['{n} match refereed', '{n} matches refereed'],
    lastM: ['his last match', 'his last {m} matches'],
    yW: ['{n} yellow card', '{n} yellow cards'],
    rW: ['{n} red card', '{n} red cards'],
    pW: ['{n} penalty', '{n} penalties'],
    sCards: 'In {lastM} with data he showed {yW} and {rW} ({ypm} yellows per game) and awarded {pW}.',
    sHome: 'The home side won {hp} % of the matches he refereed.',
    sLast: 'His latest match was {home} {score} {away} on {date}.',
    sNext: 'He is assigned to {home} vs {away} on {date}.',
    upcoming: 'Upcoming assignments',
    matches: 'Matches refereed',
    older: 'Show {n} earlier matches',
    cardsRow: '{y} YC · {r} RC',
    discipline: 'Cards and penalties',
    dScope: 'Over {lastM} with recorded events.',
    dYellow: 'Yellow cards',
    dRed: 'Red cards',
    dPens: 'Penalties awarded',
    dHome: 'Cards to the home side',
    dAway: 'Cards to the away side',
    perMatch: '{total} ({avg} per game)',
    results: 'Results in his matches',
    legend: 'Home · draw · away',
    split: 'Home {h} %, draw {d} %, away {a} %',
    rScope: 'Over the {n} finished matches he refereed in the sample.',
    competitions: 'Competitions',
    matchesN: ['{n} match', '{n} matches'],
    faq: 'Frequently asked questions',
    qCards: 'How many cards does {name} show per game?',
    aCards: 'In {lastM} with data, {name} showed {yW} and {rW}: an average of {ypm} yellows and {rpm} reds per game.',
    qPens: 'How many penalties does {name} award?',
    aPens: 'In {lastM} with data, {name} awarded {pW}, {ppm} per game.',
    qWhich: 'Which matches has {name} refereed?',
    aWhich: '{name} has refereed {nReg} in the {comps} {span}. The latest was {home} {score} {away}.',
    qCountry: 'Where is referee {name} from?',
    aCountry: '{name} is a referee from {country} who officiates in the {comps}.',
    and: 'and',
    scope: 'League matches on record in the seasons we cover; international cups and national-team games are not included. Golify does not stream matches.',
    follow: 'Follow matches live, with goal and card alerts and lineups, in the Golify app.',
    open: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    titles: ['{name}: referee stats, cards and matches', '{name}: referee stats and matches', '{name}: referee'],
    desc: '{name}, {comps} referee: {nDir}{cardsText}. Cards, penalties, results and upcoming assignments.',
    descCards: ', {ypm} yellows per game in {lastM}',
  },
} as const;

// `findReferee` is strict (a failed list throws → last good ISR copy).
// Shared between generateMetadata and the page through React's cache.
const load = cache(async (slug: string) => findReferee(refereeSlug(decoded(slug))));

/** A malformed escape ("%E0") would make decodeURIComponent throw → 500. */
function decoded(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const loadDetails = cache(async (ids: string) => getFixtureDetails(ids ? ids.split(',').map(Number) : []));

// Portuguese contracts the preposition with the country's article ("do
// México", "da Argentina"); countries not listed fall back to "de".
const PT_ARTICLE: Record<string, string> = {
  México: 'do', Brasil: 'do', Chile: 'do', Peru: 'do', Equador: 'do', Uruguai: 'do', Paraguai: 'do',
  Argentina: 'da', Colômbia: 'da', Espanha: 'da', Inglaterra: 'da', Itália: 'da', Alemanha: 'da', França: 'da', 'Arábia Saudita': 'da',
  'Estados Unidos': 'dos',
};

function ptFrom(country: string): string {
  return `${PT_ARTICLE[country] ?? 'de'} ${country}`;
}

type Forms = readonly [string, string];

/** "1 partido registrado" / "9 partidos registrados": `{n}`/`{m}` filled. */
function pl(forms: Forms, n: number): string {
  return (n === 1 ? forms[0] : forms[1]).replace('{n}', String(n)).replace('{m}', String(n));
}

function listText(names: string[], and: string): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}

function compNames(r: RefereeRecord, locale: L): string[] {
  const seen = new Map<number, string>();
  for (const f of r.fixtures) {
    if (seen.has(f.league.id)) continue;
    const c = competitionById(f.league.id);
    seen.set(f.league.id, c ? competitionName(c, locale) : f.league.name);
  }
  return [...seen.values()];
}

function detailIds(r: RefereeRecord): string {
  return r.fixtures
    .filter(isPlayed)
    .slice(0, DETAIL_SAMPLE)
    .map((f) => f.fixture.id)
    .join(',');
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const res = await load(slug);
  if (!res || res.kind !== 'found') return {};
  const r = { ...res.record, fixtures: localizeFixtures(res.record.fixtures, locale) };
  const t = STR[locale];
  const disc = disciplineStats(localizeDeep(await loadDetails(detailIds(r)), locale));
  const v = {
    name: r.name,
    comps: listText(compNames(r, locale), t.and),
    nDir: pl(t.nDir, r.fixtures.filter(isPlayed).length),
    cardsText: disc.matches > 0 ? fill(t.descCards, { ypm: num(disc.yellow / disc.matches, locale, 1), lastM: pl(t.lastM, disc.matches) }) : '',
  };
  return pageMetadata({
    locale,
    path: (l) => refereePath(l, r.name),
    title: fitTitle(t.titles.map((x) => fill(x, v))),
    // Not fill(): the cards fragment starts with a separator fill would trim.
    description: t.desc.replace(/\{(\w+)\}/g, (_, k: keyof typeof v) => v[k] ?? ''),
    noindex: r.fixtures.filter(isPlayed).length < INDEX_MIN_MATCHES,
    type: 'profile',
  });
}

export default async function RefereePage({ params }: { params: Promise<Params> }) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const res = await load(slug);
  if (!res) notFound();
  if (res.kind === 'redirect') permanentRedirect(refereePath(locale, res.slug));
  const r = { ...res.record, fixtures: localizeFixtures(res.record.fixtures, locale) };
  const path = refereePath(locale, r.name);
  // Uppercase, accents or other spellings of the same slug: one hop.
  if (decoded(slug) !== r.slug) permanentRedirect(path);

  const t = STR[locale];
  const now = nowMs();
  const played = r.fixtures.filter(isPlayed);
  const upcoming = r.fixtures.filter((f) => isUpcoming(f, now)).sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  if (played.length === 0 && upcoming.length === 0) notFound();

  const indexable = played.length >= INDEX_MIN_MATCHES;
  // Event feeds for the discipline numbers. Optional: on failure the block is
  // dropped, never shown as "0 cards".
  const details = localizeDeep(await loadDetails(detailIds(r)), locale);
  const disc = disciplineStats(details);
  const stats = sampleStats(played);
  const comps = compNames(r, locale);
  const zoneOf = (f: Fixture) => zoneForLeague(f.league.id, locale);
  const newest = played[0] ?? null;
  const oldest = played[played.length - 1] ?? null;
  const next = upcoming[0] ?? null;
  const m = disc.matches;
  const avg = (x: number, d = 1) => num(m ? x / m : 0, locale, d);
  const span =
    newest && oldest
      ? fill(pl(t.span, played.length), {
          from: dateText(oldest.fixture.date, zoneOf(oldest).zone, locale),
          to: dateText(newest.fixture.date, zoneOf(newest).zone, locale),
        })
      : '';
  const v = { name: r.name, comps: listText(comps, t.and), nReg: pl(t.nReg, played.length), span };
  const cw = {
    lastM: pl(t.lastM, m),
    yW: pl(t.yW, disc.yellow),
    rW: pl(t.rW, disc.red),
    pW: pl(t.pW, disc.penalties),
  };
  const country = countryText(r.country, locale);

  // ---- Generated summary ---------------------------------------------------
  const sentences: string[] = [];
  if (newest && oldest) {
    sentences.push(fill(t.sTotal, v));
  }
  if (m > 0) sentences.push(fill(t.sCards, { ...cw, ypm: avg(disc.yellow) }));
  if (stats.played >= 5) sentences.push(fill(t.sHome, { hp: String(pct(stats.homeWins, stats.played)) }));
  // With one match the first sentence already names it.
  if (newest && played.length > 1) {
    sentences.push(
      fill(t.sLast, {
        home: newest.teams.home.name,
        away: newest.teams.away.name,
        score: scoreText(newest, locale),
        date: dateText(newest.fixture.date, zoneOf(newest).zone, locale),
      }),
    );
  }
  if (next) {
    sentences.push(
      fill(t.sNext, { home: next.teams.home.name, away: next.teams.away.name, date: longDateIn(next.fixture.date, zoneOf(next).zone, locale) }),
    );
  }

  // ---- FAQ ------------------------------------------------------------------
  const faq: [string, string][] = [];
  if (m > 0) {
    faq.push([
      fill(t.qCards, v),
      fill(t.aCards, { ...v, ...cw, ypm: avg(disc.yellow), rpm: avg(disc.red, 2) }),
    ]);
    faq.push([fill(t.qPens, v), fill(t.aPens, { ...v, ...cw, ppm: avg(disc.penalties, 2) })]);
  }
  if (newest && oldest) {
    faq.push([
      fill(t.qWhich, v),
      fill(t.aWhich, {
        ...v,
        home: newest.teams.home.name,
        away: newest.teams.away.name,
        score: scoreText(newest, locale),
      }),
    ]);
  }
  if (country) faq.push([fill(t.qCountry, v), fill(t.aCountry, { ...v, country: locale === 'pt' ? ptFrom(country) : country })]);

  // ---- Breadcrumb: Inicio › {main competition} › referee ------------------
  const crumbs: Crumb[] = [{ name: t.home, path: homePath(locale) }];
  const mainComp = stats.byLeague[0] ? competitionById(stats.byLeague[0].leagueId) : null;
  const mainCompPath = mainComp ? competitionPath(locale, mainComp.id) : null;
  if (mainComp && mainCompPath) crumbs.push({ name: competitionName(mainComp, locale), path: mainCompPath });
  crumbs.push({ name: r.name });

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${absolute(path)}#person`,
    name: r.name,
    jobTitle: t.job,
    url: absolute(path),
    ...(r.country ? { nationality: { '@type': 'Country', name: r.country.replace(/-/g, ' ') } } : {}),
  };

  const visible = played.slice(0, LIST_VISIBLE);
  const older = played.slice(LIST_VISIBLE);
  const cardsFor = (f: Fixture) => {
    const row = disc.perFixture.get(f.fixture.id);
    return row ? <span className="font-bold text-foreground">{fill(t.cardsRow, { y: String(row.yellow), r: String(row.red) })}</span> : undefined;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={personLd} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />

        <section className="mt-5 flex flex-col gap-6 rounded-3xl border border-border bg-band p-5 sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{t.eyebrow}</p>
            <DisplayHeading as="h1" className="mt-2 text-3xl sm:text-5xl">
              {r.name}
            </DisplayHeading>
            <p className="mt-2 font-semibold text-muted-foreground">{[country, listText(comps, t.and)].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile value={String(played.length)} label={t.tMatches} />
            {m > 0 ? <StatTile value={avg(disc.yellow)} label={t.tYellow} /> : null}
            {m > 0 ? <StatTile value={String(disc.red)} label={t.tRed} /> : null}
            {m > 0 ? <StatTile value={String(disc.penalties)} label={t.tPens} /> : null}
          </div>
          {m > 0 ? <p className="-mt-3 text-xs font-semibold text-muted-foreground">{fill(t.dScope, cw)}</p> : null}
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-6">
            <SummaryBox title={t.summary} sentences={sentences} />

            {upcoming.length > 0 ? (
              <Panel title={t.upcoming}>
                {upcoming.map((f) => (
                  <MatchRow
                    key={f.fixture.id}
                    f={f}
                    locale={locale}
                    zone={zoneOf(f).zone}
                    extra={
                      f.fixture.status.short === 'TBD' ? undefined : (
                        <span className="font-bold text-foreground">
                          {timeIn(f.fixture.date, zoneOf(f).zone, locale)} ({zoneOf(f).label[locale]})
                        </span>
                      )
                    }
                  />
                ))}
              </Panel>
            ) : null}

            {played.length > 0 ? (
              <Panel title={t.matches}>
                <div>
                  {visible.map((f) => (
                    <MatchRow key={f.fixture.id} f={f} locale={locale} zone={zoneOf(f).zone} extra={cardsFor(f)} />
                  ))}
                </div>
                {older.length > 0 ? (
                  <details className="mt-2 rounded-xl border border-border">
                    <summary className="cursor-pointer px-4 py-3 text-center text-sm font-bold">
                      {fill(t.older, { n: String(older.length) })}
                    </summary>
                    <div className="px-2 pb-2">
                      {older.map((f) => (
                        <MatchRow key={f.fixture.id} f={f} locale={locale} zone={zoneOf(f).zone} />
                      ))}
                    </div>
                  </details>
                ) : null}
              </Panel>
            ) : null}

            <AdSlot id="referee-after-matches" format="leaderboard" indexable={indexable} />

            <FaqSection title={t.faq} entries={faq} pagePath={path} className="mt-2" />
            <p className="text-xs font-semibold text-muted-foreground">{t.scope}</p>
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            {m > 0 ? (
              <Panel title={t.discipline}>
                <FactList
                  rows={[
                    [t.dYellow, fill(t.perMatch, { total: String(disc.yellow), avg: avg(disc.yellow) })],
                    [t.dRed, fill(t.perMatch, { total: String(disc.red), avg: avg(disc.red, 2) })],
                    [t.dPens, fill(t.perMatch, { total: String(disc.penalties), avg: avg(disc.penalties, 2) })],
                    [t.dHome, fill(t.perMatch, { total: String(disc.homeCards), avg: avg(disc.homeCards) })],
                    [t.dAway, fill(t.perMatch, { total: String(disc.awayCards), avg: avg(disc.awayCards) })],
                  ]}
                />
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{fill(t.dScope, cw)}</p>
              </Panel>
            ) : null}

            {stats.played >= 3 ? (
              <Panel title={t.results}>
                <p className="text-xs font-semibold text-muted-foreground">{t.legend}</p>
                <div className="mt-2 flex justify-between text-sm font-bold tabular-nums">
                  <span>{stats.homeWins}</span>
                  <span className="text-muted-foreground">{stats.draws}</span>
                  <span>{stats.awayWins}</span>
                </div>
                <div className="mt-1.5">
                  <SplitBar
                    a={stats.homeWins}
                    d={stats.draws}
                    b={stats.awayWins}
                    label={fill(t.split, {
                      h: String(pct(stats.homeWins, stats.played)),
                      d: String(pct(stats.draws, stats.played)),
                      a: String(pct(stats.awayWins, stats.played)),
                    })}
                  />
                </div>
                <p className="mt-3 text-xs font-semibold text-muted-foreground">{fill(t.rScope, { n: String(stats.played) })}</p>
              </Panel>
            ) : null}

            {stats.byLeague.length > 0 ? (
              <Panel title={t.competitions}>
                <ul className="divide-y divide-border">
                  {stats.byLeague.map((c) => {
                    const cp = competitionPath(locale, c.leagueId);
                    const label = leagueText(c.sample, locale);
                    const count = (c.n === 1 ? t.matchesN[0] : t.matchesN[1]).replace('{n}', String(c.n));
                    return (
                      <li key={c.leagueId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        {cp ? (
                          <Link href={cp} className="font-semibold hover:text-primary">
                            {label}
                          </Link>
                        ) : (
                          <span className="font-semibold">{label}</span>
                        )}
                        <span className="shrink-0 font-bold text-muted-foreground tabular-nums">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ) : null}
          </aside>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
          <p className="leading-relaxed font-semibold text-muted-foreground">{t.follow}</p>
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
