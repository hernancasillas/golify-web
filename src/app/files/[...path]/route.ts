// Generated files of the printable downloads: /files/{locale}/{slug}.{pdf|csv|xlsx|ics}.
// Outside the locale tree on purpose: the proxy leaves /files alone and
// next.config sends X-Robots-Tag: noindex, so the HTML page is what ranks and
// the file is what gets printed. Same resolver as the page: a stale slug 308s
// to the canonical file, a missing one is a 404, a provider failure is a 503
// (never an empty sheet presented as real).

import { ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';
import { resolveDownload, type Download } from '@/lib/downloads/resolve';
import { FORMATS, downloadPath, filePath, parseFileName, type FileExt } from '@/lib/downloads/slugs';
import { downloadCopy } from '@/lib/downloads/copy';
import { printUrl, qrPng } from '@/lib/downloads/qr';
import { displayUrl } from '@/lib/downloads/pdf/common';
import { renderPdf } from '@/lib/downloads/pdf/docs';
import { sheetsFor, toCsv, toXlsx } from '@/lib/downloads/sheets';
import { buildIcs } from '@/lib/downloads/ics';
import { absolute } from '@/lib/seo';
import { slugify } from '@/lib/slug';

const TYPES: Record<FileExt, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ics: 'text/calendar; charset=utf-8',
};

const CACHE = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400';

function notFound(): Response {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, s-maxage=300' } });
}

async function build(d: Download, l: RouteLocale, ext: FileExt, letter: boolean): Promise<BodyInit | null> {
  const page = downloadPath(l, d.slug);
  if (ext === 'pdf') {
    const qr = await qrPng(printUrl(page, d.slug));
    const pdf = await renderPdf(d, l, { qr, url: displayUrl(absolute(page)), letter });
    return pdf ? new Uint8Array(pdf) : null;
  }
  if (ext === 'ics') {
    if (d.kind !== 'calendar') return null;
    return buildIcs({ name: downloadCopy(d, l).short, fixtures: d.cal.fixtures, locale: l, slug: d.slug });
  }
  const sheets = sheetsFor(d, l, displayUrl(absolute(page)));
  if (!sheets.length) return null;
  if (ext === 'csv') return toCsv(sheets[0]);
  return new Uint8Array(await toXlsx(sheets));
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.length !== 2 || !(ROUTE_LOCALES as readonly string[]).includes(path[0])) return notFound();
  const locale = path[0] as RouteLocale;
  const file = parseFileName(path[1]);
  if (!file) return notFound();
  const letter = new URL(req.url).searchParams.get('size') === 'letter';

  let r;
  try {
    r = await resolveDownload(file.slug, locale);
  } catch (e) {
    console.error('[files] provider error', file.slug, e);
    return new Response('Temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '120' } });
  }
  if (!r) return notFound();
  if (r.kind === 'redirect') {
    return new Response(null, { status: 308, headers: { Location: filePath(locale, r.slug, file.ext, letter ? 'letter' : undefined) } });
  }
  if (!FORMATS[r.kind].includes(file.ext)) return notFound();
  if (letter && r.kind !== 'quiniela') return notFound();

  const body = await build(r, locale, file.ext, letter);
  if (!body) return notFound();
  const name = `${slugify(downloadCopy(r, locale).short) || r.slug}${letter ? '-letter' : ''}.${file.ext}`;
  return new Response(body, {
    headers: {
      'Content-Type': TYPES[file.ext],
      'Content-Disposition': `${file.ext === 'pdf' ? 'inline' : 'attachment'}; filename="${name}"`,
      'Cache-Control': CACHE,
      'X-Robots-Tag': 'noindex',
    },
  });
}
