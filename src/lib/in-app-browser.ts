// In-app browser detection.
//
// Links shared on Instagram / TikTok / Facebook open inside those apps' embedded
// WKWebView / Android WebView, not in Safari or Chrome. That breaks store CTAs:
//
//   - iOS: an embedded WKWebView does NOT follow universal links, so tapping
//     https://apps.apple.com/... renders the App Store *web* page inside the
//     webview instead of handing off to the App Store app. There is no
//     programmatic escape (Apple blocks `x-safari-https:` from third-party
//     webviews), so the only fix is telling the user to tap ⋯ → "Open in browser".
//   - Android: WebViews DO honour `intent://` URLs, so we can escape without any
//     user action — send them straight to the Play Store app (or Chrome).
//
// Everything here is a pure function of the UA string so it can also run on the
// server (proxy/RSC) if we ever want a no-flash SSR banner.

import { ANDROID_PACKAGE } from '@/lib/site';

export type InAppApp =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'messenger'
  | 'snapchat'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'line'
  | 'telegram'
  | 'other';

export type Platform = 'ios' | 'android' | 'desktop';

export type BrowserEnv = {
  platform: Platform;
  /** Which in-app browser we're inside, or null when it's a real browser. */
  inApp: InAppApp | null;
  /** True when we can escape the webview programmatically (Android only). */
  canEscape: boolean;
};

/** Human-facing app names (proper nouns — not translated). */
export const IN_APP_LABELS: Record<InAppApp, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  messenger: 'Messenger',
  snapchat: 'Snapchat',
  twitter: 'X',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  line: 'LINE',
  telegram: 'Telegram',
  other: '',
};

// Order matters: Messenger UAs also contain FB_IAB, so it must win over facebook.
const APP_MATCHERS: [InAppApp, RegExp][] = [
  ['instagram', /Instagram/i],
  ['messenger', /FB_IAB\/MESSENGER|MessengerForiOS|MessengerLite/i],
  ['facebook', /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i],
  ['tiktok', /BytedanceWebview|musical_ly|Bytedance|TikTok|trill_/i],
  ['snapchat', /Snapchat/i],
  ['twitter', /Twitter(?:ForiPhone|Android)?/i],
  ['linkedin', /LinkedInApp|LIAuthLibrary/i],
  ['pinterest', /Pinterest/i],
  ['line', /\bLine\/\d/i],
  ['telegram', /Telegram/i],
];

// Real third-party browsers on iOS — these are NOT in-app webviews even though
// their UA lacks the plain "Safari/" token in some versions.
const IOS_REAL_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser|Brave/i;

export function detectPlatform(ua: string): Platform {
  if (/Android/i.test(ua)) return 'android';
  // iPadOS 13+ reports as Macintosh; the touch check is done by the caller when
  // it has access to `navigator`, so we only handle the classic tokens here.
  if (/iPhone|iPod|iPad/i.test(ua)) return 'ios';
  return 'desktop';
}

/**
 * Detect the browsing environment from a UA string.
 *
 * @param ua        navigator.userAgent
 * @param standalone `navigator.standalone` — a home-screen PWA on iOS has no
 *                   "Safari/" token either, so we must not flag it as in-app.
 */
export function detectBrowserEnv(ua: string, standalone = false): BrowserEnv {
  const platform = detectPlatform(ua);

  let inApp: InAppApp | null = null;
  for (const [app, re] of APP_MATCHERS) {
    if (re.test(ua)) {
      inApp = app;
      break;
    }
  }

  // Generic fallback for the long tail of apps that don't brand their UA.
  if (!inApp && !standalone) {
    // Android WebView always carries the "; wv)" token.
    if (platform === 'android' && /;\s*wv\)/i.test(ua)) inApp = 'other';
    // iOS WKWebView: WebKit + Mobile build token, but no "Safari/" and not a
    // known third-party browser.
    if (
      platform === 'ios' &&
      /AppleWebKit/i.test(ua) &&
      /Mobile\//i.test(ua) &&
      !/Safari\//i.test(ua) &&
      !IOS_REAL_BROWSERS.test(ua)
    ) {
      inApp = 'other';
    }
  }

  return { platform, inApp, canEscape: platform === 'android' && inApp !== null };
}

/** Reads the live environment in the browser. Returns desktop-safe defaults on the server. */
export function readBrowserEnv(): BrowserEnv {
  if (typeof navigator === 'undefined') {
    return { platform: 'desktop', inApp: null, canEscape: false };
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  return detectBrowserEnv(nav.userAgent || '', nav.standalone === true);
}

/**
 * Android `intent://` URL that leaves the in-app WebView and opens the target in
 * a real app. The fragment is dropped because `#Intent;…` is itself the intent
 * fragment and a second `#` would corrupt it.
 */
export function androidIntentUrl(url: string, pkg?: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  const scheme = u.protocol.replace(':', '');
  const target = `${u.host}${u.pathname}${u.search}`;
  const pkgPart = pkg ? `package=${pkg};` : '';
  return `intent://${target}#Intent;scheme=${scheme};${pkgPart}S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

/** Opens the Play Store *app* from inside an Android WebView. */
export function playStoreIntentUrl(pkg: string = ANDROID_PACKAGE): string {
  return `intent://details?id=${pkg}#Intent;scheme=market;package=com.android.vending;end`;
}
