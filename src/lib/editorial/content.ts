// Editorial content loader. Reads src/content/** (Markdown + YAML front
// matter) synchronously and memoizes it per process. Pages that use it are
// static (generateStaticParams comes from here), so a new piece ships with a
// deploy. Front matter reference: src/content/README.md (guides) and
// docs/editorial/flujo-de-publicacion.md (news).

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';

const ROOT = path.join(process.cwd(), 'src', 'content');

export type PieceKind = 'guide' | 'news';

export interface Author {
  slug: string;
  name: string;
  role: string;
  kind: 'person' | 'organization';
  bio: string;
  email?: string;
  image?: string;
  sameAs: string[];
  body: string;
}

export interface Piece {
  kind: PieceKind;
  locale: RouteLocale;
  slug: string;
  title: string;
  seoTitle?: string;
  description: string;
  answer?: string;
  author: string;
  published: string;
  updated: string;
  topic?: string;
  /** News only: previa | cronica | analisis | reportaje | noticia */
  section?: string;
  leagues: number[];
  teams: number[];
  fixture?: number;
  translationKey: string;
  faq: { q: string; a: string }[];
  sources: { title: string; url: string }[];
  image?: { url: string; alt: string; credit?: string };
  liveBlog: boolean;
  liveBlogEnd?: string;
  updates: { time: string; text: string }[];
  body: string;
}

/** YAML turns 2026-09-30 into a Date; keep date-only values date-only. */
function iso(v: unknown, fallback = ''): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const s = v.toISOString();
    return s.endsWith('T00:00:00.000Z') ? s.slice(0, 10) : s;
  }
  return typeof v === 'string' && v ? v : fallback;
}

const nums = (v: unknown): number[] =>
  Array.isArray(v) ? v.map(Number).filter((n) => Number.isFinite(n)) : [];

function readDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
}

let authorsCache: Map<string, Author> | null = null;
export function getAuthors(): Author[] {
  if (!authorsCache) {
    authorsCache = new Map();
    const dir = path.join(ROOT, 'authors');
    for (const f of readDir(dir)) {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
      const slug = f.replace(/\.md$/, '');
      authorsCache.set(slug, {
        slug,
        name: String(data.name ?? slug),
        role: String(data.role ?? ''),
        kind: data.kind === 'organization' ? 'organization' : 'person',
        bio: String(data.bio ?? ''),
        email: data.email ? String(data.email) : undefined,
        image: data.image ? String(data.image) : undefined,
        sameAs: Array.isArray(data.sameAs) ? data.sameAs.map(String) : [],
        body: content.trim(),
      });
    }
  }
  return [...authorsCache.values()];
}

export function getAuthor(slug: string): Author | null {
  getAuthors();
  return authorsCache!.get(slug) ?? null;
}

let piecesCache: Piece[] | null = null;
export function getPieces(): Piece[] {
  if (piecesCache) return piecesCache;
  const out: Piece[] = [];
  for (const kind of ['guide', 'news'] as const) {
    for (const locale of ROUTE_LOCALES) {
      const dir = path.join(ROOT, kind === 'guide' ? 'guides' : 'news', locale);
      for (const f of readDir(dir)) {
        const { data: d, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (d.draft === true || !d.title || !d.description) continue;
        const slug = f.replace(/\.md$/, '');
        const published = iso(d.published);
        const updates = Array.isArray(d.updates)
          ? d.updates
              .map((u: { time?: unknown; text?: unknown }) => ({ time: iso(u.time), text: String(u.text ?? '') }))
              .filter((u: { time: string; text: string }) => u.time && u.text)
          : [];
        out.push({
          kind,
          locale,
          slug,
          title: String(d.title),
          seoTitle: d.seoTitle ? String(d.seoTitle) : undefined,
          description: String(d.description),
          answer: d.answer ? String(d.answer) : undefined,
          author: String(d.author ?? 'redaccion-golify'),
          published,
          updated: iso(d.updated, published),
          topic: d.topic ? String(d.topic) : undefined,
          section: kind === 'news' ? String(d.section ?? 'noticia') : undefined,
          leagues: nums(d.leagues),
          teams: nums(d.teams),
          fixture: d.fixture ? Number(d.fixture) : undefined,
          translationKey: String(d.translationKey ?? slug),
          faq: Array.isArray(d.faq) ? d.faq.map((x: { q: string; a: string }) => ({ q: String(x.q), a: String(x.a) })) : [],
          sources: Array.isArray(d.sources)
            ? d.sources.map((x: { title: string; url: string }) => ({ title: String(x.title), url: String(x.url) }))
            : [],
          image: d.image?.url
            ? { url: String(d.image.url), alt: String(d.image.alt ?? ''), credit: d.image.credit ? String(d.image.credit) : undefined }
            : undefined,
          liveBlog: d.liveBlog === true,
          liveBlogEnd: d.liveBlogEnd ? iso(d.liveBlogEnd) : undefined,
          updates,
          body: content.trim(),
        });
      }
    }
  }
  piecesCache = out.sort((a, b) => b.updated.localeCompare(a.updated));
  return piecesCache;
}

export const getGuides = (locale: RouteLocale) =>
  getPieces().filter((p) => p.kind === 'guide' && p.locale === locale);
export const getNews = (locale: RouteLocale) =>
  getPieces().filter((p) => p.kind === 'news' && p.locale === locale);

export function getGuide(locale: RouteLocale, slug: string): Piece | null {
  return getGuides(locale).find((p) => p.slug === slug) ?? null;
}
export function getNewsPiece(locale: RouteLocale, section: string, slug: string): Piece | null {
  return getNews(locale).find((p) => p.slug === slug && p.section === section) ?? null;
}

/** Locales in which a piece (by kind + translationKey) exists. */
export function localesOf(p: Piece): RouteLocale[] {
  const ls = getPieces()
    .filter((x) => x.kind === p.kind && x.translationKey === p.translationKey)
    .map((x) => x.locale);
  return ROUTE_LOCALES.filter((l) => ls.includes(l));
}
export function translation(p: Piece, locale: RouteLocale): Piece | null {
  return (
    getPieces().find((x) => x.kind === p.kind && x.translationKey === p.translationKey && x.locale === locale) ?? null
  );
}

export function piecesBy(author: string, locale: RouteLocale): Piece[] {
  return getPieces().filter((p) => p.author === author && p.locale === locale);
}
/** Locales where an author has at least one piece. */
export function authorLocales(author: string): RouteLocale[] {
  return ROUTE_LOCALES.filter((l) => piecesBy(author, l).length > 0);
}

export const NEWS_SECTIONS = ['previa', 'cronica', 'analisis', 'reportaje', 'noticia'] as const;
export const SECTION_LABEL: Record<string, Record<RouteLocale, string>> = {
  previa: { es: 'Previa', pt: 'Prévia', en: 'Preview' },
  cronica: { es: 'Crónica', pt: 'Crônica', en: 'Match report' },
  analisis: { es: 'Análisis', pt: 'Análise', en: 'Analysis' },
  reportaje: { es: 'Reportaje', pt: 'Reportagem', en: 'Feature' },
  noticia: { es: 'Noticia', pt: 'Notícia', en: 'News' },
};
export const sectionLabel = (s: string, l: RouteLocale) => SECTION_LABEL[s]?.[l] ?? s;

// ---- Paths ---------------------------------------------------------------

import { sectionPath } from '@/lib/routes';

export function piecePath(p: Piece, locale: RouteLocale = p.locale): string {
  const t = locale === p.locale ? p : translation(p, locale);
  const q = t ?? p;
  return p.kind === 'guide'
    ? sectionPath('guides', locale, q.slug)
    : sectionPath('news', locale, q.section ?? 'noticia', q.slug);
}
export const authorPath = (locale: RouteLocale, slug?: string) => sectionPath('author', locale, slug ?? '');
export const reportPath = (locale: RouteLocale, month?: string) => sectionPath('report', locale, month ?? '');
