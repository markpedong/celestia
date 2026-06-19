import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import './design.scss';

import NeonAuthProviders from '@/providers/neon-auth-ui-provider';

const displayModeScript = `
(() => {
  const storageKey = 'celestia-display-mode';
  const root = document.documentElement;
  const storedMode = window.localStorage.getItem(storageKey);
  const displayMode = storedMode === 'dark' || storedMode === 'light' || storedMode === 'system' ? storedMode : 'system';
  const resolvedMode = displayMode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : displayMode;

  root.classList.toggle('dark', resolvedMode === 'dark');
  root.classList.toggle('light', resolvedMode === 'light');
  root.style.colorScheme = resolvedMode;
})();
`;

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Celestia',
  description: 'A community forum for posts, votes, and threaded conversations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: displayModeScript }} />
      </head>
      <body className='celestia-app-shell min-h-full flex flex-col bg-background text-foreground'>
        <NeonAuthProviders>{children}</NeonAuthProviders>
      </body>
    </html>
  );
}
