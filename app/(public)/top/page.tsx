import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';

const TopPage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='top' />;

export default TopPage;
