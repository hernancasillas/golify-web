import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const locales = ['en', 'es'] as const;
const defaultLocale = 'es';

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}`, request.url)
  );
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
