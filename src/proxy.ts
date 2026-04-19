import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Next.js 16 proxy (replaces deprecated middleware.ts).
 * next-intl reads NEXT_LOCALE cookie on each request and redirects the user
 * to their persisted locale. Also handles Accept-Language detection for
 * first-time visitors and the default redirect from `/` → `/ja`.
 */
export default createMiddleware(routing);

export const config = {
  // Match every route except API, Next internals, and static assets
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
