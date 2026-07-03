import type { Metadata } from 'next';
import { getWorldCupFixtures, type Fixture } from '@/lib/api-football';
import { SmartAppOpen } from '@/components/SmartAppOpen';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import {
  CalendarMatchCard,
  DisplayHeading,
  Eyebrow,
  FaqCard,
  PillLink,
} from '@/components/revamp/ui';
import {
  SITE_NAME,
  SITE_URL,
  IOS_APP_ID,
  APP_STORE_URL,
  PLAY_STORE_URL,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
  worldCupEventNode,
  localeAlternates,
  absoluteUrl,
  ogImages,
  DEFAULT_OG_IMAGE,
  type Locale,
} from '@/lib/site';

/** The projection highlights Mexico's card (home crowd bias in the handoff). */
const isMx = (name: string) => /m[eé]xico/i.test(name);

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
    badge: '🏆 Mundial 2026',
    h1: 'Calendario y resultados, minuto a minuto',
    heroSub:
      'Del 11 de junio al 19 de julio, en Estados Unidos, Canadá y México. 48 selecciones, 104 partidos — todos con marcador en vivo en Golify.',
    stats: ['48 selecciones', '104 partidos', '3 países'],
    viewBracket: '🏆 Ver la llave de eliminatorias →',
    midTitle: 'Resultados en vivo, alineaciones y notificaciones',
    midBody:
      'Sigue a tus selecciones favoritas y recibe avisos antes de cada arranque, directo en Golify.',
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
    badge: '🏆 World Cup 2026',
    h1: 'Schedule and results, minute by minute',
    heroSub:
      'From June 11 to July 19, across the United States, Canada and Mexico. 48 teams, 104 matches — all with live scores on Golify.',
    stats: ['48 teams', '104 matches', '3 host countries'],
    viewBracket: '🏆 View the knockout bracket →',
    midTitle: 'Live results, lineups and notifications',
    midBody:
      'Follow your favorite national teams and get alerts before every kickoff, right in Golify.',
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
      images: ogImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title: L.title,
      description: desc,
      images: [DEFAULT_OG_IMAGE],
    },
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
      ...worldCupEventNode(absoluteUrl(`/${locale}/world-cup`)),
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
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmartAppOpen deeplink={DEEPLINK} />
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-64 -left-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(92,242,154,0.2),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pt-2 pb-16 sm:px-8">
          <Eyebrow tone="gold">{L.badge}</Eyebrow>
          <DisplayHeading as="h1" className="mt-5 max-w-3xl text-5xl sm:text-6xl">
            {L.h1}
          </DisplayHeading>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed font-semibold text-muted-foreground">
            {L.heroSub}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <PillLink href={`/${locale}/world-cup/bracket`} variant="mint">
              {L.viewBracket}
            </PillLink>
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-muted-foreground">
              {L.stats.map((s, i) => (
                <span key={s} className="flex items-center gap-3">
                  {i > 0 ? (
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  ) : null}
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRÓXIMOS PARTIDOS */}
      <section className="bg-band py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <DisplayHeading as="h2" className="mb-7 text-3xl sm:text-4xl">
            {L.upcoming}
          </DisplayHeading>
          {next.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {next.map((f) => {
                const home = f.teams.home.name;
                const away = f.teams.away.name;
                const dateLabel = new Date(f.fixture.date).toLocaleDateString(
                  locale,
                  { day: 'numeric', month: 'short' },
                );
                return (
                  <CalendarMatchCard
                    key={f.fixture.id}
                    homeName={home}
                    awayName={away}
                    dateLabel={dateLabel}
                    vs={L.vs}
                    highlight={isMx(home) || isMx(away)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">{L.noFixtures}</p>
          )}
        </div>
      </section>

      {/* MID CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-10 rounded-3xl border border-gold/25 bg-gradient-to-br from-surface-2 to-band p-10 sm:p-14">
          <div className="max-w-xl">
            <DisplayHeading as="h2" className="text-3xl sm:text-4xl">
              {L.midTitle}
            </DisplayHeading>
            <p className="mt-3.5 leading-relaxed font-semibold text-muted-foreground">
              {L.midBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <PillLink href={APP_STORE_URL} variant="mint">
              {L.ios}
            </PillLink>
            <PillLink href={PLAY_STORE_URL} variant="outline">
              {L.android}
            </PillLink>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <DisplayHeading as="h2" className="mb-7 text-3xl sm:text-4xl">
          {L.faqTitle}
        </DisplayHeading>
        <div className="flex flex-col gap-3.5">
          {L.faqs.map((f) => (
            <FaqCard key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
