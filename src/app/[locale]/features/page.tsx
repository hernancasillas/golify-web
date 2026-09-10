import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { FeatureScroller, type FeatureStory } from '@/components/FeatureScroller';
import { Reveal } from '@/components/Reveal';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading, DownloadGlyph, Eyebrow, PillLink } from '@/components/revamp/ui';
import {
  SITE_NAME,
  IOS_APP_ID,
  APP_STORE_URL,
  PLAY_STORE_URL,
  localeAlternates,
  absoluteUrl,
  type Locale,
} from '@/lib/site';

export const revalidate = 86400;

type Params = { locale: string };

// Two PNGs per story — `<base>-dark.png` / `<base>-light.png` — dropped in
// public/features/. Same inverted-contrast convention as the Home hero: the
// dark-UI capture shows on the light site, the light-UI capture on the dark
// site. Each is rendered as soon as its file exists — nothing else to wire up.
const STORIES = [
  { key: 'matchView', base: 'match-view', tone: 'mint' as const },
  { key: 'social', base: 'social', tone: 'gold' as const },
  { key: 'followedLeague', base: 'followed-league', tone: 'mint' as const },
];

const STR = {
  es: {
    kicker: 'Funciones',
    title: 'Golify por dentro',
    intro: 'Así se ve seguir el fútbol como se debe: en vivo, con tus amigos y con tu liga siempre a la mano.',
    stories: {
      matchView: {
        eyebrow: 'Partido en vivo',
        title: 'Cada jugada, en tiempo real',
        body: 'Marcador, goleadores, tarjetas y minuto a minuto sin recargar nada. Entra a cualquier partido y vívelo como si estuvieras en el estadio.',
      },
      social: {
        eyebrow: 'Social',
        title: 'El fútbol se vive en grupo',
        body: 'Sigue a tus amigos, compara predicciones y arma la conversación del partido en un solo lugar, sin salir de la app.',
      },
      followedLeague: {
        eyebrow: 'Tu liga',
        title: 'Todo de tu liga favorita, junto',
        body: 'Tabla, goleadores y el próximo partido de la liga que sigues, siempre a un tap de distancia.',
      },
    },
    finalTitle: '¿Listo para verlo tú mismo?',
    finalBody: 'Descarga Golify y entra directo al fútbol en vivo.',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    placeholder: 'Captura pendiente',
  },
  en: {
    kicker: 'Features',
    title: 'Golify, up close',
    intro: 'This is what following football the right way looks like: live, with your friends, and your league always at hand.',
    stories: {
      matchView: {
        eyebrow: 'Live match',
        title: 'Every play, in real time',
        body: 'Score, scorers, cards and minute-by-minute without reloading a thing. Open any match and live it like you were at the stadium.',
      },
      social: {
        eyebrow: 'Social',
        title: 'Football is better with your crew',
        body: 'Follow your friends, compare predictions and build the matchday conversation in one place, without leaving the app.',
      },
      followedLeague: {
        eyebrow: 'Your league',
        title: 'Everything about your league, together',
        body: 'Table, top scorers and the next match of the league you follow, always one tap away.',
      },
    },
    finalTitle: 'Ready to see it for yourself?',
    finalBody: 'Download Golify and jump straight into live football.',
    ios: 'Download for iOS',
    android: 'Download for Android',
    placeholder: 'Screenshot coming soon',
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

function screenshotPath(file: string): string | null {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', 'features', file))
      ? `/features/${file}`
      : null;
  } catch {
    return null;
  }
}

// Resolves the dark/light pair for one story. If only one variant has been
// dropped in, it's used for both themes rather than showing half a
// placeholder — the gap only shows once neither file exists yet.
function resolveThemedScreenshots(base: string): {
  dark: string | null;
  light: string | null;
} {
  const dark = screenshotPath(`${base}-dark.png`);
  const light = screenshotPath(`${base}-light.png`);
  return { dark: dark ?? light, light: light ?? dark };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const L = t(locale);
  return {
    title: `${L.title} | ${SITE_NAME}`,
    description: L.intro,
    alternates: localeAlternates(locale as Locale, '/features'),
    openGraph: {
      title: `${L.title} | ${SITE_NAME}`,
      description: L.intro,
      url: absoluteUrl(`/${locale}/features`),
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: L.title, description: L.intro },
    other: { 'apple-itunes-app': `app-id=${IOS_APP_ID}` },
  };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const L = t(locale);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <header className="mx-auto max-w-2xl px-5 pt-2 pb-4 text-center sm:px-8">
        <Eyebrow tone="mint">{L.kicker}</Eyebrow>
        <DisplayHeading as="h1" className="mt-5 text-4xl sm:text-5xl">
          {L.title}
        </DisplayHeading>
        <p className="mt-5 text-lg leading-relaxed font-semibold text-muted-foreground">
          {L.intro}
        </p>
      </header>

      <FeatureScroller
        stories={STORIES.map(({ key, base, tone }): FeatureStory => {
          const { dark, light } = resolveThemedScreenshots(base);
          return {
            key,
            tone,
            ...L.stories[key as keyof typeof L.stories],
            imageSrcDark: dark,
            imageSrcLight: light,
            placeholderLabel: L.placeholder,
          };
        })}
      />

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal className="rounded-3xl bg-[linear-gradient(120deg,#00C853,#FFD60A)] px-8 py-16 text-center sm:px-16 sm:py-20">
          <h2 className="font-display text-4xl leading-none font-bold tracking-wide text-[#070710] uppercase sm:text-5xl">
            {L.finalTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-[#070710]/75">
            {L.finalBody}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <PillLink href={APP_STORE_URL} variant="dark">
              <DownloadGlyph /> {L.ios}
            </PillLink>
            <PillLink href={PLAY_STORE_URL} variant="dark">
              <DownloadGlyph /> {L.android}
            </PillLink>
          </div>
        </Reveal>
      </section>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
