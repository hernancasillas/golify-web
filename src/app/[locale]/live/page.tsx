import type { Metadata } from 'next';
import Link from 'next/link';
import { getLiveFixtures } from '@/lib/api-football';
import { TRACKED_LEAGUE_IDS } from '@/lib/leagues';
import {
  FixtureGrid,
  fixtureListJsonLd,
  groupByLeague,
} from '@/components/FixtureList';
import { InstallCTA } from '@/components/InstallCTA';
import { SiteNav } from '@/components/SiteNav';
import { LocalTimeScript } from '@/components/LocalTime';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading, Eyebrow } from '@/components/revamp/ui';
import { SITE_URL, localeAlternates, ogImages, type Locale } from '@/lib/site';

// "Resultados en vivo" is the other query typed every day. Fifteen-second
// revalidation keeps the served HTML close to the real score without hammering
// the shared API quota — the underlying fetch is deduped across requests.
export const revalidate = 15;

const STR = {
  es: {
    eyebrow: 'En vivo',
    title: 'Resultados de fútbol en vivo',
    intro:
      'Marcadores en vivo de Liga MX, Brasileirão, Liga Argentina, Libertadores, Sudamericana, MLS, Champions y las grandes ligas de Europa. Se actualiza mientras se juega.',
    empty: 'Ahora mismo no hay partidos en juego en las ligas que seguimos.',
    emptyCta: 'Ver los partidos de hoy',
    live: 'EN VIVO',
    finished: 'Final',
    followInApp:
      'La app Golify te avisa de cada gol, con alineaciones y estadísticas en vivo.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    todayLink: 'Partidos de hoy',
    leagueLink: 'Ver la liga',
  },
  en: {
    eyebrow: 'Live',
    title: 'Live football scores',
    intro:
      'Live scores from Liga MX, Brasileirão, Liga Argentina, Copa Libertadores, Copa Sudamericana, MLS, the Champions League and the big European leagues. Updated while the matches are played.',
    empty: 'No matches are being played right now in the leagues we track.',
    emptyCta: "See today's matches",
    live: 'LIVE',
    finished: 'Full time',
    followInApp:
      'The Golify app pings you on every goal, with live lineups and stats.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    todayLink: "Today's matches",
    leagueLink: 'View league',
  },
  pt: {
    eyebrow: 'Ao vivo',
    title: 'Placares de futebol ao vivo',
    intro:
      'Placar ao vivo do Brasileirão, Libertadores, Sul-Americana, Campeonato Argentino, Liga MX, MLS, Champions e das grandes ligas da Europa. Atualiza enquanto a bola rola.',
    empty: 'Nenhum jogo em andamento agora nas ligas que acompanhamos.',
    emptyCta: 'Ver os jogos de hoje',
    live: 'AO VIVO',
    finished: 'Encerrado',
    followInApp:
      'O app Golify te avisa em cada gol, com escalações e estatísticas ao vivo.',
    openApp: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    todayLink: 'Jogos de hoje',
    leagueLink: 'Ver a liga',
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const L = t(locale);
  const title = `${L.title} | Golify`;

  return {
    title,
    description: L.intro,
    alternates: localeAlternates(locale as Locale, '/live'),
    openGraph: {
      title,
      description: L.intro,
      url: `${SITE_URL}/${locale}/live`,
      siteName: 'Golify',
      type: 'website',
      images: ogImages(),
    },
    twitter: { card: 'summary_large_image', title, description: L.intro },
  };
}

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const L = t(locale);
  const fixtures = await getLiveFixtures(TRACKED_LEAGUE_IDS);
  const groups = groupByLeague(fixtures);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {fixtures.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              fixtureListJsonLd(fixtures, SITE_URL, locale, L.title),
            ),
          }}
        />
      ) : null}
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 sm:px-8">
        <Eyebrow tone="mint">{L.eyebrow}</Eyebrow>
        <DisplayHeading as="h1" className="mt-4 text-3xl sm:text-4xl">
          {L.title}
        </DisplayHeading>
        <p className="mt-4 leading-relaxed font-semibold text-muted-foreground">{L.intro}</p>

        {groups.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="font-bold">{L.empty}</p>
            <Link
              href={`/${locale}/today`}
              className="mt-2 inline-block text-sm font-bold text-primary underline"
            >
              {L.emptyCta}
            </Link>
          </div>
        ) : (
          groups.map(({ league, fixtures: rows }) => (
            <section key={league.id} className="mt-10">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold tracking-wide uppercase">
                  {league.name}
                </h2>
                <Link
                  href={`/${locale}/league/${league.id}`}
                  className="shrink-0 text-xs font-bold text-primary underline"
                >
                  {L.leagueLink}
                </Link>
              </div>
              <FixtureGrid fixtures={rows} locale={locale} labels={L} showLeague={false} />
            </section>
          ))
        )}

        <p className="mt-9 leading-relaxed font-semibold text-muted-foreground">
          {L.followInApp}
        </p>

        <InstallCTA
          deeplink="golify://"
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />

        <p className="mt-8">
          <Link href={`/${locale}/today`} className="text-sm font-bold text-primary underline">
            {L.todayLink}
          </Link>
        </p>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
