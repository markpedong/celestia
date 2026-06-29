import type { MetadataRoute } from 'next';
import { siteDescription, siteName } from '@/lib/seo';

const manifest = (): MetadataRoute.Manifest => ({
  name: siteName,
  short_name: siteName,
  description: siteDescription,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#050816',
  theme_color: '#7c3aed',
  icons: [
    {
      src: '/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
    },
    {
      src: '/apple-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
  ],
});

export default manifest;
