import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeam, getTeamFixtures } from '@/lib/api-football';
import { FixtureGrid } from '@/components/FixtureList';
import { InstallCTA } from '@/components/InstallCTA';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import { absoluteUrl, localeAlternates, ogImages, type Locale } from '@/lib/site';

// These were the 21 URLs Search Console flagged as "duplicate without
// user-selected canonical": every /team/<id> rendered the same client-side
// splash while it tried to open the app. Each one is now its own page — next
// fixtures, last results, canonical, hreflang and a SportsTeam entity.
export const revalidate = 300;

type Params = { locale: string; id: string };

const STR = {
  es: {
    upcoming: 'Próximos partidos',
    recent: 'Últimos resultados',
    founded: 'Fundado',
    stadium: 'Estadio',
    country: 'País',
    capacity: 'Capacidad',
    live: 'EN VIVO',
    finished: 'Final',
    noFixtures: 'No hay partidos programados para este equipo por ahora.',
    followInApp:
      'Sigue a este equipo en la app Golify: alertas de gol, alineaciones y estadísticas en vivo.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    today: 'Partidos de hoy',
    liveScores: 'Resultados en vivo',
  },
  en: {
    upcoming: 'Upcoming matches',
    recent: 'Latest results',
    founded: 'Founded',
    stadium: 'Stadium',
    country: 'Country',
    capacity: 'Capacity',
    live: 'LIVE',
    finished: 'Full time',
    noFixtures: 'No matches scheduled for this team right now.',
    followInApp:
      'Follow this team in the Golify app: goal alerts, lineups and live stats.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    today: "Today's matches",
    liveScores: 'Live scores',
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
  const info = await getTeam(Number(id));
  if (!info) return { title: 'Golify' };

  const name = info.team.name;
  const title =
    locale === 'en'
      ? `${name} — fixtures, results and live scores | Golify`
      : `${name} — próximos partidos, resultados y marcador en vivo | Golify`;
  const desc =
    locale === 'en'
      ? `${name} (${info.team.country}) next fixtures, latest results and live scores. Follow every match in the Golify app.`
      : `Próximos partidos de ${name} (${info.team.country}), últimos resultados y marcador en vivo. Sigue cada partido en la app Golify.`;
  const path = `/${locale}/team/${id}`;

  return {
    title,
    description: desc,
    alternates: localeAlternates(locale as Locale, `/team/${id}`),
    openGraph: {
      title,
      description: desc,
      url: absoluteUrl(path),
      siteName: 'Golify',
      type: 'website',
      images: info.team.logo ? ogImages(info.team.logo, name) : ogImages(),
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

export default async function TeamPage({ params }: { params: Promise<Params> }) {
  const { locale, id } = await params;
  const teamId = Number(id);
  if (!Number.isFinite(teamId)) notFound();

  const info = await getTeam(teamId);
  if (!info) notFound();

  const L = t(locale);
  const [upcoming, recent] = await Promise.all([
    getTeamFixtures(teamId, { next: 6 }),
    getTeamFixtures(teamId, { last: 6 }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: info.team.name,
    sport: 'Soccer',
    logo: info.team.logo,
    url: absoluteUrl(`/${locale}/team/${id}`),
    foundingDate: info.team.founded ? String(info.team.founded) : undefined,
    location: { '@type': 'Country', name: info.team.country },
    ...(info.venue.name
      ? {
          homeLocation: {
            '@type': 'StadiumOrArena',
            name: info.venue.name,
            address: info.venue.city ?? info.team.country,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src={info.team.logo}
              alt=""
              width={34}
              height={34}
              unoptimized
              className="h-[34px] w-[34px] object-contain"
            />
          </span>
          <div>
            <DisplayHeading as="h1" className="text-2xl sm:text-3xl">
              {info.team.name}
            </DisplayHeading>
            <p className="mt-0.5 text-sm font-bold text-muted-foreground">
              {info.team.country}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {info.team.founded ? (
            <div>
              <dt className="font-bold text-muted-foreground">{L.founded}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{info.team.founded}</dd>
            </div>
          ) : null}
          {info.venue.name ? (
            <div>
              <dt className="font-bold text-muted-foreground">{L.stadium}</dt>
              <dd className="mt-0.5 font-semibold">
                {info.venue.name}
                {info.venue.city ? `, ${info.venue.city}` : ''}
              </dd>
            </div>
          ) : null}
          {info.venue.capacity ? (
            <div>
              <dt className="font-bold text-muted-foreground">{L.capacity}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {info.venue.capacity.toLocaleString(locale)}
              </dd>
            </div>
          ) : null}
        </dl>

        {upcoming.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide uppercase">
              {L.upcoming}
            </h2>
            <FixtureGrid fixtures={upcoming} locale={locale} labels={L} />
          </section>
        ) : null}

        {recent.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide uppercase">
              {L.recent}
            </h2>
            <FixtureGrid fixtures={recent} locale={locale} labels={L} />
          </section>
        ) : null}

        {upcoming.length === 0 && recent.length === 0 ? (
          <p className="mt-10 font-semibold text-muted-foreground">{L.noFixtures}</p>
        ) : null}

        <p className="mt-9 leading-relaxed font-semibold text-muted-foreground">
          {L.followInApp}
        </p>

        <InstallCTA
          deeplink={`golify://team/${id}`}
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
