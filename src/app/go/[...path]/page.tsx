'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { I18nProvider } from '@/components/I18nProvider';
import { InAppBrowserSheet, useBrowserEnv } from '@/components/InAppBrowserHint';
import {
  androidIntentUrl,
  playStoreIntentUrl,
  type BrowserEnv,
} from '@/lib/in-app-browser';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';

// Smart install funnel — the QR / share-link target.
// Tries to open the app via deeplink; if not installed, sends to the right
// store by platform. `src` query param is preserved for attribution (which
// bracket/share/QR drove the install). This is the ONLY auto-redirect route;
// content pages no longer bounce, so they stay crawlable.
//
// In-app browsers (Instagram / TikTok / Facebook) are the tricky case: an iOS
// WKWebView never follows the App Store universal link, so auto-redirecting
// there dead-ends the user. We detect it and show the "open in browser" sheet
// instead of redirecting.
export default function GoRedirect() {
  const params = useParams();
  const env = useBrowserEnv();
  const [sheetClosed, setSheetClosed] = useState(false);

  // Derived, not stored: iOS webviews always get the sheet until it's dismissed.
  const sheet = !sheetClosed && env?.platform === 'ios' && env.inApp !== null;

  const deeplink = useMemo(() => {
    const segments = params.path;
    const path = Array.isArray(segments) ? segments.join('/') : String(segments ?? '');
    return `golify://${path}`;
  }, [params]);

  useEffect(() => {
    if (!env) return;

    // iOS in-app webview: no programmatic escape — the sheet (derived above)
    // explains the ⋯ → "open in browser" path instead of dead-ending.
    if (env.platform === 'ios' && env.inApp) return;

    const start = Date.now();
    // Android in-app webview: custom schemes are blocked, but intent:// works.
    window.location.href =
      env.platform === 'android' && env.inApp
        ? androidIntentUrl(window.location.href, 'com.android.chrome')
        : deeplink;

    const t = setTimeout(() => {
      if (Date.now() - start < 2000) {
        if (env.platform === 'ios') window.location.href = APP_STORE_URL;
        else if (env.platform === 'android')
          window.location.href = env.inApp ? playStoreIntentUrl() : PLAY_STORE_URL;
        // desktop: stay; could show a QR here later
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [env, deeplink]);

  return (
    <I18nProvider locale="es">
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-lg">Abriendo Golify… / Opening Golify…</p>
        {env ? (
          <InAppBrowserSheet
            open={sheet}
            onClose={() => setSheetClosed(true)}
            env={env as BrowserEnv}
            fallbackHref={env.platform === 'android' ? PLAY_STORE_URL : APP_STORE_URL}
          />
        ) : null}
      </main>
    </I18nProvider>
  );
}
