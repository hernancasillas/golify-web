import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Manrope, Bebas_Neue } from "next/font/google";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE_ES,
  LOGO_URL,
  SAME_AS,
  APP_STORE_URL,
  PLAY_STORE_URL,
  DEFAULT_OG_IMAGE,
  ogImages,
} from "@/lib/site";
import "./globals.css";

// Manrope drives all body/UI copy; Bebas Neue is the condensed poster display
// face for big all-caps headlines (exposed as the `font-display` utility).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Brand-first title + description (Spanish/Mexico-first). Brand name leads so
// Google associates the "golify" query with this domain over lookalikes.
const TITLE = "Golify — fútbol en vivo, retas, quinielas y stickers";
const DESCRIPTION =
  "Golify: sigue partidos en vivo, compite en retas y quinielas con amigos, colecciona stickers y explora el catálogo EA FC. La app de fútbol en México.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
    locale: "es_MX",
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  other: {
    "apple-itunes-app": "app-id=6772339872",
  },
};

// Brand-entity structured data. Without an Organization node Google has no
// canonical signal mapping the brand "Golify" → golify.futbol, so lookalike
// domains (e.g. golify.net) own the brand query + AI overview. This + sameAs
// (Instagram/TikTok/app stores) consolidates the entity onto our domain.
const BRAND_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "Golify Futbol",
      alternateName: ["Golify Fútbol", "Golify App"],
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL },
      image: LOGO_URL,
      description: SITE_TAGLINE_ES,
      foundingDate: "2026-05",
      foundingLocation: { "@type": "Country", name: "México" },
      areaServed: { "@type": "Country", name: "México" },
      contactPoint: {
        "@type": "ContactPoint",
        email: "contacto@golify.futbol",
        contactType: "customer support",
        availableLanguage: ["es", "en"],
      },
      sameAs: SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es-MX",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "MobileApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      operatingSystem: "iOS, Android",
      applicationCategory: "SportsApplication",
      url: SITE_URL,
      inLanguage: ["es", "en"],
      offers: { "@type": "Offer", price: "0", priceCurrency: "MXN" },
      publisher: { "@id": `${SITE_URL}/#organization` },
      // External authoritative profiles validate the app entity for Google.
      sameAs: [APP_STORE_URL, PLAY_STORE_URL],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${bebasNeue.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(BRAND_JSON_LD) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('golify-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
