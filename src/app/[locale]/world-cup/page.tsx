import type { Metadata } from 'next';
import Link from 'next/link';
import { getWorldCupFixtures, type Fixture } from '@/lib/api-football';
import { InstallCTA } from '@/components/InstallCTA';
import { SmartAppOpen } from '@/components/SmartAppOpen';
import {
  SITE_NAME,
  SITE_URL,
  IOS_APP_ID,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
  localeAlternates,
  absoluteUrl,
  type Locale,
} from '@/lib/site';

// SSR content hub for the FIFA World Cup 2026. Real, crawlable facts +
// upcoming fixtures so Google and AI answer-engines can index and cite us,
// with a soft hand-off to the app for users who have it installed.
export const revalidate = 3600;

const DEEPLINK = 'golify://world-cup';

type Params = { locale: string };

// ---- page-local i18n (chrome only; match facts come from the API) ----
const STR = {
  es: {
    kicker: 'Mundial 2026',
    title: 'Mundial 2026: calendario, partidos y resultados',
    intro:
      'La Copa Mundial de la FIFA 2026 se juega del 11 de junio al 19 de julio de 2026 en Estados Unidos, Canadá y México. Es el primer Mundial con 48 selecciones y 104 partidos. Sigue el calendario completo, resultados en vivo y notificaciones de tus equipos en Golify.',
    upcoming: 'Próximos partidos',
    noFixtures:
      'El calendario se está actualizando. Vuelve pronto para ver los próximos partidos.',
    followTitle: 'Cómo seguir el Mundial en Golify',
    followBody:
      'Golify te da resultados en vivo, alineaciones, estadísticas y notificaciones de cada partido del Mundial 2026. Sigue a tus selecciones favoritas y recibe avisos antes de cada arranque.',
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      {
        q: '¿Cuándo es el Mundial 2026?',
        a: 'El Mundial 2026 se disputa del 11 de junio al 19 de julio de 2026.',
      },
      {
        q: '¿Dónde se juega el Mundial 2026?',
        a: 'Se juega en tres países anfitriones: Estados Unidos, Canadá y México.',
      },
      {
        q: '¿Cuántas selecciones participan?',
        a: 'Por primera vez participan 48 selecciones, que disputan un total de 104 partidos.',
      },
      {
        q: '¿Cómo veo los partidos y resultados en vivo?',
        a: 'En Golify puedes seguir el calendario completo, resultados en vivo, alineaciones y notificaciones de cada partido del Mundial 2026.',
      },
    ],
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    vs: 'vs',
  },
  en: {
    kicker: 'World Cup 2026',
    title: 'World Cup 2026: schedule, matches and results',
    intro:
      'The FIFA World Cup 2026 runs from June 11 to July 19, 2026 across the United States, Canada and Mexico. It is the first World Cup with 48 national teams and 104 matches. Follow the full schedule, live results and match notifications for your teams on Golify.',
    upcoming: 'Upcoming matches',
    noFixtures: 'The schedule is updating. Check back soon for upcoming matches.',
    followTitle: 'How to follow the World Cup on Golify',
    followBody:
      'Golify gives you live scores, lineups, stats and notifications for every World Cup 2026 match. Follow your favorite national teams and get alerts before every kickoff.',
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'When is the World Cup 2026?',
        a: 'The World Cup 2026 takes place from June 11 to July 19, 2026.',
      },
      {
        q: 'Where is the World Cup 2026 held?',
        a: 'It is hosted across three countries: the United States, Canada and Mexico.',
      },
      {
        q: 'How many teams take part?',
        a: 'For the first time 48 national teams take part, playing a total of 104 matches.',
      },
      {
        q: 'How can I watch matches and live results?',
        a: 'On Golify you can follow the full schedule, live results, lineups and notifications for every World Cup 2026 match.',
      },
    ],
    open: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    vs: 'vs',
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
  const { locale } = await params;
  const L = t(locale);
  const desc = L.intro;
  return {
    title: `${L.title} | ${SITE_NAME}`,
    description: desc,
    alternates: localeAlternates(locale as Locale, '/world-cup'),
    openGraph: {
      title: `${L.title} | ${SITE_NAME}`,
      description: desc,
      url: absoluteUrl(`/${locale}/world-cup`),
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: L.title, description: desc },
    other: {
      'apple-itunes-app': `app-id=${IOS_APP_ID}, app-argument=${DEEPLINK}`,
    },
  };
}

function upcoming(fixtures: Fixture[]): Fixture[] {
  // Not-started matches, soonest first. Falls back to the whole list sorted by
  // date if statuses are missing, so the section is never empty when data exists.
  const ns = fixtures.filter((f) =>
    ['NS', 'TBD'].includes(f.fixture.status.short),
  );
  const pool = ns.length ? ns : fixtures;
  return [...pool]
    .sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime(),
    )
    .slice(0, 12);
}

export default async function WorldCupPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const L = t(locale);
  const fixtures = await getWorldCupFixtures(
    WORLD_CUP_LEAGUE_ID,
    WORLD_CUP_SEASON,
  );
  const next = upcoming(fixtures);

  // schema.org: the tournament as a SportsEvent + an FAQPage for the Q&A.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: 'FIFA World Cup 2026',
      sport: 'Soccer',
      startDate: '2026-06-11',
      endDate: '2026-07-19',
      eventStatus: 'https://schema.org/EventScheduled',
      location: [
        { '@type': 'Country', name: 'United States' },
        { '@type': 'Country', name: 'Canada' },
        { '@type': 'Country', name: 'Mexico' },
      ],
      url: absoluteUrl(`/${locale}/world-cup`),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntity: L.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmartAppOpen deeplink={DEEPLINK} />

      <p className="text-sm uppercase tracking-wide text-neutral-500">
        {L.kicker}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{L.title}</h1>
      <p className="mt-4 text-neutral-700 dark:text-neutral-300">{L.intro}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{L.upcoming}</h2>
        {next.length ? (
          <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
            {next.map((f) => {
              const kickoff = new Date(f.fixture.date);
              return (
                <li key={f.fixture.id}>
                  <Link
                    href={`/${locale}/match/${f.fixture.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                  >
                    <span className="font-medium">
                      {f.teams.home.name} {L.vs} {f.teams.away.name}
                    </span>
                    <time
                      dateTime={f.fixture.date}
                      className="shrink-0 text-sm text-neutral-500"
                    >
                      {kickoff.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            {L.noFixtures}
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{L.followTitle}</h2>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300">
          {L.followBody}
        </p>
      </section>

      <InstallCTA
        deeplink={DEEPLINK}
        labels={{ open: L.open, ios: L.ios, android: L.android }}
      />

      <section className="mt-6">
        <h2 className="text-xl font-semibold">{L.faqTitle}</h2>
        <dl className="mt-4 space-y-5">
          {L.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-medium text-neutral-900 dark:text-neutral-100">
                {f.q}
              </dt>
              <dd className="mt-1 text-neutral-700 dark:text-neutral-300">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
