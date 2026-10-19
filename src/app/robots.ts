import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { ROUTE_LOCALES, sectionPath } from '@/lib/routes';

// Explicitly allow general crawlers AND the AI answer engines (search and
// live browsing), so ChatGPT, Perplexity, Claude, etc. can read and cite
// Golify. Model-training crawlers are blocked (oct 2026): they cost crawl and
// CPU and send no visitors. Google-Extended and Applebot-Extended are opt-out
// tokens (no crawler of their own): blocking them keeps the pages out of
// Gemini/Apple model training without touching Google Search or Siri.
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'OAI-SearchBot', // ChatGPT search
    'ChatGPT-User', // ChatGPT live browsing
    'PerplexityBot',
    'Perplexity-User',
    'Claude-User',
    'DuckAssistBot',
    'Claude-SearchBot', // Claude web search
    'Amzn-SearchBot', // Alexa+/Rufus answers (not the Amazonbot crawler, which is blocked)
    'Applebot', // Siri, Spotlight, Apple Intelligence
    'MistralAI-User', // Le Chat browsing
    'YouBot', // You.com
    'Bravebot', // Brave Search
  ];

  // `/go/` is the redirect/install funnel and `/api/` is JSON — no content.
  // Search result pages are infinite, thin and noindex: keep crawl budget off
  // them (/es/buscar, /pt/buscar, /en/search).
  //
  // Heavy families (players, H2H, EA FC cards, stadiums, referees) are tens of
  // thousands of URLs, each a fresh server render plus API-Football calls. On
  // Vercel Hobby crawlers on them spent the whole monthly Fluid CPU budget in
  // a day (oct 2026), so they stay closed to crawlers until the plan allows it.
  // They are also out of the sitemap (GOLIFY_FULL_SITEMAPS).
  const heavy = (['player', 'h2h', 'fc', 'stadium', 'referee'] as const).flatMap((s) =>
    ROUTE_LOCALES.map((l) => `${sectionPath(s, l)}/`),
  );
  const disallow = ['/go/', '/api/', ...ROUTE_LOCALES.map((l) => sectionPath('search', l)), ...heavy];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Each first visit to a page costs API-Football calls shared with the
      // app; slow down the crawlers that honour Crawl-delay (Bing and most AI
      // bots — Google ignores it and paces itself).
      { userAgent: 'Bingbot', allow: '/', disallow, crawlDelay: 5 },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: '/', disallow, crawlDelay: 10 })),
      // Training and bulk SEO crawlers: heavy traffic, no referrals or citations.
      { userAgent: ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'cohere-ai', 'meta-externalagent', 'CCBot', 'Diffbot', 'ImagesiftBot', 'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot'], disallow: '/' },
    ],
    // The index lists every child; the news sitemap is separate (Google News).
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
