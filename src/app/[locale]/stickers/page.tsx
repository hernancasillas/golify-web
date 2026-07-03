import type { Metadata } from 'next';
import { InstallCTA } from '@/components/InstallCTA';
import { SmartAppOpen } from '@/components/SmartAppOpen';
import {
  SITE_NAME,
  SITE_URL,
  IOS_APP_ID,
  localeAlternates,
  absoluteUrl,
  type Locale,
} from '@/lib/site';

// SSR content page for the Golify sticker album feature. Real, crawlable
// description of what the feature does (collect, scan, compare, trade, chat)
// so Google and AI answer-engines can index/cite it, with a soft hand-off to
// the app for users who have it installed.
export const revalidate = 86400;

const DEEPLINK = 'golify://stickers';

type Params = { locale: string };

// ---- page-local i18n ----
const STR = {
  es: {
    kicker: 'Stickers',
    title: 'Álbum de stickers del Mundial 2026',
    intro:
      'Colecciona, escanea e intercambia los stickers del Mundial 2026 en Golify. Lleva el control de tu álbum digital —lo que tienes, lo que te falta y tus repetidas— y completa la colección intercambiando con otros coleccionistas.',
    featuresTitle: 'Qué puedes hacer',
    features: [
      {
        h: 'Sigue el progreso de tu álbum',
        p: 'Ve al instante cuántos stickers tienes, cuántos te faltan y cuáles tienes repetidos.',
      },
      {
        h: 'Escanea y añade stickers',
        p: 'Registra tus stickers rápido con el escáner y mantén tu álbum siempre actualizado.',
      },
      {
        h: 'Encuentra coleccionistas cercanos',
        p: 'Descubre a otros coleccionistas cerca de ti para cambiar las que te faltan.',
      },
      {
        h: 'Compara e intercambia',
        p: 'Compara tu álbum con el de otro coleccionista y proponle un intercambio de repetidas.',
      },
      {
        h: 'Chatea para cerrar el cambio',
        p: 'Acuerda y confirma cada intercambio desde el chat integrado con otros coleccionistas.',
      },
    ],
    howTitle: 'Cómo funciona',
    steps: [
      'Descarga Golify y abre el álbum de stickers.',
      'Escanea o marca los stickers que ya tienes.',
      'Revisa qué te falta y qué tienes repetido.',
      'Conecta con coleccionistas cercanos e intercambia hasta completar el álbum.',
    ],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      {
        q: '¿Qué es el álbum de stickers de Golify?',
        a: 'Es un álbum digital donde coleccionas, escaneas e intercambias los stickers del Mundial 2026 y sigues tu progreso en tiempo real.',
      },
      {
        q: '¿Cómo intercambio stickers repetidos?',
        a: 'Golify te muestra coleccionistas cercanos, compara tu álbum con el suyo y te deja proponer y confirmar intercambios desde el chat.',
      },
      {
        q: '¿Es gratis?',
        a: 'Descargar Golify es gratis y puedes empezar tu álbum de stickers. Algunas funciones premium requieren suscripción.',
      },
    ],
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
  },
  en: {
    kicker: 'Stickers',
    title: 'World Cup 2026 sticker album',
    intro:
      'Collect, scan and trade World Cup 2026 stickers on Golify. Track your digital album —what you own, what you are missing and your duplicates— and complete the collection by trading with other collectors.',
    featuresTitle: 'What you can do',
    features: [
      {
        h: 'Track your album progress',
        p: 'See at a glance how many stickers you own, how many are missing and which ones you have as duplicates.',
      },
      {
        h: 'Scan and add stickers',
        p: 'Log your stickers fast with the scanner and keep your album always up to date.',
      },
      {
        h: 'Find nearby collectors',
        p: 'Discover other collectors near you to swap the stickers you are missing.',
      },
      {
        h: 'Compare and trade',
        p: 'Compare your album with another collector and propose a trade of duplicates.',
      },
      {
        h: 'Chat to close the trade',
        p: 'Agree and confirm every swap from the built-in chat with other collectors.',
      },
    ],
    howTitle: 'How it works',
    steps: [
      'Download Golify and open the sticker album.',
      'Scan or mark the stickers you already own.',
      'Check what you are missing and what you have as duplicates.',
      'Connect with nearby collectors and trade until your album is complete.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'What is the Golify sticker album?',
        a: 'It is a digital album where you collect, scan and trade World Cup 2026 stickers and track your progress in real time.',
      },
      {
        q: 'How do I trade duplicate stickers?',
        a: 'Golify shows you nearby collectors, compares your album with theirs and lets you propose and confirm trades from the chat.',
      },
      {
        q: 'Is it free?',
        a: 'Downloading Golify is free and you can start your sticker album. Some premium features require a subscription.',
      },
    ],
    open: 'Open in Golify',
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
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const L = t(locale);
  const desc = L.intro;
  return {
    title: `${L.title} | ${SITE_NAME}`,
    description: desc,
    alternates: localeAlternates(locale as Locale, '/stickers'),
    openGraph: {
      title: `${L.title} | ${SITE_NAME}`,
      description: desc,
      url: absoluteUrl(`/${locale}/stickers`),
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: L.title, description: desc },
    other: {
      'apple-itunes-app': `app-id=${IOS_APP_ID}, app-argument=${DEEPLINK}`,
    },
  };
}

export default async function StickersPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const L = t(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntity: L.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

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
        <h2 className="text-xl font-semibold">{L.featuresTitle}</h2>
        <ul className="mt-4 space-y-5">
          {L.features.map((f) => (
            <li key={f.h}>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                {f.h}
              </h3>
              <p className="mt-1 text-neutral-700 dark:text-neutral-300">
                {f.p}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{L.howTitle}</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-neutral-700 dark:text-neutral-300">
          {L.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
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
