import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rising Posts',
  description: 'Discover Celestia conversations gaining momentum right now.',
  alternates: { canonical: '/rising' },
};

const RisingPage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='rising' />;

export default RisingPage;
