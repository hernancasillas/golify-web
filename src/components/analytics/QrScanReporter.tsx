'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

// Printed downloads carry a QR with utm_medium=print (plan B3). A visit that
// lands with it is a QR scan: report `qr_scan` once per landing.
export function QrScanReporter() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('utm_medium') === 'print') {
        track('qr_scan', { campaign: p.get('utm_campaign') ?? '', page: window.location.pathname });
      }
    } catch {}
  }, []);
  return null;
}
