import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import type { RootLayoutProps } from '@/lib/types';
import { ToasterDynamic } from '@/components/dynamic-import';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import './design.scss';
import { QueryProvider } from '@/components/providers/query-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const siteDescription =
  'Celestia is a cosmic community forum for discovering signals, sharing posts, voting on ideas, and joining threaded conversations across technology, space, science, gaming, and more.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Celestia',
  title: {
    default: 'Celestia',
    template: '%s | Celestia',
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
  authors: [{ name: 'Celestia' }],
  creator: 'Celestia',
  publisher: 'Celestia',
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
    siteName: 'Celestia',
    title: 'Celestia',
    description: siteDescription,
    images: [
      {
        url: '/images/celestia-reference.png',
        width: 1672,
        height: 941,
        alt: 'Celestia community forum interface with the Celestia logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Celestia',
    description: siteDescription,
    images: ['/images/celestia-reference.png'],
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
