import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { locales } from './i18n';

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the pathname already starts with a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );
  
  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = 'es'; // default locale
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/(es|en)/:path*']
};
