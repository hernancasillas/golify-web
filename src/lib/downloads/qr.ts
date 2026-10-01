// QR codes that turn paper back into a visit (plan B3: utm_medium=print, the
// "qr_scan" event is read from that UTM). Server-only: qrcode renders here,
// never in the browser bundle.

import QRCode from 'qrcode';
import { withUtm } from '@/lib/analytics';
import { absolute } from '@/lib/seo';

/** Absolute page URL tagged for print: utm_source=golify_web&utm_medium=print&utm_campaign={slug}. */
export function printUrl(pagePath: string, slug: string): string {
  return withUtm(absolute(pagePath), 'print', slug);
}

/** PNG data URL for the PDF. */
export function qrPng(url: string): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 240, color: { dark: '#1A1A2E', light: '#FFFFFF' } });
}

/** SVG markup for the page (inherits nothing; dark-on-white so phones read it in dark mode too). */
export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#1A1A2E', light: '#FFFFFF' } });
}
