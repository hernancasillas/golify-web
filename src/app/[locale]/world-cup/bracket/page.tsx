import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTournamentFixtures } from '@/lib/api-football';
import { KnockoutRounds, champion } from '@/components/KnockoutRounds';
import { InstallCTA } from '@/components/InstallCTA';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading, Eyebrow } from '@/components/revamp/ui';
import {
  SITE_URL,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
  localeAlternates,
  ogImages,
  worldCupEventNode,
  type Locale,
} from '@/lib/site';

// This URL was the best-performing page in Search Console (position ~8.7) and
// it 404'd after the reskin deleted the route, while next.config still
// redirected six keyword aliases into it. The tournament is over, so the page
// is now an archive of the finished bracket — same URL, real content, and the
// aliases resolve again.
export const revalidate = 86400;

const STR = {
  es: {
    eyebrow: 'Mundial 2026',
    title: 'Llaves del Mundial 2026',
    intro:
      'El cuadro completo de eliminación directa del Mundial 2026, desde los dieciseisavos hasta la final, con todos los resultados. Toca cualquier llave para ver el partido.',
    championLabel: 'Campeón',
    beat: 'venció a',
    inFinal: 'en la final',
    hub: 'Todo el Mundial 2026',
    today: 'Partidos de hoy',
    live: 'Resultados en vivo',
    followInApp:
      'Golify te sigue el fútbol todo el año: marcadores en vivo, retas, quinielas y álbum de stickers.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
  },
  en: {
    eyebrow: 'World Cup 2026',
    title: 'World Cup 2026 bracket',
    intro:
      'The full 2026 World Cup knockout bracket, from the round of 32 to the final, with every result. Tap any tie to open the match.',
    championLabel: 'Champions',
    beat: 'beat',
    inFinal: 'in the final',
    hub: 'All of World Cup 2026',
    today: "Today's matches",
    live: 'Live scores',
    followInApp:
      'Golify follows football all year: live scores, pickup games, pools and a sticker album.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
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
  const title = `${L.title} — resultados completos | Golify`;
  const titleEn = `${L.title} — full results | Golify`;
  const name = locale === 'en' ? titleEn : title;

  return {
    title: name,
    description: L.intro,
    alternates: localeAlternates(locale as Locale, '/world-cup/bracket'),
    openGraph: {
      title: name,
      description: L.intro,
      url: `${SITE_URL}/${locale}/world-cup/bracket`,
      siteName: 'Golify',
      type: 'website',
      images: ogImages(),
    },
    twitter: { card: 'summary_large_image', title: name, description: L.intro },
  };
}

export default async function BracketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const L = t(locale);
  const fixtures = await getTournamentFixtures(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON);
  const winner = champion(fixtures);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            worldCupEventNode(`${SITE_URL}/${locale}/world-cup/bracket`),
          ),
        }}
      />
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 sm:px-8">
        <Eyebrow tone="mint">{L.eyebrow}</Eyebrow>
        <DisplayHeading as="h1" className="mt-4 text-3xl sm:text-4xl">
          {L.title}
        </DisplayHeading>
        <p className="mt-4 leading-relaxed font-semibold text-muted-foreground">{L.intro}</p>

        {winner ? (
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
            <Image
              src={winner.logo}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 shrink-0 object-contain"
            />
            <p className="font-semibold">
              <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {L.championLabel}
              </span>
              <br />
              <span className="font-display text-lg font-bold">{winner.name}</span>{' '}
              <span className="text-muted-foreground">
                {L.beat} {winner.runnerUp} {winner.score} {L.inFinal}
              </span>
            </p>
          </div>
        ) : null}

        <KnockoutRounds fixtures={fixtures} locale={locale} />

        <p className="mt-9 leading-relaxed font-semibold text-muted-foreground">
          {L.followInApp}
        </p>

        <InstallCTA
          deeplink="golify://world-cup"
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />

        <p className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/${locale}/world-cup`}
            className="text-sm font-bold text-primary underline"
          >
            {L.hub}
          </Link>
          <Link href={`/${locale}/today`} className="text-sm font-bold text-primary underline">
            {L.today}
          </Link>
          <Link href={`/${locale}/live`} className="text-sm font-bold text-primary underline">
            {L.live}
          </Link>
        </p>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
