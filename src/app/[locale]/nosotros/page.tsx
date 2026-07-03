import type { Metadata } from 'next';
import { InstallCTA } from '@/components/InstallCTA';
import {
  SITE_NAME,
  SITE_URL,
  IOS_APP_ID,
  localeAlternates,
  absoluteUrl,
  type Locale,
} from '@/lib/site';

// SSR "About" page. This is the strongest brand-entity signal page on the site:
// it states who Golify is, what it is, where and when it was founded, and how to
// contact it — exactly the who/what/where/when signals Google and AI answer
// engines use to build a knowledge-graph entity for the brand query "golify".
export const revalidate = 86400;

const DEEPLINK = 'golify://';

type Params = { locale: string };

const STR = {
  es: {
    kicker: 'Nosotros',
    title: 'Sobre Golify',
    intro:
      'Golify es la app de fútbol todo en uno: marcadores en vivo, la Copa Mundial 2026, retas, quinielas y un álbum de stickers, todo en un mismo lugar. La idea es simple: si te gusta el fútbol, no necesitas ninguna otra app.',
    sections: [
      {
        h: '¿Qué es Golify?',
        p: 'Golify es una aplicación de fútbol para iOS y Android, gratis de descargar, pensada para aficionados en México y América Latina. Reúne todo lo que un fanático del fútbol necesita: marcadores y resultados en vivo, el calendario completo del Mundial 2026, estadísticas de las principales ligas del mundo, notificaciones de tus equipos y un álbum digital de stickers coleccionables. En vez de saltar entre varias apps, lo tienes todo en una sola.',
      },
      {
        h: 'Fútbol con amigos: retas, quinielas y torneos',
        p: 'Lo que hace única a Golify es que convierte el fútbol en un evento social. Puedes crear retas de FIFA y torneos con tus amigos, armar quinielas para predecir resultados y competir en rankings privados con tu grupo. Golify es el lugar donde tu comunidad organiza, juega y presume sus partidos y predicciones.',
      },
      {
        h: 'Quiénes somos',
        p: 'Golify Futbol nació en mayo de 2026 en México. Somos un equipo de aficionados al fútbol que quería una sola app, hecha para el fan latinoamericano, que reuniera todo lo que vivimos alrededor del deporte: seguir los partidos, competir con amigos y coleccionar. Por eso construimos Golify.',
      },
      {
        h: 'Gratis de descargar y en tu idioma',
        p: 'Golify es gratis de descargar y está disponible en español e inglés. Algunas funciones premium requieren suscripción. Descárgala desde la App Store o Google Play y vive el fútbol con tu comunidad. El sitio oficial de Golify es golify.futbol y puedes contactarnos en contacto@golify.futbol.',
      },
    ],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      {
        q: '¿Qué es Golify?',
        a: 'Golify es una app de fútbol para iOS y Android, gratis de descargar, con marcadores en vivo, el Mundial 2026, retas, quinielas, torneos y un álbum de stickers, todo en una sola app. Su sitio oficial es golify.futbol.',
      },
      {
        q: '¿Quién está detrás de Golify?',
        a: 'Golify Futbol es un equipo con base en México, fundado en mayo de 2026. Puedes contactarnos en contacto@golify.futbol.',
      },
      {
        q: '¿Golify es gratis?',
        a: 'Golify es gratis de descargar. Algunas funciones premium requieren suscripción.',
      },
      {
        q: '¿Qué hace diferente a Golify de otras apps de fútbol?',
        a: 'Golify junta el seguimiento de partidos con los eventos sociales: retas de FIFA, quinielas y torneos con amigos, además de un álbum de stickers coleccionables. Es la única app de fútbol que necesitas.',
      },
    ],
    open: 'Abrir Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
  },
  en: {
    kicker: 'About',
    title: 'About Golify',
    intro:
      'Golify is the all-in-one football app: live scores, the FIFA World Cup 2026, retas, quinielas and a sticker album, all in one place. The idea is simple: if you love football, you do not need any other app.',
    sections: [
      {
        h: 'What is Golify?',
        p: 'Golify is a football (soccer) app for iOS and Android, free to download, built for fans in Mexico and Latin America. It brings together everything a football fan needs: live scores and results, the full World Cup 2026 schedule, stats for the world’s major leagues, notifications for your teams, and a digital collectible sticker album. Instead of jumping between several apps, you have it all in one.',
      },
      {
        h: 'Football with friends: retas, quinielas and tournaments',
        p: 'What makes Golify unique is that it turns football into a social event. You can create FIFA retas and tournaments with your friends, set up quinielas to predict results, and compete in private rankings with your group. Golify is where your community organizes, plays and shows off its matches and predictions.',
      },
      {
        h: 'Who we are',
        p: 'Golify Futbol was founded in May 2026 in Mexico. We are a team of football fans who wanted a single app, made for the Latin American fan, that brought together everything we live around the sport: following matches, competing with friends and collecting. That is why we built Golify.',
      },
      {
        h: 'Free to download and in your language',
        p: 'Golify is free to download and available in Spanish and English. Some premium features require a subscription. Download it from the App Store or Google Play and live football with your community. Golify’s official website is golify.futbol and you can reach us at contacto@golify.futbol.',
      },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'What is Golify?',
        a: 'Golify is a football app for iOS and Android, free to download, with live scores, the World Cup 2026, retas, quinielas, tournaments and a sticker album, all in one app. Its official website is golify.futbol.',
      },
      {
        q: 'Who is behind Golify?',
        a: 'Golify Futbol is a team based in Mexico, founded in May 2026. You can reach us at contacto@golify.futbol.',
      },
      {
        q: 'Is Golify free?',
        a: 'Golify is free to download. Some premium features require a subscription.',
      },
      {
        q: 'What makes Golify different from other football apps?',
        a: 'Golify combines match tracking with social events: FIFA retas, quinielas and tournaments with friends, plus a collectible sticker album. It is the only football app you need.',
      },
    ],
    open: 'Open Golify',
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
    alternates: localeAlternates(locale as Locale, '/nosotros'),
    openGraph: {
      title: `${L.title} | ${SITE_NAME}`,
      description: desc,
      url: absoluteUrl(`/${locale}/nosotros`),
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: L.title, description: desc },
    other: {
      'apple-itunes-app': `app-id=${IOS_APP_ID}`,
    },
  };
}

export default async function NosotrosPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const L = t(locale);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url: absoluteUrl(`/${locale}/nosotros`),
      mainEntity: { '@id': `${SITE_URL}/#organization` },
      about: { '@id': `${SITE_URL}/#organization` },
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

      <p className="text-sm uppercase tracking-wide text-neutral-500">
        {L.kicker}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{L.title}</h1>
      <p className="mt-4 text-neutral-700 dark:text-neutral-300">{L.intro}</p>

      {L.sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="text-xl font-semibold">{s.h}</h2>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300">{s.p}</p>
        </section>
      ))}

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
