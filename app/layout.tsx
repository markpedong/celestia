import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import type { RootLayoutProps } from '@/lib/types';
import { ToasterDynamic } from '@/components/dynamic-import';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import './design.scss';
import { QueryProvider } from '@/components/providers/query-provider';
import { defaultOgImage, siteDescription, siteName, siteUrl } from '@/lib/seo';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Celestia',
    'community forum',
    'discussion platform',
    'threaded conversations',
    'technology communities',
    'space communities',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'community',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: defaultOgImage,
        width: 1672,
        height: 941,
        alt: 'Celestia community forum interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [defaultOgImage],
  },
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang='en' className={`${inter.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className='celestia-app-shell min-h-full flex flex-col bg-background text-foreground'>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <ToasterDynamic />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
