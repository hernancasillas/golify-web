'use client';

import type { ReactNode } from 'react';
import { track, type EventParams } from '@/lib/analytics';

// <InstallCTA> renders store links without analytics; this wrapper reports
// `app_install_click` (plan §0.6) for any link clicked inside it, without
// forking the shared component.
export function TrackInstallClicks({ params, children }: { params?: EventParams; children: ReactNode }) {
  return (
    <div
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest('a');
        if (a) track('app_install_click', { ...params, href: a.getAttribute('href') ?? undefined });
      }}
    >
      {children}
    </div>
  );
}
