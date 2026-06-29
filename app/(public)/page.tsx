import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

const Home = async ({ searchParams }: HomePageProps) => {
  return <HomeFeed searchParams={searchParams} sort='hot' hotPath='/' />;
};

export default Home;
