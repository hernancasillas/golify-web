import type { Metadata } from 'next';
import Link from 'next/link';
import { getFixturesByDate } from '@/lib/api-football';
import { TRACKED_LEAGUE_IDS } from '@/lib/leagues';
import {
  FixtureGrid,
  fixtureListJsonLd,
  groupByLeague,
  isLive,
} from '@/components/FixtureList';
import { InstallCTA } from '@/components/InstallCTA';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading, Eyebrow } from '@/components/revamp/ui';
import { SITE_URL, localeAlternates, ogImages, type Locale } from '@/lib/site';

// The recurring-demand page: "partidos de hoy" / "today's football matches" is
// searched every single day, unlike a tournament page that dies with the
// tournament. Server-rendered so the scores are in the HTML, revalidated every
// five minutes so a crawl never lands on a stale board.
export const revalidate = 300;

// The board is built around one calendar day. Mexico City is our largest
// market, so that timezone decides which day "today" is; the copy says so and
// every kickoff renders in the visitor's locale format.
const BOARD_TIMEZONE = 'America/Mexico_City';

const STR = {
  es: {
    eyebrow: 'Hoy',
    title: 'Partidos de hoy',
    intro:
      'Todos los partidos de hoy de Liga MX, Brasileirão, Liga Argentina, Libertadores, MLS, Champions y más, con marcador en vivo y horario de inicio.',
    liveNow: 'En vivo ahora',
    empty: 'Hoy no hay partidos programados en las ligas que seguimos.',
    emptyCta: 'Mira los resultados en vivo',
    live: 'EN VIVO',
    finished: 'Final',
    tzNote: `Horarios en tu zona; el día se cuenta con el horario del centro de México.`,
    leagueLink: 'Ver la liga',
    followInApp:
      'Recibe alertas de gol, alineaciones y el minuto a minuto de estos partidos en la app Golify.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    liveLink: 'Resultados en vivo',
  },
  en: {
    eyebrow: 'Today',
    title: "Today's football matches",
    intro:
      "Every match being played today across Liga MX, Brasileirão, Liga Argentina, Copa Libertadores, MLS, the Champions League and more — with live scores and kickoff times.",
    liveNow: 'Live now',
    empty: 'No matches scheduled today in the leagues we track.',
    emptyCta: 'See live scores',
    live: 'LIVE',
    finished: 'Full time',
    tzNote: 'Kickoffs in your own locale; the day is counted in Mexico City time.',
    leagueLink: 'View league',
    followInApp:
      'Get goal alerts, lineups and minute-by-minute updates for these matches in the Golify app.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    liveLink: 'Live scores',
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

function boardDate(): string {
  // en-CA formats as YYYY-MM-DD, which is what the API expects.
  return new Date().toLocaleDateString('en-CA', { timeZone: BOARD_TIMEZONE });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const L = t(locale);
  const pretty = new Date(`${boardDate()}T12:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  });
  const title = `${L.title} — ${pretty} | Golify`;

  return {
    title,
    description: L.intro,
    alternates: localeAlternates(locale as Locale, '/today'),
    openGraph: {
      title,
      description: L.intro,
      url: `${SITE_URL}/${locale}/today`,
      siteName: 'Golify',
      type: 'website',
      images: ogImages(),
    },
    twitter: { card: 'summary_large_image', title, description: L.intro },
  };
}

export default async function TodayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const L = t(locale);
  const date = boardDate();
  const fixtures = await getFixturesByDate(date, TRACKED_LEAGUE_IDS);

  const liveFixtures = fixtures.filter(isLive);
  const groups = groupByLeague(fixtures);
  const prettyDate = new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {fixtures.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              fixtureListJsonLd(fixtures, SITE_URL, locale, `${L.title} — ${prettyDate}`),
            ),
          }}
        />
      ) : null}
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 sm:px-8">
        <Eyebrow tone="mint">{L.eyebrow}</Eyebrow>
        <DisplayHeading as="h1" className="mt-4 text-3xl sm:text-4xl">
          {L.title}
        </DisplayHeading>
        <p className="mt-2 text-sm font-bold text-muted-foreground capitalize">{prettyDate}</p>
        <p className="mt-4 leading-relaxed font-semibold text-muted-foreground">{L.intro}</p>

        {liveFixtures.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide uppercase">
              {L.liveNow}
            </h2>
            <FixtureGrid fixtures={liveFixtures} locale={locale} labels={L} />
          </section>
        ) : null}

        {groups.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="font-bold">{L.empty}</p>
            <Link
              href={`/${locale}/live`}
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
              <FixtureGrid
                fixtures={rows}
                locale={locale}
                labels={L}
                showLeague={false}
              />
            </section>
          ))
        )}

        <p className="mt-8 text-xs font-semibold text-muted-foreground">{L.tzNote}</p>

        <p className="mt-9 leading-relaxed font-semibold text-muted-foreground">
          {L.followInApp}
        </p>

        <InstallCTA
          deeplink="golify://"
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />

        <p className="mt-8">
          <Link href={`/${locale}/live`} className="text-sm font-bold text-primary underline">
            {L.liveLink}
          </Link>
        </p>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
