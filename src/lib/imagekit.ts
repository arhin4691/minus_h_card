const IMAGEKIT_BASE =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL ?? '';

/**
 * Prepend the ImageKit base URL to a DB-stored image path.
 * Paths that are already absolute URLs or local static files are returned unchanged.
 */
export function getCardImageUrl(path: string): string {
  if (!path) return path;
  // Already absolute (http/https) or a local static file — leave alone
  if (path.startsWith('http') || path.startsWith('/white') || !IMAGEKIT_BASE) {
    return path;
  }
  // Ensure no double slash
  const base = IMAGEKIT_BASE.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
