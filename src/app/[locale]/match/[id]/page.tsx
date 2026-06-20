import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFixtureById, type Fixture } from '@/lib/api-football';
import { InstallCTA } from '@/components/InstallCTA';
import {
  SITE_NAME,
  IOS_APP_ID,
  LOCALES,
  WORLD_CUP_LEAGUE_ID,
  worldCupEventNode,
  absoluteUrl,
} from '@/lib/site';

// SSR content page (was a client redirect funnel). Renders real match facts so
// Google AND AI answer-engines can index/cite it, with an install CTA below.
export const revalidate = 30;

type Params = { locale: string; id: string };

// ---- tiny i18n (page-local; chrome only, facts come from data) ----
const STR = {
  es: {
    vs: 'vs',
    scheduled: 'Programado',
    live: 'En vivo',
    finished: 'Finalizado',
    venue: 'Estadio',
    competition: 'Competición',
    round: 'Fase',
    kickoff: 'Inicio',
    followInApp:
      'Sigue este partido en vivo, con alineaciones, estadísticas y notificaciones en la app Golify.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
  },
  en: {
    vs: 'vs',
    scheduled: 'Scheduled',
    live: 'Live',
    finished: 'Finished',
    venue: 'Venue',
    competition: 'Competition',
    round: 'Round',
    kickoff: 'Kickoff',
    followInApp:
      'Follow this match live with lineups, stats and notifications in the Golify app.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

function statusLabel(f: Fixture, locale: string): string {
  const s = f.fixture.status.short;
  const L = t(locale);
  if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(s)) return L.live;
  if (['FT', 'AET', 'PEN'].includes(s)) return L.finished;
  return L.scheduled;
}

// schema.org EventStatusType only defines Scheduled/Postponed/Cancelled/
// Rescheduled/MovedOnline — there is no "live" or "finished" member, so a
// playing/played match stays EventScheduled; we only flip the abnormal states.
function schemaEventStatus(f: Fixture): string {
  const s = f.fixture.status.short;
  if (s === 'PST') return 'https://schema.org/EventPostponed';
  if (['CANC', 'ABD'].includes(s)) return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

function title(f: Fixture, locale: string): string {
  const L = t(locale);
  const base = `${f.teams.home.name} ${L.vs} ${f.teams.away.name}`;
  const played = f.goals.home != null && f.goals.away != null;
  return played ? `${base} ${f.goals.home}-${f.goals.away}` : base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const f = await getFixtureById(Number(id));
  if (!f) return { title: SITE_NAME };

  const L = t(locale);
  const name = `${title(f, locale)} — ${f.league.name} | ${SITE_NAME}`;
  const desc = `${f.teams.home.name} ${L.vs} ${f.teams.away.name}, ${f.league.name} ${f.league.round}. ${L.followInApp}`;
  const path = `/${locale}/match/${id}`;

  return {
    title: name,
    description: desc,
    alternates: {
      canonical: absoluteUrl(path),
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, absoluteUrl(`/${l}/match/${id}`)]),
      ),
    },
    openGraph: {
      title: name,
      description: desc,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      type: 'website',
      images: [f.teams.home.logo, f.teams.away.logo].filter(Boolean),
    },
    twitter: { card: 'summary_large_image', title: name, description: desc },
    other: {
      'apple-itunes-app': `app-id=${IOS_APP_ID}, app-argument=golify://match/${id}`,
    },
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, id } = await params;
  const f = await getFixtureById(Number(id));
  if (!f) notFound();

  const L = t(locale);
  const played = f.goals.home != null && f.goals.away != null;
  const kickoff = new Date(f.fixture.date);
  const isWorldCup = f.league.id === WORLD_CUP_LEAGUE_ID;

  const homeTeam = {
    '@type': 'SportsTeam',
    name: f.teams.home.name,
    logo: f.teams.home.logo,
  };
  const awayTeam = {
    '@type': 'SportsTeam',
    name: f.teams.away.name,
    logo: f.teams.away.logo,
  };

  // schema.org SportsEvent — the structured signal AI/Google parse to cite us.
  // `location` and `startDate` are required by Google; we always emit both
  // (venue fields fall back to the league's host country so the item stays
  // valid even when the API hasn't assigned a stadium yet).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${f.teams.home.name} ${L.vs} ${f.teams.away.name}`,
    description: `${f.teams.home.name} ${L.vs} ${f.teams.away.name} — ${f.league.name} ${f.league.round}. ${L.followInApp}`,
    sport: 'Soccer',
    startDate: f.fixture.date,
    // Football matches run ~2h; gives Google an explicit endDate.
    endDate: new Date(kickoff.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    eventStatus: schemaEventStatus(f),
    location: {
      '@type': 'Place',
      name: f.fixture.venue.name ?? f.league.country ?? f.league.name,
      address: f.fixture.venue.city ?? f.league.country ?? undefined,
    },
    image: [f.teams.home.logo, f.teams.away.logo, f.league.logo].filter(
      Boolean,
    ),
    homeTeam,
    awayTeam,
    performer: [homeTeam, awayTeam],
    organizer: isWorldCup
      ? {
          '@type': 'Organization',
          name: 'FIFA',
          url: 'https://www.fifa.com',
        }
      : { '@type': 'Organization', name: f.league.name },
    // superEvent must itself be a valid Event (name + startDate + location):
    // for World Cup matches we link the canonical tournament node by @id.
    superEvent: isWorldCup
      ? worldCupEventNode(absoluteUrl(`/${locale}/world-cup`))
      : {
          '@type': 'SportsEvent',
          name: f.league.name,
          startDate: f.fixture.date,
          location: {
            '@type': 'Place',
            name: f.league.country ?? f.league.name,
          },
        },
    url: absoluteUrl(`/${locale}/match/${id}`),
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="text-sm uppercase tracking-wide text-neutral-500">
        {f.league.name} · {f.league.round}
      </p>

      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title(f, locale)}</h1>

      <p className="mt-1 text-sm font-medium text-green-600">
        {statusLabel(f, locale)}
        {f.fixture.status.elapsed ? ` · ${f.fixture.status.elapsed}'` : ''}
      </p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.teams.home.logo} alt={f.teams.home.name} width={56} height={56} />
          <span className="font-semibold">{f.teams.home.name}</span>
        </div>
        <div className="px-4 text-3xl font-bold tabular-nums">
          {played ? `${f.goals.home} - ${f.goals.away}` : L.vs}
        </div>
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.teams.away.logo} alt={f.teams.away.name} width={56} height={56} />
          <span className="font-semibold">{f.teams.away.name}</span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-neutral-500">{L.kickoff}</dt>
          <dd className="font-medium">
            {kickoff.toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })}
          </dd>
        </div>
        {f.fixture.venue.name ? (
          <div>
            <dt className="text-neutral-500">{L.venue}</dt>
            <dd className="font-medium">
              {f.fixture.venue.name}
              {f.fixture.venue.city ? `, ${f.fixture.venue.city}` : ''}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-neutral-500">{L.competition}</dt>
          <dd className="font-medium">{f.league.name}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{L.round}</dt>
          <dd className="font-medium">{f.league.round}</dd>
        </div>
      </dl>

      <p className="mt-8 text-neutral-700 dark:text-neutral-300">{L.followInApp}</p>

      <InstallCTA
        deeplink={`golify://match/${id}`}
        labels={{ open: L.openApp, ios: L.ios, android: L.android }}
      />
    </main>
  );
}
