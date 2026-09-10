import type { MetadataRoute } from 'next';
import { SITE_URL, LOCALES } from '@/lib/site';

export const revalidate = 3600;

function localized(path: string): MetadataRoute.Sitemap {
  // Emit one entry per locale + hreflang alternates for international ranking.
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]),
      ),
    },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['', '/features', '/nosotros', '/privacy', '/terms'];
  return staticPaths.flatMap(localized);
}
