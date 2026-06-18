import LeftSidebar from '@/components/layout/left-sidebar';
import Navbar from '@/components/layout/navbar';
import { getSessionUser } from '@/lib/auth';
import { tagsPostCounts } from '@/lib/db/queries';
import { FC } from 'react';

type Props = {
  children: React.ReactNode;
};

const MainLayout: FC<Props> = async ({ children }) => {
  const user = await getSessionUser();
  const tags = await tagsPostCounts();

  return (
    <>
      <Navbar />
      <div className='mx-auto flex max-w-320 gap-0 px-4 pb-16'>
        <LeftSidebar showCta={!user} tags={tags} />
        <main className='min-w-0 flex-1 pt-6 lg:px-6'>{children}</main>
      </div>
    </>
  );
};

export default MainLayout;
