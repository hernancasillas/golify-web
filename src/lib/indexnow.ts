// IndexNow (plan A1.7): tells Bing, Yandex, Seznam, Naver… that a URL changed,
// so a finished match is recrawled in minutes instead of days. Google does
// not use IndexNow; it reads the sitemaps' lastmod instead.
//
// The key is public by design: search engines verify ownership by fetching
// https://golify.futbol/{key}.txt and comparing its body with the key.

import { SITE_URL } from '@/lib/site';

export const INDEXNOW_KEY = 'fb1574fed3d1ec325545df6f67bfa53b';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000; // protocol limit per request

export interface IndexNowResult {
  submitted: number;
  skipped?: 'not-production';
  statuses: number[];
}

/** Submit absolute golify.futbol URLs. No-op outside production, so preview
 *  deployments and local dev never announce URLs that do not exist live. */
export async function submitUrls(urls: string[]): Promise<IndexNowResult> {
  const list = [...new Set(urls)].filter((u) => u.startsWith(`${SITE_URL}/`));
  if (process.env.VERCEL_ENV !== 'production') {
    return { submitted: 0, skipped: 'not-production', statuses: [] };
  }
  const host = new URL(SITE_URL).host;
  const statuses: number[] = [];
  for (let i = 0; i < list.length; i += BATCH) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: list.slice(i, i + BATCH),
      }),
      cache: 'no-store',
    });
    statuses.push(res.status);
  }
  return { submitted: list.length, statuses };
}
