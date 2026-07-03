'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PillLink } from '@/components/revamp/ui';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';

// OS-aware download CTA: routes each visitor to the store for their platform.
// Android → Google Play, iOS/desktop → App Store. Detected client-side; the SSR
// default (App Store) is a safe fallback for crawlers and no-JS.
export function SmartDownload({
  children,
  className,
  variant = 'mint',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'mint' | 'gold' | 'outline' | 'dark';
}) {
  const [href, setHref] = useState(APP_STORE_URL);

  useEffect(() => {
    if (/Android/i.test(navigator.userAgent)) setHref(PLAY_STORE_URL);
  }, []);

  return (
    <PillLink href={href} variant={variant} className={className}>
      {children}
    </PillLink>
  );
}
