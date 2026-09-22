import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const locales = ['en', 'es', 'pt'] as const;
const defaultLocale = 'es';

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  // 308, not the default 307: the locale prefix is where the content lives
  // permanently, and a permanent redirect is what consolidates link equity on
  // the canonical URL instead of leaving Google guessing every crawl.
  return NextResponse.redirect(
    new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}`, request.url),
    308
  );
}

export const config = {
  // Exclude metadata image routes (no file extension, so they'd otherwise be
  // locale-redirected into a 404) and API/static assets.
  matcher: [
    // `go` is excluded on purpose: /go/<path> is the install funnel and it
    // lives outside the locale tree. Locale-prefixing it sent every shared
    // install link to /es/go/... , which is a 404.
    '/((?!api|go|_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest|.*\\..*).*)',
  ],
};
