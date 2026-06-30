import HomeFeed from '@/components/feed/home-feed';
import type { HomePageProps } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Latest Posts',
  description: 'Read the newest posts from Celestia communities, from quick updates to deeper discussions.',
  alternates: {
    canonical: '/posts',
  },
};

const PostsPage = ({ searchParams }: HomePageProps) => <HomeFeed searchParams={searchParams} sort='new' />;

export default PostsPage;
