import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Minus H Card',
    short_name: 'Minus H',
    description: 'Collect, trade, and unlock the cutest cards in the universe',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#fc88c6',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/title/title.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/title/title.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
