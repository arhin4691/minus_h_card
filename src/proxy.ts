import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 proxy (replaces deprecated middleware.ts).
 * Named export required by Next.js 16 proxy convention.
 * next-intl reads NEXT_LOCALE cookie on each request and redirects the user
 * to their persisted locale. Also handles Accept-Language detection for
 * first-time visitors and the default redirect from `/` → `/ja`.
 */
const handler = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return handler(request);
}

export const config = {
  // Match every route except API, Next internals, and static assets
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
