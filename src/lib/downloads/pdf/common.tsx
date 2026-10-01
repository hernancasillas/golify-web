// Shared pieces of every printable PDF: brand header, the footer with the QR
// back to the page (UTM medium=print), the "Hecho con Golify" line, and the
// text sanitizer the built-in PDF fonts need.
//
// Colors are the site's light-theme tokens (globals.css): paper is white, so
// the printed sheet uses the same ink, line and brand green as the light site.

import fs from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';
import { Font, Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { RouteLocale } from '@/lib/routes';

export const INK = '#1A1A2E';
export const MUTED = '#5C5C7A';
export const LINE = '#E2E2EA';
export const BAND = '#F7F7FA';
export const GREEN = '#00A040';

// Long team names must wrap at spaces, never be hyphenated mid-word.
Font.registerHyphenationCallback((word) => [word]);

let logoCache: Buffer | null = null;
function logo(): Buffer {
  if (!logoCache) logoCache = fs.readFileSync(path.join(process.cwd(), 'public', 'icon.png'));
  return logoCache;
}

// Helvetica (built in, no font files to ship) only encodes WinAnsi. Anything
// outside it would print as garbage, so fold accents we cannot print
// ("Beşiktaş" → "Besiktas") and drop what is left.
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''));
export function pdfText(input: string | number | null | undefined): string {
  const s = input == null ? '' : String(input);
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(ch) || ch === '\n') {
      out += ch;
      continue;
    }
    const folded = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (folded && [...folded].every((c) => (c.codePointAt(0) ?? 0) < 0x7f)) out += folded;
    else if (ch === 'ı') out += 'i';
    else if (ch === 'ł' || ch === 'Ł') out += ch === 'ł' ? 'l' : 'L';
    else if (ch === 'đ' || ch === 'Đ') out += ch === 'đ' ? 'd' : 'D';
  }
  return out;
}

export const base = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 92, paddingHorizontal: 30, fontFamily: 'Helvetica', fontSize: 9, color: INK },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logo: { width: 20, height: 20, borderRadius: 4, marginRight: 6 },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: GREEN, letterSpacing: 1 },
  kicker: { marginLeft: 'auto', fontSize: 8, color: MUTED, textTransform: 'uppercase' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 18, lineHeight: 1.15 },
  subtitle: { marginTop: 3, fontSize: 9, color: MUTED },
  h2: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 12, marginBottom: 5 },
  footer: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  qr: { width: 58, height: 58, marginRight: 10 },
  cta: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  url: { marginTop: 2, fontSize: 8, color: GREEN },
  made: { marginTop: 2, fontSize: 7.5, color: MUTED },
  pageNo: { marginLeft: 'auto', fontSize: 7.5, color: MUTED },
  box: { width: 10, height: 10, borderWidth: 1, borderColor: INK, borderRadius: 1.5 },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: MUTED, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.6, borderBottomColor: LINE },
});

const MADE: Record<RouteLocale, string> = {
  es: 'Hecho con Golify · golify.futbol',
  pt: 'Feito com Golify · golify.futbol',
  en: 'Made with Golify · golify.futbol',
};

const PAGE: Record<RouteLocale, string> = { es: 'Página', pt: 'Página', en: 'Page' };

export function BrandHeader({ kicker }: { kicker: string }) {
  return (
    <View style={base.brandRow}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
      <Image src={{ data: logo(), format: 'png' }} style={base.logo} />
      <Text style={base.brand}>GOLIFY</Text>
      <Text style={base.kicker}>{pdfText(kicker)}</Text>
    </View>
  );
}

export function Footer({
  locale,
  qr,
  cta,
  url,
}: {
  locale: RouteLocale;
  /** PNG data URL of the QR. */
  qr: string;
  cta: string;
  /** Short, human-readable page URL ("golify.futbol/es/descargas/…"). */
  url: string;
}) {
  return (
    <View style={base.footer} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
      <Image src={qr} style={base.qr} />
      <View style={{ flexShrink: 1 }}>
        <Text style={base.cta}>{pdfText(cta)}</Text>
        <Text style={base.url}>{pdfText(url)}</Text>
        <Text style={base.made}>{MADE[locale]}</Text>
      </View>
      <Text
        style={base.pageNo}
        render={({ pageNumber, totalPages }) => `${PAGE[locale]} ${pageNumber}/${totalPages}`}
      />
    </View>
  );
}

export function Box() {
  return <View style={base.box} />;
}

export function Cell({ w, children, align, bold, color }: { w: number | string; children?: ReactNode; align?: 'left' | 'center' | 'right'; bold?: boolean; color?: string }) {
  return (
    <View style={{ width: w as number, paddingVertical: 3.5, paddingHorizontal: 3, alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={{ fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica', color: color ?? INK }}>{pdfText(children)}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function displayUrl(absoluteUrl: string): string {
  return absoluteUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '');
}
