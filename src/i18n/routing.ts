import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-HK', 'ja'],
  defaultLocale: 'ja',
});
