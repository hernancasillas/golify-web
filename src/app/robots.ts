import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Explicitly allow general crawlers AND the AI/answer-engine crawlers.
// Goal: let ChatGPT, Perplexity, Claude, Gemini, etc. read our content pages
// so they can cite Golify when users ask World Cup questions.
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

  // `/go/` is the redirect/install funnel — no content, keep it out of the index.
  const disallow = ['/go/'];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: '/', disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
