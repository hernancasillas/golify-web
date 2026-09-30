// Analytics events (plan §0.6) — the fixed GA4 names every part of the site
// uses. Client-safe: no server imports.
//
// Events go to GA4 through gtag when NEXT_PUBLIC_GA4_ID is configured (see
// components/analytics/AnalyticsScripts.tsx) and to Vercel Analytics as custom
// events. Both are no-ops when their script is not on the page, so calling
// `track` is always safe.

import { track as vercelTrack } from '@vercel/analytics';

export type EventName =
  | 'app_install_click'
  | 'download_file'
  | 'quiniela_create_click'
  | 'email_signup'
  | 'qr_scan'
  | 'share_click';

export type EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: EventName, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v;
  try {
    window.gtag?.('event', event, clean);
  } catch {}
  try {
    vercelTrack(event, clean);
  } catch {}
}

/** Standard UTM (plan §0.7): utm_source=golify_web&utm_medium={page type}&utm_campaign={slug}. */
export function withUtm(url: string, medium: string, campaign: string): string {
  const u = new URL(url, 'https://golify.futbol');
  u.searchParams.set('utm_source', 'golify_web');
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}
