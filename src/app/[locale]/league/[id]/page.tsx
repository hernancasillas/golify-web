import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  currentSeason,
  getLeagueFixtures,
  getLeagueInfo,
  getStandings,
  type StandingsGroup,
} from '@/lib/api-football';
import { TRACKED_LEAGUE_IDS, leagueLabel } from '@/lib/leagues';
import { FixtureGrid } from '@/components/FixtureList';
import { InstallCTA } from '@/components/InstallCTA';
import { SiteNav } from '@/components/SiteNav';
import { LocalTimeScript } from '@/components/LocalTime';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import {
  absoluteUrl,
  fill,
  localeAlternates,
  ogImages,
  type Locale,
} from '@/lib/site';

// Was a client-side deeplink funnel: every league rendered the same splash
// screen, which is exactly why Search Console filed these under "duplicate
// without user-selected canonical". Now each league is a real page with its
// own standings and fixtures, a self-referencing canonical and hreflang.
//
// Rendered on demand rather than prerendered: building 40+ of these at once
// burst past the API's per-minute limit and baked 404s into the cache.
export const revalidate = 300;

type Params = { locale: string; id: string };

const STR = {
  es: {
    standings: 'Tabla de posiciones',
    upcoming: 'Próximos partidos',
    recent: 'Últimos resultados',
    team: 'Equipo',
    played: 'PJ',
    won: 'G',
    drawn: 'E',
    lost: 'P',
    goalDiff: 'DIF',
    points: 'PTS',
    season: 'Temporada',
    noStandings: 'Esta competición todavía no publica tabla de posiciones.',
    metaTitle: '{name} — tabla, calendario y resultados {season} | Golify',
    metaDesc:
      'Tabla de posiciones de {name} ({country}), próximos partidos y últimos resultados, actualizados en vivo. Sigue cada partido en la app Golify.',
    live: 'EN VIVO',
    finished: 'Final',
    followInApp:
      'Sigue esta competición en la app Golify: marcadores en vivo, alertas de gol y la tabla siempre actualizada.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    today: 'Partidos de hoy',
    liveScores: 'Resultados en vivo',
  },
  en: {
    standings: 'Standings',
    upcoming: 'Upcoming matches',
    recent: 'Latest results',
    team: 'Team',
    played: 'P',
    won: 'W',
    drawn: 'D',
    lost: 'L',
    goalDiff: 'GD',
    points: 'PTS',
    season: 'Season',
    noStandings: 'This competition does not publish a table yet.',
    metaTitle: '{name} — table, fixtures and results {season} | Golify',
    metaDesc:
      '{name} ({country}) standings, upcoming fixtures and latest results, updated live. Follow every match in the Golify app.',
    live: 'LIVE',
    finished: 'Full time',
    followInApp:
      'Follow this competition in the Golify app: live scores, goal alerts and an always-current table.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    today: "Today's matches",
    liveScores: 'Live scores',
  },
  pt: {
    standings: 'Tabela de classificação',
    upcoming: 'Próximos jogos',
    recent: 'Últimos resultados',
    team: 'Time',
    played: 'J',
    won: 'V',
    drawn: 'E',
    lost: 'D',
    goalDiff: 'SG',
    points: 'PTS',
    season: 'Temporada',
    noStandings: 'Esta competição ainda não publica tabela de classificação.',
    metaTitle: '{name} — tabela, jogos e resultados {season} | Golify',
    metaDesc:
      'Tabela de classificação do {name} ({country}), próximos jogos e últimos resultados, atualizados ao vivo. Acompanhe cada jogo no app Golify.',
    live: 'AO VIVO',
    finished: 'Encerrado',
    followInApp:
      'Acompanhe esta competição no app Golify: placar ao vivo, alertas de gol e a tabela sempre atualizada.',
    openApp: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    today: 'Jogos de hoje',
    liveScores: 'Placares ao vivo',
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const info = await getLeagueInfo(Number(id));
  if (!info) return { title: 'Golify' };

  const L = t(locale);
  const name = leagueLabel(info.league.id) ?? info.league.name;
  const season = currentSeason(info);
  const title = fill(L.metaTitle, {
    name,
    season: season ? String(season) : '',
  });
  const desc = fill(L.metaDesc, { name, country: info.country.name });
  const path = `/${locale}/league/${id}`;

  return {
    title,
    description: desc,
    // localeAlternates also emits x-default, which is what tells Google which
    // version to serve a visitor whose language we do not publish.
    alternates: localeAlternates(locale as Locale, `/league/${id}`),
    openGraph: {
      title,
      description: desc,
      url: absoluteUrl(path),
      siteName: 'Golify',
      type: 'website',
      images: ogImages(),
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

function StandingsTable({
  group,
  locale,
  labels,
  showName,
}: {
  group: StandingsGroup;
  locale: string;
  labels: ReturnType<typeof t>;
  /** A domestic league reports its own name as the group label, which would
   *  repeat the heading right above the table. Only cups with real groups
   *  ("Group A") need it. */
  showName: boolean;
}) {
  return (
    <div className="mt-6">
      {showName && group.name ? (
        <h3 className="mb-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          {group.name}
        </h3>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">{labels.team}</th>
              <th className="px-2 py-2.5 text-center">{labels.played}</th>
              <th className="px-2 py-2.5 text-center">{labels.won}</th>
              <th className="px-2 py-2.5 text-center">{labels.drawn}</th>
              <th className="px-2 py-2.5 text-center">{labels.lost}</th>
              <th className="px-2 py-2.5 text-center">{labels.goalDiff}</th>
              <th className="px-3 py-2.5 text-center">{labels.points}</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr key={row.team.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2.5 font-bold tabular-nums text-muted-foreground">
                  {row.rank}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/${locale}/team/${row.team.id}`}
                    className="flex items-center gap-2 font-bold hover:text-primary"
                  >
                    <Image
                      src={row.team.logo}
                      alt=""
                      width={18}
                      height={18}
                      unoptimized
                      className="h-[18px] w-[18px] shrink-0 object-contain"
                    />
                    <span className="truncate">{row.team.name}</span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.all.played}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.all.win}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.all.draw}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.all.lose}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.goalsDiff}</td>
                <td className="px-3 py-2.5 text-center font-display font-bold tabular-nums">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function LeaguePage({ params }: { params: Promise<Params> }) {
  const { locale, id } = await params;
  const leagueId = Number(id);
  if (!Number.isFinite(leagueId)) notFound();

  const info = await getLeagueInfo(leagueId);
  if (!info) {
    // A league we track has to exist, so an empty response means the API is
    // unhappy, not that the page is gone. Throwing surfaces a 5xx, which tells
    // a crawler to come back; a 404 here would drop the URL from the index and
    // stay cached for the whole revalidate window.
    if (TRACKED_LEAGUE_IDS.includes(leagueId)) {
      throw new Error(`League ${leagueId} lookup failed upstream`);
    }
    notFound();
  }

  const L = t(locale);
  const season = currentSeason(info);
  const name = leagueLabel(info.league.id) ?? info.league.name;

  const [standings, upcoming, recent] = season
    ? await Promise.all([
        getStandings(leagueId, season),
        getLeagueFixtures(leagueId, season, { next: 10 }),
        getLeagueFixtures(leagueId, season, { last: 10 }),
      ])
    : [[], [], []];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name,
    alternateName: info.league.name,
    sport: 'Soccer',
    logo: info.league.logo,
    url: absoluteUrl(`/${locale}/league/${id}`),
    location: { '@type': 'Country', name: info.country.name },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src={info.league.logo}
              alt=""
              width={30}
              height={30}
              unoptimized
              className="h-[30px] w-[30px] object-contain"
            />
          </span>
          <div>
            <DisplayHeading as="h1" className="text-2xl sm:text-3xl">
              {name}
            </DisplayHeading>
            <p className="mt-0.5 text-sm font-bold text-muted-foreground">
              {info.country.name}
              {season ? ` · ${L.season} ${season}` : ''}
            </p>
          </div>
        </div>

        <section className="mt-9">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">
            {L.standings}
          </h2>
          {standings.length === 0 ? (
            <p className="mt-3 font-semibold text-muted-foreground">{L.noStandings}</p>
          ) : (
            standings.map((group, i) => (
              <StandingsTable
                key={group.name || i}
                group={group}
                locale={locale}
                labels={L}
                showName={standings.length > 1}
              />
            ))
          )}
        </section>

        {upcoming.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide uppercase">
              {L.upcoming}
            </h2>
            <FixtureGrid fixtures={upcoming} locale={locale} labels={L} showLeague={false} />
          </section>
        ) : null}

        {recent.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide uppercase">
              {L.recent}
            </h2>
            <FixtureGrid fixtures={recent} locale={locale} labels={L} showLeague={false} />
          </section>
        ) : null}

        <p className="mt-9 leading-relaxed font-semibold text-muted-foreground">
          {L.followInApp}
        </p>

        <InstallCTA
          deeplink={`golify://league/${id}`}
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />

        <p className="mt-8 flex gap-4">
          <Link href={`/${locale}/today`} className="text-sm font-bold text-primary underline">
            {L.today}
          </Link>
          <Link href={`/${locale}/live`} className="text-sm font-bold text-primary underline">
            {L.liveScores}
          </Link>
        </p>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
