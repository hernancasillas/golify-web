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

// The tournament hub. Every World Cup match page points its schema `superEvent`
// at this URL, which used to 404 — an invalid reference on ~100 match pages.
export const revalidate = 86400;

const STR = {
  es: {
    eyebrow: 'Mundial 2026',
    title: 'Mundial 2026: resultados y llaves',
    intro:
      'Cómo terminó el Mundial 2026 de Estados Unidos, Canadá y México: el campeón, la final y todas las llaves de eliminación directa, partido por partido.',
    championLabel: 'Campeón',
    beat: 'venció a',
    inFinal: 'en la final',
    bracket: 'Ver el cuadro completo',
    today: 'Partidos de hoy',
    live: 'Resultados en vivo',
    nextUp: 'Y ahora qué',
    nextBody:
      'El Mundial terminó, pero la temporada de clubes no. En Golify sigues Liga MX, Brasileirão, Liga Argentina, Libertadores, MLS y Champions todo el año.',
    followInApp:
      'Marcadores en vivo, retas con tus amigos, quinielas y álbum de stickers, en una sola app.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
  },
  en: {
    eyebrow: 'World Cup 2026',
    title: 'World Cup 2026: results and bracket',
    intro:
      'How the 2026 World Cup in the United States, Canada and Mexico ended: the champions, the final, and every knockout tie, match by match.',
    championLabel: 'Champions',
    beat: 'beat',
    inFinal: 'in the final',
    bracket: 'See the full bracket',
    today: "Today's matches",
    live: 'Live scores',
    nextUp: "What's next",
    nextBody:
      'The World Cup is over, the club season is not. Golify follows Liga MX, Brasileirão, Liga Argentina, Copa Libertadores, MLS and the Champions League all year.',
    followInApp:
      'Live scores, pickup games with your friends, pools and a sticker album, in one app.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
  },
  pt: {
    eyebrow: 'Copa 2026',
    title: 'Copa do Mundo 2026: resultados e chaves',
    intro:
      'Como terminou a Copa do Mundo de 2026 nos Estados Unidos, Canadá e México: o campeão, a final e todas as chaves do mata-mata, jogo por jogo.',
    championLabel: 'Campeã',
    beat: 'venceu',
    inFinal: 'na final',
    bracket: 'Ver o chaveamento completo',
    today: 'Jogos de hoje',
    live: 'Placares ao vivo',
    nextUp: 'E agora',
    nextBody:
      'A Copa acabou, a temporada de clubes não. No Golify você acompanha o Brasileirão, a Libertadores, a Sul-Americana, o Campeonato Argentino, a Liga MX, a MLS e a Champions o ano todo.',
    followInApp:
      'Placar ao vivo, Retas com os amigos, bolões e álbum de figurinhas, em um só app.',
    openApp: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
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
    alternates: localeAlternates(locale as Locale, '/world-cup'),
    openGraph: {
      title,
      description: L.intro,
      url: `${SITE_URL}/${locale}/world-cup`,
      siteName: 'Golify',
      type: 'website',
      images: ogImages(),
    },
    twitter: { card: 'summary_large_image', title, description: L.intro },
  };
}

export default async function WorldCupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const L = t(locale);
  const fixtures = await getTournamentFixtures(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON);
  const winner = champion(fixtures);

  // The hub shows the business end; the bracket page carries the full ladder.
  const lateRounds = fixtures.filter((f) =>
    ['Quarter-finals', 'Semi-finals', '3rd Place Final', 'Final'].includes(
      f.league.round,
    ),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(worldCupEventNode(`${SITE_URL}/${locale}/world-cup`)),
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

        <KnockoutRounds fixtures={lateRounds} locale={locale} />

        <p className="mt-8">
          <Link
            href={`/${locale}/world-cup/bracket`}
            className="text-sm font-bold text-primary underline"
          >
            {L.bracket}
          </Link>
        </p>

        <section className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">
            {L.nextUp}
          </h2>
          <p className="mt-2 leading-relaxed font-semibold text-muted-foreground">
            {L.nextBody}
          </p>
          <p className="mt-4 flex flex-wrap gap-4">
            <Link href={`/${locale}/today`} className="text-sm font-bold text-primary underline">
              {L.today}
            </Link>
            <Link href={`/${locale}/live`} className="text-sm font-bold text-primary underline">
              {L.live}
            </Link>
          </p>
        </section>

        <p className="mt-9 leading-relaxed font-semibold text-muted-foreground">
          {L.followInApp}
        </p>

        <InstallCTA
          deeplink="golify://world-cup"
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
