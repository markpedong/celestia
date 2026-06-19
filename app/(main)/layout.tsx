import LeftSidebar from '@/components/layout/left-sidebar';
import Navbar from '@/components/layout/navbar';
import { getSessionUser } from '@/lib/auth';
import { tagsPostCounts } from '@/lib/db/queries';
import { getTrendingToday } from '@/lib/trending';
import { FC } from 'react';

type Props = {
  children: React.ReactNode;
};

const MainLayout: FC<Props> = async ({ children }) => {
  const user = await getSessionUser();
  const tags = await tagsPostCounts();
  const trending = getTrendingToday();
  const communities = [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));

  return (
    <>
      <Navbar trending={trending} communities={communities} user={user} />
      <div className='mx-auto flex w-full max-w-[1600px] gap-0 px-4'>
        <LeftSidebar showCta={!user} tags={tags} />
        <main className='min-w-0 flex-1 pt-6 lg:px-6'>{children}</main>
      </div>
    </>
  );
};

export default MainLayout;
