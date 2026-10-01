import type { Metadata } from 'next';
import { localizeDeep, localizeFixtures } from '@/lib/nations';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { apiFootballGet, getVenue, TTL, type Fixture, type TeamInfo, type TeamRef, type Venue } from '@/lib/api-football';
import { competitionPath, homePath, matchPath, stadiumPath, teamPath, type RouteLocale } from '@/lib/routes';
import { absolute, pageMetadata, type Crumb } from '@/lib/seo';
import { fill } from '@/lib/site';
import { idFromSlug, slugify } from '@/lib/slug';
import { longDateIn, timeIn } from '@/lib/timezones';
import { JsonLd } from '@/components/JsonLd';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { InstallCTA } from '@/components/InstallCTA';
import { AdSlot } from '@/components/ads/AdSlot';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { DisplayHeading } from '@/components/revamp/ui';
import { sampleStats } from '@/components/h2h/sample-stats';
import {
  asLocale,
  countryText,
  dateText,
  fitTitle,
  hubForCountry,
  isPlayed,
  isUpcoming,
  leagueText,
  marketZone,
  nowMs,
  num,
  pct,
  resultFor,
  scoreText,
  type L,
} from '@/components/h2h/shared';
import { Crest, FactList, MatchRow, Panel, SplitBar, StatTile, SummaryBox } from '@/components/h2h/ui';

// Stadium page: /es/estadio/{slug}-{venueId}. The venue record (capacity,
// address, surface, photo) comes from /venues; everything else is derived
// from the matches the provider files under that venue id: the last 40
// played there and the next 10 scheduled. Stats always carry their sample
// size ("en los últimos 31 partidos registrados"), never "all-time".
//
// Indexable from 5 finished matches in the sample (plan A4); below that it
// renders as noindex,follow. ISR: regenerated daily (the upcoming list is
// cached 6 h, which lets a kickoff change land sooner).
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

const INDEX_MIN_MATCHES = 5;
const PAST_SAMPLE = 40;
const UPCOMING = 10;
const LIST_VISIBLE = 10;

const SURFACE: Record<string, Record<L, string>> = {
  grass: { es: 'Pasto natural', pt: 'Grama natural', en: 'Natural grass' },
  'artificial turf': { es: 'Pasto sintético', pt: 'Grama sintética', en: 'Artificial turf' },
  artificial: { es: 'Pasto sintético', pt: 'Grama sintética', en: 'Artificial turf' },
  hybrid: { es: 'Pasto híbrido', pt: 'Grama híbrida', en: 'Hybrid grass' },
};

const STR = {
  es: {
    home: 'Inicio',
    eyebrow: 'Estadio',
    alias: 'En los partidos recientes figura como {alias}.',
    capacity: 'capacidad',
    surface: 'superficie',
    city: 'ciudad',
    tPlayed: 'partidos registrados',
    tGpm: 'goles por partido',
    tHome: 'victorias del local',
    summary: 'En resumen',
    sIntro: 'El {name} está en {place}.',
    sCap: 'Tiene capacidad para {cap} espectadores.',
    sHomeOne: 'Es la casa de {teams}.',
    sHomeMany: 'Ahí juegan de local {teams}.',
    sStats: 'En los últimos {n} partidos registrados en el estadio se marcaron {avg} goles por partido y el local ganó el {hp} %.',
    sTeam: '{team} suma {w} victorias, {d} empates y {l} derrotas en casa en esa muestra.',
    sNext: 'El próximo partido es {home} vs {away}, el {date} ({competition}).',
    facts: 'Ficha del estadio',
    fName: 'Nombre',
    fAlias: 'Nombre en partidos recientes',
    fAddress: 'Dirección',
    fCity: 'Ciudad',
    fCountry: 'País',
    fCapacity: 'Capacidad',
    fSurface: 'Superficie',
    people: '{n} espectadores',
    homeTeams: 'Equipos locales',
    homeRecord: '{w} G · {d} E · {l} P en casa ({n})',
    upcoming: 'Próximos partidos en el estadio',
    localTime: '{time} h ({zone})',
    timeNote: 'Horarios en hora de {zone}.',
    recent: 'Últimos partidos en el estadio',
    older: 'Ver {n} partidos anteriores',
    won: 'Ganó {team}',
    draw: 'Empate',
    stats: 'Estadísticas en el estadio',
    statsScope: 'Sobre los últimos {n} partidos terminados que tenemos registrados en el estadio.',
    split: 'Local {h} %, empate {d} %, visitante {a} %',
    legend: 'Local · empate · visitante',
    biggest: 'Mayor diferencia',
    competitions: 'Torneos jugados aquí',
    matchesN: ['{n} partido', '{n} partidos'],
    faq: 'Preguntas frecuentes',
    qCap: '¿Cuál es la capacidad del {name}?',
    aCap: 'El {name} tiene capacidad para {cap} espectadores.',
    qWhere: '¿Dónde está el {name}?',
    aWhere: 'El {name} está en {place}.',
    qWho: '¿Qué equipo juega de local en el {name}?',
    aWhoOne: '{teams} juega de local en el {name}.',
    aWhoMany: 'En el {name} juegan de local {teams}.',
    qNext: '¿Cuándo es el próximo partido en el {name}?',
    aNext: 'El próximo partido es {home} vs {away}, el {date} a las {time} (hora de {zone}), por {competition}.',
    qGoals: '¿Cuántos goles se marcan en el {name}?',
    aGoals: 'En los últimos {n} partidos registrados en el {name} se marcaron {g} goles, {avg} por partido. El local ganó {hw}, hubo {d} empates y el visitante ganó {aw}.',
    and: 'y',
    source: 'Datos del estadio y de los partidos registrados en él. Golify no transmite partidos.',
    follow: 'Sigue los partidos del {name} en vivo, con alertas de gol y alineaciones, en la app Golify.',
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    titles: ['{name}: capacidad, partidos y próximos juegos', '{name}: capacidad y partidos', '{name}'],
    desc: '{name}{inCity}: {capText}casa de {teams}. Próximos partidos con horario, últimos resultados y estadísticas del estadio.',
    descNoTeam: '{name}{inCity}: {capText}próximos partidos con horario, últimos resultados y estadísticas del estadio.',
    capDesc: 'capacidad para {cap} espectadores, ',
  },
  pt: {
    home: 'Início',
    eyebrow: 'Estádio',
    alias: 'Nos jogos recentes aparece como {alias}.',
    capacity: 'capacidade',
    surface: 'gramado',
    city: 'cidade',
    tPlayed: 'jogos registrados',
    tGpm: 'gols por jogo',
    tHome: 'vitórias do mandante',
    summary: 'Resumo',
    sIntro: 'O {name} fica em {place}.',
    sCap: 'Tem capacidade para {cap} torcedores.',
    sHomeOne: 'É a casa do {teams}.',
    sHomeMany: 'Ali mandam seus jogos {teams}.',
    sStats: 'Nos últimos {n} jogos registrados no estádio, a média foi de {avg} gols por jogo e o mandante venceu {hp} %.',
    sTeam: 'O {team} soma {w} vitórias, {d} empates e {l} derrotas em casa nessa amostra.',
    sNext: 'O próximo jogo é {home} x {away}, em {date} ({competition}).',
    facts: 'Ficha do estádio',
    fName: 'Nome',
    fAlias: 'Nome nos jogos recentes',
    fAddress: 'Endereço',
    fCity: 'Cidade',
    fCountry: 'País',
    fCapacity: 'Capacidade',
    fSurface: 'Gramado',
    people: '{n} torcedores',
    homeTeams: 'Times mandantes',
    homeRecord: '{w} V · {d} E · {l} D em casa ({n})',
    upcoming: 'Próximos jogos no estádio',
    localTime: '{time} ({zone})',
    timeNote: 'Horários de {zone}.',
    recent: 'Últimos jogos no estádio',
    older: 'Ver {n} jogos anteriores',
    won: '{team} venceu',
    draw: 'Empate',
    stats: 'Estatísticas no estádio',
    statsScope: 'Sobre os últimos {n} jogos encerrados que temos registrados no estádio.',
    split: 'Mandante {h} %, empate {d} %, visitante {a} %',
    legend: 'Mandante · empate · visitante',
    biggest: 'Maior diferença',
    competitions: 'Competições disputadas aqui',
    matchesN: ['{n} jogo', '{n} jogos'],
    faq: 'Perguntas frequentes',
    qCap: 'Qual é a capacidade do {name}?',
    aCap: 'O {name} tem capacidade para {cap} torcedores.',
    qWhere: 'Onde fica o {name}?',
    aWhere: 'O {name} fica em {place}.',
    qWho: 'Qual time manda seus jogos no {name}?',
    aWhoOne: 'O {teams} manda seus jogos no {name}.',
    aWhoMany: 'No {name} mandam seus jogos {teams}.',
    qNext: 'Quando é o próximo jogo no {name}?',
    aNext: 'O próximo jogo é {home} x {away}, em {date}, às {time} (horário de {zone}), pela competição {competition}.',
    qGoals: 'Quantos gols saem no {name}?',
    aGoals: 'Nos últimos {n} jogos registrados no {name} saíram {g} gols, média de {avg} por jogo. O mandante venceu {hw}, houve {d} empates e o visitante venceu {aw}.',
    and: 'e',
    source: 'Dados do estádio e dos jogos registrados nele. O Golify não transmite jogos.',
    follow: 'Acompanhe os jogos do {name} ao vivo, com alertas de gol e escalações, no app Golify.',
    open: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    titles: ['{name}: capacidade, jogos e próximas partidas', '{name}: capacidade e jogos', '{name}'],
    desc: '{name}{inCity}: {capText}casa do {teams}. Próximos jogos com horário, últimos resultados e estatísticas do estádio.',
    descNoTeam: '{name}{inCity}: {capText}próximos jogos com horário, últimos resultados e estatísticas do estádio.',
    capDesc: 'capacidade para {cap} torcedores, ',
  },
  en: {
    home: 'Home',
    eyebrow: 'Stadium',
    alias: 'Recent fixtures list it as {alias}.',
    capacity: 'capacity',
    surface: 'surface',
    city: 'city',
    tPlayed: 'matches on record',
    tGpm: 'goals per game',
    tHome: 'home wins',
    summary: 'In short',
    sIntro: '{name} is in {place}.',
    sCap: 'It holds {cap} spectators.',
    sHomeOne: 'It is the home of {teams}.',
    sHomeMany: '{teams} play their home games here.',
    sStats: 'Across the last {n} matches on record at the stadium there were {avg} goals per game and the home side won {hp} %.',
    sTeam: '{team} have {w} wins, {d} draws and {l} defeats at home in that sample.',
    sNext: 'The next match is {home} vs {away} on {date} ({competition}).',
    facts: 'Stadium facts',
    fName: 'Name',
    fAlias: 'Name in recent fixtures',
    fAddress: 'Address',
    fCity: 'City',
    fCountry: 'Country',
    fCapacity: 'Capacity',
    fSurface: 'Surface',
    people: '{n} spectators',
    homeTeams: 'Home teams',
    homeRecord: '{w} W · {d} D · {l} L at home ({n})',
    upcoming: 'Upcoming matches at the stadium',
    localTime: '{time} ({zone})',
    timeNote: 'Times in {zone} time.',
    recent: 'Latest matches at the stadium',
    older: 'Show {n} earlier matches',
    won: '{team} won',
    draw: 'Draw',
    stats: 'Stadium stats',
    statsScope: 'Over the last {n} finished matches we have on record at the stadium.',
    split: 'Home {h} %, draw {d} %, away {a} %',
    legend: 'Home · draw · away',
    biggest: 'Widest margin',
    competitions: 'Competitions played here',
    matchesN: ['{n} match', '{n} matches'],
    faq: 'Frequently asked questions',
    qCap: 'What is the capacity of {name}?',
    aCap: '{name} holds {cap} spectators.',
    qWhere: 'Where is {name}?',
    aWhere: '{name} is in {place}.',
    qWho: 'Which team plays at {name}?',
    aWhoOne: '{teams} play their home games at {name}.',
    aWhoMany: '{teams} play their home games at {name}.',
    qNext: 'When is the next match at {name}?',
    aNext: 'The next match is {home} vs {away} on {date} at {time} ({zone} time), in the {competition}.',
    qGoals: 'How many goals are scored at {name}?',
    aGoals: 'Across the last {n} matches on record at {name} there were {g} goals, {avg} per game. The home side won {hw}, {d} ended level and the away side won {aw}.',
    and: 'and',
    source: 'Data from the stadium record and the matches on record there. Golify does not stream matches.',
    follow: 'Follow the matches at {name} live, with goal alerts and lineups, in the Golify app.',
    open: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    titles: ['{name}: capacity, fixtures and results', '{name}: capacity and fixtures', '{name}'],
    desc: '{name}{inCity}: {capText}home of {teams}. Upcoming fixtures with kickoff times, latest results and stadium stats.',
    descNoTeam: '{name}{inCity}: {capText}upcoming fixtures with kickoff times, latest results and stadium stats.',
    capDesc: 'capacity {cap}, ',
  },
} as const;

interface HomeTeam extends TeamRef {
  record: { n: number; w: number; d: number; l: number };
}

interface Loaded {
  venue: Venue;
  past: Fixture[];
  /** Name the newest fixture files the venue under, when it differs. */
  alias: string | null;
  city: string | null;
}

// The venue and its recent matches are the page's primary data: both are
// `strict`, so a failed call throws (ISR keeps the last good copy) instead of
// rendering a stadium with "no matches". Shared by metadata and page.
const load = cache(async (slug: string, locale: RouteLocale): Promise<Loaded | null> => {
  const id = idFromSlug(slug);
  if (!id) return null;
  const [venue, pastRaw] = await Promise.all([
    getVenue(id, { strict: true }),
    apiFootballGet<Fixture>('/fixtures', { venue: id, last: PAST_SAMPLE }, { revalidate: TTL.daily, strict: true }),
  ]);
  if (!venue) return null;
  const past = localizeFixtures([...pastRaw], locale).sort((a, b) => b.fixture.date.localeCompare(a.fixture.date));
  const newest = past.find((f) => f.fixture.venue.name);
  const alias = newest?.fixture.venue.name && slugify(newest.fixture.venue.name) !== slugify(venue.name) ? newest.fixture.venue.name : null;
  return { venue, past, alias, city: newest?.fixture.venue.city || venue.city };
});

function zoneFor(venue: Venue) {
  const hub = hubForCountry(venue.country);
  return hub ? marketZone(hub) : { zone: 'UTC', label: { es: 'UTC', pt: 'UTC', en: 'UTC' } };
}

function listText(names: string[], and: string): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}

/** Clubs that use the venue: the provider's own venue → teams index when it
 *  answers, else the sides that hosted at least 3 of the sampled matches. */
function homeTeams(teams: TeamInfo[], past: Fixture[]): HomeTeam[] {
  const played = past.filter(isPlayed);
  const recordFor = (id: number) => {
    const r = { n: 0, w: 0, d: 0, l: 0 };
    for (const f of played) {
      if (f.teams.home.id !== id) continue;
      r.n++;
      r[resultFor(f, id)]++;
    }
    return r;
  };
  const clubs = teams.filter((t) => !t.team.national).map((t) => ({ id: t.team.id, name: t.team.name, logo: t.team.logo }));
  let list: TeamRef[] = clubs;
  if (list.length === 0) {
    const counts = new Map<number, { team: TeamRef; n: number }>();
    for (const f of played) {
      const c = counts.get(f.teams.home.id) ?? { team: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo }, n: 0 };
      c.n++;
      counts.set(f.teams.home.id, c);
    }
    list = [...counts.values()].filter((c) => c.n >= 3).sort((a, b) => b.n - a.n).map((c) => c.team);
  }
  // Most home matches in the sample first: the main tenant leads.
  return list.map((t) => ({ ...t, record: recordFor(t.id) })).sort((a, b) => b.record.n - a.record.n);
}

function placeText(d: Loaded, locale: L): string {
  return [d.city, countryText(d.venue.country, locale)].filter(Boolean).join(', ');
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const d = await load(slug, locale);
  if (!d) return {};
  const t = STR[locale];
  const teams = localizeDeep(await apiFootballGet<TeamInfo>('/teams', { venue: d.venue.id }, { revalidate: TTL.weekly }), locale);
  const tenants = homeTeams(teams, d.past).slice(0, 2).map((x) => x.name);
  const place = placeText(d, locale);
  const v = {
    name: d.venue.name,
    inCity: place ? ` (${place})` : '',
    capText: d.venue.capacity ? fill(t.capDesc, { cap: num(d.venue.capacity, locale) }) + ' ' : '',
    teams: listText(tenants, t.and),
  };
  const played = d.past.filter(isPlayed).length;
  return pageMetadata({
    locale,
    path: (l) => stadiumPath(l, d.venue),
    title: fitTitle(t.titles.map((x) => fill(x, v))),
    description: fill(tenants.length ? t.desc : t.descNoTeam, v),
    noindex: played < INDEX_MIN_MATCHES,
    images: d.venue.image ? [{ url: d.venue.image, alt: d.venue.name }] : undefined,
  });
}

export default async function StadiumPage({ params }: { params: Promise<Params> }) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const d = await load(slug, locale);
  if (!d) notFound();
  const { venue, past, alias } = d;

  // Bare id, old name or a typo in the name: one hop to the canonical URL.
  const path = stadiumPath(locale, venue);
  if (path.split('/').pop() !== slug) permanentRedirect(path);

  const t = STR[locale];
  const now = nowMs();
  // Secondary data: a failed call drops its block, never prints "none".
  const [nextRaw, teamsRaw] = await Promise.all([
    apiFootballGet<Fixture>('/fixtures', { venue: venue.id, next: UPCOMING }, { revalidate: TTL.hours }),
    apiFootballGet<TeamInfo>('/teams', { venue: venue.id }, { revalidate: TTL.weekly }),
  ]);
  const upcoming = localizeFixtures(nextRaw, locale).filter((f) => isUpcoming(f, now)).sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  const teams = localizeDeep(teamsRaw, locale);
  const played = past.filter(isPlayed);
  // A venue record with nothing ever played or scheduled there is not a page.
  if (played.length === 0 && upcoming.length === 0) notFound();

  const indexable = played.length >= INDEX_MIN_MATCHES;
  const zone = zoneFor(venue);
  const tenants = homeTeams(teams, past);
  const stats = sampleStats(played);
  const n = stats.played;
  const place = placeText(d, locale);
  const capText = venue.capacity ? num(venue.capacity, locale) : null;
  const surface = venue.surface ? (SURFACE[venue.surface.toLowerCase()]?.[locale] ?? venue.surface) : null;
  const tenantNames = tenants.map((x) => x.name);
  const next = upcoming[0] ?? null;
  const v = { name: venue.name, place, cap: capText ?? '', teams: listText(tenantNames, t.and) };

  // ---- Generated summary ---------------------------------------------------
  const sentences: string[] = [];
  if (place) sentences.push(fill(t.sIntro, v));
  if (capText) sentences.push(fill(t.sCap, v));
  if (tenants.length === 1) sentences.push(fill(t.sHomeOne, v));
  else if (tenants.length > 1) sentences.push(fill(t.sHomeMany, v));
  if (n >= 3) {
    sentences.push(fill(t.sStats, { n: String(n), avg: num(stats.goals / n, locale, 1), hp: String(pct(stats.homeWins, n)) }));
  }
  const main = tenants[0];
  if (main && main.record.n >= 3) {
    sentences.push(fill(t.sTeam, { team: main.name, w: String(main.record.w), d: String(main.record.d), l: String(main.record.l) }));
  }
  if (next) {
    sentences.push(
      fill(t.sNext, {
        home: next.teams.home.name,
        away: next.teams.away.name,
        date: longDateIn(next.fixture.date, zone.zone, locale),
        competition: leagueText(next, locale),
      }),
    );
  }
  // No "nothing scheduled" sentence: an empty upcoming list from a failed call
  // looks exactly like a real empty one, so absence is never claimed.
  if (alias) sentences.push(fill(t.alias, { alias }));

  // ---- FAQ (visible word for word) ---------------------------------------
  const faq: [string, string][] = [];
  if (capText) faq.push([fill(t.qCap, v), fill(t.aCap, v)]);
  if (place) {
    const full = [venue.address, place].filter(Boolean).join(', ');
    faq.push([fill(t.qWhere, v), fill(t.aWhere, { ...v, place: full })]);
  }
  if (tenants.length > 0) faq.push([fill(t.qWho, v), fill(tenants.length === 1 ? t.aWhoOne : t.aWhoMany, v)]);
  if (next) {
    faq.push([
      fill(t.qNext, v),
      fill(t.aNext, {
        ...v,
        home: next.teams.home.name,
        away: next.teams.away.name,
        date: longDateIn(next.fixture.date, zone.zone, locale),
        time: timeIn(next.fixture.date, zone.zone, locale),
        zone: zone.label[locale],
        competition: leagueText(next, locale),
      }),
    ]);
  }
  if (n >= 3) {
    faq.push([
      fill(t.qGoals, v),
      fill(t.aGoals, {
        ...v,
        n: String(n),
        g: String(stats.goals),
        avg: num(stats.goals / n, locale, 1),
        hw: String(stats.homeWins),
        d: String(stats.draws),
        aw: String(stats.awayWins),
      }),
    ]);
  }

  // ---- Breadcrumb: Inicio › {main club} › stadium -------------------------
  const crumbs: Crumb[] = [{ name: t.home, path: homePath(locale) }];
  if (main) crumbs.push({ name: main.name, path: teamPath(locale, main) });
  crumbs.push({ name: venue.name });

  // ---- Structured data -----------------------------------------------------
  const address = {
    '@type': 'PostalAddress',
    ...(venue.address ? { streetAddress: venue.address } : {}),
    ...(d.city ? { addressLocality: d.city } : {}),
    ...(venue.country ? { addressCountry: venue.country.replace(/-/g, ' ') } : {}),
  };
  const placeLd = { '@type': 'StadiumOrArena', name: venue.name, address };
  const venueLd = {
    '@context': 'https://schema.org',
    '@type': 'StadiumOrArena',
    '@id': `${absolute(path)}#venue`,
    name: venue.name,
    ...(alias ? { alternateName: alias } : {}),
    url: absolute(path),
    address,
    ...(venue.capacity ? { maximumAttendeeCapacity: venue.capacity } : {}),
    ...(venue.image ? { image: venue.image } : {}),
    ...(upcoming.length
      ? {
          event: upcoming.slice(0, 10).map((f) => ({
            '@type': 'SportsEvent',
            name: `${f.teams.home.name} vs ${f.teams.away.name}`,
            sport: 'Soccer',
            startDate: f.fixture.date,
            eventStatus: 'https://schema.org/EventScheduled',
            location: placeLd,
            homeTeam: { '@type': 'SportsTeam', name: f.teams.home.name, logo: f.teams.home.logo },
            awayTeam: { '@type': 'SportsTeam', name: f.teams.away.name, logo: f.teams.away.logo },
            organizer: { '@type': 'Organization', name: f.league.name },
            url: absolute(matchPath(locale, f)),
          })),
        }
      : {}),
  };

  const visible = played.slice(0, LIST_VISIBLE);
  const older = played.slice(LIST_VISIBLE);
  const tagFor = (f: Fixture) => {
    const h = f.goals.home ?? 0;
    const a = f.goals.away ?? 0;
    if (h === a) return t.draw;
    return fill(t.won, { team: h > a ? f.teams.home.name : f.teams.away.name });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={venueLd} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />

        {/* Hero: photo, name and the facts people search ("capacidad"). */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-band">
          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {venue.image ? (
              <div className="relative aspect-[16/10] w-full bg-surface-2 md:aspect-auto md:min-h-72">
                <Image src={venue.image} alt={venue.name} fill unoptimized priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
              </div>
            ) : null}
            <div className={venue.image ? 'flex flex-col gap-5 p-5 sm:p-8' : 'flex flex-col gap-5 p-5 sm:p-8 md:col-span-2'}>
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{t.eyebrow}</p>
                <DisplayHeading as="h1" className="mt-2 text-3xl sm:text-5xl">
                  {venue.name}
                </DisplayHeading>
                {place ? <p className="mt-2 font-semibold text-muted-foreground">{place}</p> : null}
                {alias ? <p className="mt-1 text-sm font-semibold text-muted-foreground">{fill(t.alias, { alias })}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {capText ? <StatTile value={capText} label={t.capacity} /> : null}
                {n > 0 ? <StatTile value={String(n)} label={t.tPlayed} /> : null}
                {/* Rates only from 3 matches on: "100 % home wins" over one game says nothing. */}
                {n >= 3 ? <StatTile value={num(stats.goals / n, locale, 1)} label={t.tGpm} /> : null}
                {n >= 3 ? <StatTile value={`${pct(stats.homeWins, n)} %`} label={t.tHome} /> : null}
              </div>
              {tenants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tenants.map((x) => (
                    <Link
                      key={x.id}
                      href={teamPath(locale, x)}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-bold hover:border-primary"
                    >
                      <Crest src={x.logo} alt="" size={20} />
                      {x.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-6">
            <SummaryBox title={t.summary} sentences={sentences} />

            {upcoming.length > 0 ? (
              <Panel title={t.upcoming}>
                <div>
                  {upcoming.map((f) => (
                    <MatchRow
                      key={f.fixture.id}
                      f={f}
                      locale={locale}
                      zone={zone.zone}
                      extra={
                        f.fixture.status.short === 'TBD' ? undefined : (
                          <span className="font-bold text-foreground">{timeIn(f.fixture.date, zone.zone, locale)}</span>
                        )
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{fill(t.timeNote, { zone: zone.label[locale] })}</p>
              </Panel>
            ) : null}

            <AdSlot id="stadium-after-upcoming" format="leaderboard" indexable={indexable} />

            {played.length > 0 ? (
              <Panel title={t.recent}>
                <div>
                  {visible.map((f) => (
                    <MatchRow key={f.fixture.id} f={f} locale={locale} zone={zone.zone} tag={tagFor(f)} />
                  ))}
                </div>
                {older.length > 0 ? (
                  <details className="mt-2 rounded-xl border border-border">
                    <summary className="cursor-pointer px-4 py-3 text-center text-sm font-bold">
                      {fill(t.older, { n: String(older.length) })}
                    </summary>
                    <div className="px-2 pb-2">
                      {older.map((f) => (
                        <MatchRow key={f.fixture.id} f={f} locale={locale} zone={zone.zone} tag={tagFor(f)} />
                      ))}
                    </div>
                  </details>
                ) : null}
              </Panel>
            ) : null}

            {n >= 3 ? (
              <Panel title={t.stats}>
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
                    label={fill(t.split, { h: String(pct(stats.homeWins, n)), d: String(pct(stats.draws, n)), a: String(pct(stats.awayWins, n)) })}
                  />
                </div>
                {stats.biggest ? (
                  <div className="mt-4">
                    <FactList
                      rows={[
                        [
                          t.biggest,
                          <Link key="b" href={matchPath(locale, stats.biggest)} className="hover:text-primary">
                            <span className="block">
                              {stats.biggest.teams.home.name} {scoreText(stats.biggest, locale)} {stats.biggest.teams.away.name}
                            </span>
                            <span className="block text-xs font-semibold text-muted-foreground">
                              {dateText(stats.biggest.fixture.date, zone.zone, locale)} · {leagueText(stats.biggest, locale)}
                            </span>
                          </Link>,
                        ],
                      ]}
                    />
                  </div>
                ) : null}
                <p className="mt-3 text-xs font-semibold text-muted-foreground">{fill(t.statsScope, { n: String(n) })}</p>
              </Panel>
            ) : null}

            <FaqSection title={t.faq} entries={faq} pagePath={path} className="mt-2" />
            <p className="text-xs font-semibold text-muted-foreground">{t.source}</p>
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            <Panel title={t.facts}>
              <FactList
                rows={(
                  [
                    [t.fName, venue.name],
                    [t.fAlias, alias],
                    [t.fAddress, venue.address],
                    [t.fCity, d.city],
                    [t.fCountry, countryText(venue.country, locale) || null],
                    [t.fCapacity, capText ? fill(t.people, { n: capText }) : null],
                    [t.fSurface, surface],
                  ] as [string, string | null][]
                ).filter((r): r is [string, string] => !!r[1])}
              />
            </Panel>

            {tenants.length > 0 ? (
              <Panel title={t.homeTeams}>
                <ul className="divide-y divide-border">
                  {tenants.map((x) => (
                    <li key={x.id} className="py-2.5">
                      <Link href={teamPath(locale, x)} className="flex items-center gap-3 text-sm font-bold hover:text-primary">
                        <Crest src={x.logo} alt="" size={28} />
                        <span className="min-w-0">
                          <span className="block truncate">{x.name}</span>
                          {x.record.n > 0 ? (
                            <span className="block text-xs font-semibold text-muted-foreground">
                              {fill(t.homeRecord, { w: String(x.record.w), d: String(x.record.d), l: String(x.record.l), n: String(x.record.n) })}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
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

            <AdSlot id="stadium-sidebar" format="rectangle" indexable={indexable} />
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
