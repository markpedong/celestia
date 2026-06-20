import LeftSidebar from '@/components/layout/left-sidebar';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import Navbar from '@/components/layout/navbar';
import { OnlineUsersProvider } from '@/components/presence/online-users';
import { getSessionUser } from '@/lib/auth';
import { listJoinedCommunities, tagsPostCounts } from '@/lib/db/queries';
import { getTrendingToday } from '@/lib/trending';
import type { MainLayoutProps } from '@/lib/types';

const MainLayout = async ({ children }: MainLayoutProps) => {
  const user = await getSessionUser();
  const [tags, joinedCommunities] = await Promise.all([
    tagsPostCounts(),
    user ? listJoinedCommunities(user.id) : Promise.resolve([]),
  ]);
  const trending = getTrendingToday();
  const communities = [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));
  const joinedSlugs = new Set(joinedCommunities.map(community => community.slug));
  const sidebarCommunities = user ? tags.filter(({ tag }) => joinedSlugs.has(tag.slug)) : tags;

  return (
    <OnlineUsersProvider user={user}>
      <Navbar trending={trending} communities={communities} user={user} />
      <div className='mx-auto flex w-full max-w-[1600px] gap-0 px-4'>
        <LeftSidebar
          showCta={!user}
          tags={sidebarCommunities}
          communityLabel={user ? 'Joined Communities' : 'Communities'}
        />
        <main className='min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-6 lg:px-6 lg:pb-0'>{children}</main>
      </div>
      <MobileBottomNav isSignedIn={Boolean(user)} />
    </OnlineUsersProvider>
  );
};

export default MainLayout;
