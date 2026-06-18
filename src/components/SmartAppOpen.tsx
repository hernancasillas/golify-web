'use client';

import { useEffect } from 'react';

// Best-effort "open the app if installed" WITHOUT destroying the page.
// The old funnels did `window.location.href = deeplink` on mount, which
// blanked the content (bad for SEO and for users without the app). Here the
// SSR content always stays visible; we only *attempt* a soft hand-off:
//
//   - Android: a hidden iframe pointed at the custom scheme opens the app if
//     installed and fails silently otherwise — the page is never navigated
//     away, so content remains as the fallback.
//   - iOS: we do nothing here on purpose. iOS shows an "address is invalid"
//     popup for unhandled custom schemes, so we rely on the native Smart App
//     Banner instead (the `apple-itunes-app` meta with `app-argument`), which
//     offers "Open" only when the app is actually installed.
//
// Crawlers and desktop browsers never trigger any of this.
export function SmartAppOpen({ deeplink }: { deeplink: string }) {
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    if (!isAndroid) return;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deeplink;
    document.body.appendChild(iframe);

    const timer = setTimeout(() => iframe.remove(), 1500);
    return () => {
      clearTimeout(timer);
      iframe.remove();
    };
  }, [deeplink]);

  return null;
}
