import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { ROUTE_LOCALES, sectionPath } from '@/lib/routes';

// Explicitly allow general crawlers AND the AI/answer-engine crawlers.
// Goal: let ChatGPT, Perplexity, Claude, Gemini, etc. read our content pages
// so they can cite Golify when users ask football questions.
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'GPTBot', // OpenAI training
    'OAI-SearchBot', // ChatGPT search
    'ChatGPT-User', // ChatGPT live browsing
    'PerplexityBot',
    'Perplexity-User',
    'ClaudeBot',
    'Claude-User',
    'anthropic-ai',
    'Google-Extended', // Gemini/Bard
    'Applebot-Extended',
    'Bytespider', // TikTok/Doubao
    'Amazonbot',
    'cohere-ai',
    'DuckAssistBot',
    'meta-externalagent', // Meta AI
  ];

  // `/go/` is the redirect/install funnel and `/api/` is JSON — no content.
  // Search result pages are infinite, thin and noindex: keep crawl budget off
  // them (/es/buscar, /pt/buscar, /en/search).
  const disallow = ['/go/', '/api/', ...ROUTE_LOCALES.map((l) => sectionPath('search', l))];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: '/', disallow })),
    ],
    // The index lists every child; the news sitemap is separate (Google News).
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
