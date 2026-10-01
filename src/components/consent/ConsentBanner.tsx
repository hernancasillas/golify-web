'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sectionPath, type RouteLocale } from '@/lib/routes';

// LGPD banner. Shown ONLY to visitors in Brazil with no stored choice.
// EEA / UK / Switzerland are covered by Google's certified CMP (AdSense →
// Privacy & messaging, TCF v2.2), so this banner must never appear there; the
// consent defaults for those regions are set in AnalyticsScripts.
const GEO_KEY = 'golify-geo';
const CONSENT_KEY = 'golify-consent';

const STR = {
  es: { text: 'Usamos cookies para analítica y publicidad. Tú decides.', accept: 'Aceptar', reject: 'Rechazar', more: 'Política de cookies' },
  pt: { text: 'Usamos cookies para análise e publicidade. Você decide.', accept: 'Aceitar', reject: 'Recusar', more: 'Política de cookies' },
  en: { text: 'We use cookies for analytics and advertising. Your choice.', accept: 'Accept', reject: 'Reject', more: 'Cookie policy' },
} as const;

type Gtag = (...a: unknown[]) => void;

function store(k: string, v?: string): string | null {
  try {
    if (v !== undefined) localStorage.setItem(k, v);
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

async function countryOf(): Promise<string | null> {
  // Dev-only override to test the banner without a Brazilian IP: ?consent-geo=BR
  if (process.env.NODE_ENV !== 'production') {
    const o = new URLSearchParams(location.search).get('consent-geo');
    if (o) return o.toUpperCase();
  }
  const cached = store(GEO_KEY);
  if (cached) return cached === '-' ? null : cached;
  try {
    const r = await fetch('/api/geo', { cache: 'no-store' });
    const { country } = (await r.json()) as { country: string | null };
    store(GEO_KEY, country ?? '-');
    return country;
  } catch {
    return null;
  }
}

export function ConsentBanner({ locale }: { locale: RouteLocale }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (store(CONSENT_KEY) === 'granted' || store(CONSENT_KEY) === 'denied') return;
    let alive = true;
    countryOf().then((c) => {
      if (alive && c === 'BR') setShow(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!show) return null;
  const L = STR[locale] ?? STR.es;

  const choose = (v: 'granted' | 'denied') => {
    store(CONSENT_KEY, v);
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
    setShow(false);
  };

  const btn = 'flex-1 rounded-full border border-border px-5 py-2.5 text-sm font-bold sm:flex-none';
  return (
    <div role="dialog" aria-label={L.text} className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm font-semibold text-foreground">
          {L.text}{' '}
          <Link href={sectionPath('cookies', locale)} className="text-primary underline">
            {L.more}
          </Link>
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => choose('denied')} className={`${btn} bg-surface-2 text-foreground`}>
            {L.reject}
          </button>
          <button type="button" onClick={() => choose('granted')} className={`${btn} bg-surface-2 text-foreground`}>
            {L.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
