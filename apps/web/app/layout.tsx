import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app');
  const description =
    "Koppel je foto's, sociale media en documenten. Bewora brengt je digitale leven samen in een onafhankelijk archief dat van jou blijft.";
  return {
    metadataBase: new URL('https://bewora.nl'),
    title: {
      default: `${t('name')} — Bewaar je digitale leven onafhankelijk`,
      template: `%s · ${t('name')}`,
    },
    description,
    icons: {
      icon: [{ url: '/brand/bewora-favicon.png', type: 'image/png', sizes: '64x64' }],
      apple: [{ url: '/brand/bewora-apple-touch-icon.png', sizes: '180x180' }],
    },
    openGraph: {
      type: 'website',
      locale: 'nl_NL',
      siteName: t('name'),
      title: `${t('name')} — Bewaar wat van jou is`,
      description,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
