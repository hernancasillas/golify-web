// Google News sitemap: news pieces published in the last 48 hours. Empty (but
// valid) urlset when there are none.

import { getNews, piecePath } from '@/lib/editorial/content';
import { absolute } from '@/lib/seo';

export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LANG = { es: 'es', pt: 'pt', en: 'en' } as const;

export function GET() {
  const cutoff = Date.now() - 48 * 3600_000;
  const items = (['es', 'pt', 'en'] as const)
    .flatMap((l) => getNews(l))
    .filter((n) => n.published.length > 10 && new Date(n.published).getTime() >= cutoff)
    .map(
      (n) => `  <url>
    <loc>${esc(absolute(piecePath(n)))}</loc>
    <news:news>
      <news:publication><news:name>Golify</news:name><news:language>${LANG[n.locale]}</news:language></news:publication>
      <news:publication_date>${new Date(n.published).toISOString()}</news:publication_date>
      <news:title>${esc(n.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
