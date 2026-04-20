import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Script from 'next/script';
import ThemeProvider from '@/providers/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import SessionProvider from '@/providers/SessionProvider';
import Layout from '@/components/templates/Layout';
import '@/app/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Minus H Card',
  description: 'Collect, trade, and unlock the cutest cards in the universe',
  icons: {
    icon: '/title/title.png',
    apple: '/title/title.png',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="antialiased font-sans">
        {/* Anti-flash: apply dark class before first paint */}
        <Script
          id="dark-mode-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&m)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <SessionProvider>
              <ThemeProvider>
                <Layout>{children}</Layout>
              </ThemeProvider>
            </SessionProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
