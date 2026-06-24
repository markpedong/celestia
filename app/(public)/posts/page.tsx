import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';

const PostsPage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='new' />;

export default PostsPage;
