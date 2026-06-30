import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Communities',
  description: 'Discover active Celestia communities and browse the conversations gaining momentum right now.',
  alternates: {
    canonical: '/explore',
  },
};

const ExplorePage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='hot' />;

export default ExplorePage;
