'use client';

import type { ReactNode } from 'react';
import { StoreLink } from '@/components/StoreLink';

// OS-aware download CTA: routes each visitor to the store for their platform.
// Android → Google Play, iOS/desktop → App Store. Detected client-side; the SSR
// default (App Store) is a safe fallback for crawlers and no-JS.
//
// In-app browsers (Instagram/TikTok/Facebook) are handled by StoreLink: Android
// escapes via intent://, iOS shows the "open in browser" hint sheet.
export function SmartDownload({
  children,
  className,
  variant = 'mint',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'mint' | 'gold' | 'outline' | 'dark';
}) {
  return (
    <StoreLink store="auto" variant={variant} className={className}>
      {children}
    </StoreLink>
  );
}
