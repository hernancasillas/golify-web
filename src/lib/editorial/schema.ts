import { absolute, ORGANIZATION_REF, type JsonLdNode } from '@/lib/seo';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, LOGO_URL } from '@/lib/site';
import type { Author, Piece } from './content';
import type { RouteLocale } from '@/lib/routes';

export function authorNode(a: Author, url: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': a.kind === 'organization' ? 'Organization' : 'Person',
    '@id': `${absolute(url)}#author`,
    name: a.name,
    url: absolute(url),
    ...(a.kind === 'person' && a.role ? { jobTitle: a.role } : {}),
    ...(a.bio ? { description: a.bio } : {}),
    ...(a.image ? { image: absolute(a.image) } : {}),
    ...(a.kind === 'organization' ? { parentOrganization: ORGANIZATION_REF, logo: LOGO_URL } : { worksFor: ORGANIZATION_REF }),
    ...(a.sameAs.length ? { sameAs: a.sameAs } : {}),
  };
}

const LANG = { es: 'es', pt: 'pt-BR', en: 'en' } as const;

export function articleNode(p: Piece, a: Author | null, pagePath: string, authorUrl: string): JsonLdNode {
  const url = absolute(pagePath);
  const base: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': p.liveBlog ? 'LiveBlogPosting' : p.kind === 'news' ? 'NewsArticle' : 'Article',
    '@id': `${url}#article`,
    headline: p.title.slice(0, 110),
    description: p.description,
    datePublished: p.published,
    dateModified: p.updated,
    author: a
      ? { '@type': a.kind === 'organization' ? 'Organization' : 'Person', name: a.name, url: absolute(authorUrl) }
      : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: ORGANIZATION_REF,
    mainEntityOfPage: url,
    inLanguage: LANG[p.locale],
    image: [p.image?.url ? absolute(p.image.url) : DEFAULT_OG_IMAGE],
    ...(p.section ? { articleSection: p.section } : {}),
  };
  if (p.liveBlog) {
    base.coverageStartTime = p.published;
    if (p.liveBlogEnd) base.coverageEndTime = p.liveBlogEnd;
    base.liveBlogUpdate = p.updates.map((u) => ({
      '@type': 'BlogPosting',
      headline: u.text.slice(0, 110),
      datePublished: u.time,
      articleBody: u.text,
    }));
  }
  return base;
}

export const langOf = (l: RouteLocale) => LANG[l];
