'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';

// Smart install funnel — the QR / share-link target.
// Tries to open the app via deeplink; if not installed, sends to the right
// store by platform. `src` query param is preserved for attribution (which
// bracket/share/QR drove the install). This is the ONLY auto-redirect route;
// content pages no longer bounce, so they stay crawlable.
export default function GoRedirect() {
  const params = useParams();
  const search = useSearchParams();

  useEffect(() => {
    const segments = params.path;
    const path = Array.isArray(segments) ? segments.join('/') : String(segments ?? '');
    const deeplink = `golify://${path}`;

    const start = Date.now();
    window.location.href = deeplink;

    const t = setTimeout(() => {
      if (Date.now() - start < 2000) {
        const ua = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(ua)) window.location.href = APP_STORE_URL;
        else if (/Android/.test(ua)) window.location.href = PLAY_STORE_URL;
        // desktop: stay; could show a QR here later
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [params, search]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <p className="text-lg">Abriendo Golify… / Opening Golify…</p>
    </main>
  );
}
