import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';

const ExplorePage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='hot' />;

export default ExplorePage;
