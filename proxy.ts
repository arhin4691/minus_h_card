import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

/**
 * proxy.ts — Next.js 16 request proxy (replaces deprecated middleware.ts)
 * Handles locale detection, i18n routing, and request interception.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the pathname already has a locale prefix
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Detect preferred locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const detectedLocale = detectLocale(acceptLanguage);

  // Redirect to the locale-prefixed path
  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(url);
}

function detectLocale(acceptLanguage: string): string {
  const preferences = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=');
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferences) {
    // Exact match
    if (routing.locales.includes(lang as typeof routing.locales[number])) {
      return lang;
    }
    // Partial match (e.g., "zh" → "zh-HK", "ja-JP" → "ja")
    const partial = routing.locales.find(
      (loc) => loc.startsWith(lang.split('-')[0])
    );
    if (partial) return partial;
  }

  return routing.defaultLocale;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
