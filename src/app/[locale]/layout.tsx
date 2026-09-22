import { I18nProvider } from '@/components/I18nProvider';
import { InAppBrowserBanner } from '@/components/InAppBrowserHint';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Manrope, Jost } from 'next/font/google';
import { notFound } from 'next/navigation';
import {
  SITE_URL,
  SITE_NAME,
  LOGO_URL,
  SAME_AS,
  APP_STORE_URL,
  PLAY_STORE_URL,
  DEFAULT_OG_IMAGE,
  LOCALES,
  ogImages,
  type Locale,
} from '@/lib/site';
import '../globals.css';

// This is the root layout, and it lives under the locale segment on purpose:
// it is the only place that knows which language the page is in, so it is the
// only place that can put the right value in <html lang>. Next documents this
// exact arrangement for internationalized apps. Before, the root layout
// hardcoded lang="es" and every English page claimed to be Spanish.

// Manrope drives all body/UI copy — it's one of the app's own bundled fonts
// (constants/theme.ts `Fonts`), so this is shared vocabulary, not a pick of
// convenience. Jost is the display face (`font-display` utility): the app's
// real display face, Futura Extra Bold, is a licensed font file bundled in
// the app and unavailable on the web — Jost is the closest free geometric
// substitute for big all-caps headlines.
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
});

const jost = Jost({
  variable: '--font-jost',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Brand-first title + description per locale. The brand name leads so Google
// associates the "golify" query with this domain over lookalikes.
const BRAND = {
  es: {
    title: 'Golify — fútbol en vivo, retas, quinielas y stickers',
    description:
      'Golify: sigue partidos en vivo, compite en retas y quinielas con amigos, colecciona stickers y explora el catálogo EA FC. La app de fútbol de México y Latinoamérica.',
    ogLocale: 'es_MX',
    htmlLang: 'es-MX',
  },
  en: {
    title: 'Golify — live football scores, pools and sticker album',
    description:
      'Golify: follow matches live, compete in prediction tournaments and pools with friends, collect stickers and browse the EA FC catalogue. The football app for Latin America.',
    ogLocale: 'en_US',
    htmlLang: 'en',
  },
  pt: {
    title: 'Golify — placar ao vivo, Retas, bolões e figurinhas',
    description:
      'Golify: acompanhe os jogos ao vivo, dispute Retas e bolões com os amigos, colecione figurinhas e explore o catálogo do EA FC. O app de futebol do Brasil e da América Latina.',
    ogLocale: 'pt_BR',
    htmlLang: 'pt-BR',
  },
} as const;

function brand(locale: string) {
  return BRAND[locale as keyof typeof BRAND] ?? BRAND.es;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const b = brand(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: b.title,
    description: b.description,
    applicationName: SITE_NAME,
    openGraph: {
      title: b.title,
      description: b.description,
      siteName: SITE_NAME,
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      locale: b.ogLocale,
      images: ogImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title: b.title,
      description: b.description,
      images: [DEFAULT_OG_IMAGE],
    },
    other: {
      'apple-itunes-app': 'app-id=6772339872',
    },
  };
}

// Brand-entity structured data. Without an Organization node Google has no
// canonical signal mapping the brand "Golify" → golify.futbol, so lookalike
// domains (e.g. golify.net) own the brand query + AI overview. This + sameAs
// (Instagram/TikTok/app stores) consolidates the entity onto our domain.
function brandJsonLd(locale: string) {
  const b = brand(locale);
  const markets = ['México', 'Brasil', 'Argentina', 'Colombia', 'United States'];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        legalName: 'Golify Futbol',
        alternateName: ['Golify Fútbol', 'Golify App'],
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: LOGO_URL },
        image: LOGO_URL,
        description: b.description,
        foundingDate: '2026-05',
        foundingLocation: { '@type': 'Country', name: 'México' },
        areaServed: markets.map((name) => ({ '@type': 'Country', name })),
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contacto@golify.futbol',
          contactType: 'customer support',
          availableLanguage: ['es', 'en', 'pt'],
        },
        sameAs: SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: b.htmlLang,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'MobileApplication',
        '@id': `${SITE_URL}/#app`,
        name: SITE_NAME,
        operatingSystem: 'iOS, Android',
        applicationCategory: 'SportsApplication',
        url: SITE_URL,
        // The app ships in Spanish and English; this site also speaks
        // Portuguese. Claiming a pt app would be a lie.
        inLanguage: ['es', 'en'],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
        publisher: { '@id': `${SITE_URL}/#organization` },
        // External authoritative profiles validate the app entity for Google.
        sameAs: [APP_STORE_URL, PLAY_STORE_URL],
      },
    ],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!LOCALES.includes(locale as Locale)) {
    notFound();
  }

  return (
    <html
      lang={brand(locale).htmlLang}
      className={`${manrope.variable} ${jost.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd(locale)) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('golify-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <ThemeProvider defaultTheme="dark">
          <I18nProvider locale={locale as Locale}>
            {/* Instagram/TikTok/Facebook webview → hint on how to escape it. */}
            <InAppBrowserBanner />
            {children}
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
