'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Vercel Web Analytics and Speed Insights bill per event on Pro. Headless
// scrapers run JavaScript, so without a filter every page they walk is a paid
// event (oct 2026: 100 % "desktop", 73 % Linux, ~9 pages per visitor, almost
// no referrers). Desktop Linux is a rounding error among real visitors of a
// mobile-first football site, so it goes with the automation flags.
function isAutomated(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent || '';
  return (
    navigator.webdriver === true ||
    /HeadlessChrome|PhantomJS|Puppeteer|Playwright|bot|crawler|spider/i.test(ua) ||
    (/X11; (?:Linux|Ubuntu|Fedora)/i.test(ua) && !/Android|CrOS/i.test(ua))
  );
}

export function VercelMetrics() {
  return (
    <>
      <Analytics beforeSend={(event) => (isAutomated() ? null : event)} />
      <SpeedInsights sampleRate={0.5} beforeSend={(event) => (isAutomated() ? null : event)} />
    </>
  );
}
