import LeftSidebar from '@/components/layout/left-sidebar';
import Navbar from '@/components/layout/navbar';
import { getSessionUser } from '@/lib/auth';
import { FC } from 'react';

type Props = {
  children: React.ReactNode;
};

const MainLayout: FC<Props> = async ({ children }) => {
  const user = await getSessionUser();

  return (
    <>
      <Navbar />
      <div className='mx-auto flex max-w-300 gap-8 px-4 pb-16 pt-2'>
        <LeftSidebar showCta={!user} />
        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </>
  );
};

export default MainLayout;
