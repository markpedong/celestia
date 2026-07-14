import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Controversial Posts',
  description: 'Browse Celestia conversations drawing strong reactions on both sides.',
  alternates: { canonical: '/controversial' },
};

const ControversialPage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='controversial' />;

export default ControversialPage;
