import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { resolvePath } from '@/lib/routing';

// Localized URL scheme (see src/lib/routes.ts for the table and
// src/lib/routing.ts for the rules). Canonical public paths are rewritten to
// their internal route folder; every other spelling gets one permanent
// redirect to the canonical URL.
export default function proxy(request: NextRequest) {
  const res = resolvePath(request.nextUrl.pathname);

  if (res.action === 'next') return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = res.path;

  // 308, not 307: the canonical URL is where the content lives permanently,
  // and a permanent redirect is what consolidates link equity on it. Search
  // engines treat 308 exactly like 301.
  return res.action === 'rewrite'
    ? NextResponse.rewrite(url)
    : NextResponse.redirect(url, 308);
}

export const config = {
  // Exclude metadata image routes (no file extension, so they'd otherwise be
  // locale-redirected into a 404) and API/static assets.
  matcher: [
    // `go` is excluded on purpose: /go/<path> is the install funnel and it
    // lives outside the locale tree. Locale-prefixing it sent every shared
    // install link to /es/go/... , which is a 404. `sitemap` also covers the
    // /sitemaps/… children and /sitemap-index.xml.
    '/((?!api|go|files|_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest|\\.well-known|.*\\..*).*)',
  ],
};
