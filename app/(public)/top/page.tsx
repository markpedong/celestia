import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Posts',
  description: 'Browse the highest-rated Celestia posts and conversations from across every community.',
  alternates: {
    canonical: '/top',
  },
};

const TopPage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='top' />;

export default TopPage;
