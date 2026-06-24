import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';

const Home = async ({ searchParams }: HomePageProps) => {
  return <HomeFeed searchParams={searchParams} sort='hot' hotPath='/' />;
};

export default Home;
