import LeftSidebar from '@/components/layout/left-sidebar';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import Navbar from '@/components/layout/navbar';
import { getSessionUser } from '@/lib/auth';
import { getPublicShellData } from '@/lib/public-data';
import type { MainLayoutProps } from '@/lib/types';
import { Suspense } from 'react';

const PublicLayout = async ({ children }: MainLayoutProps) => {
  const { communities, tagCounts, trending } = await getPublicShellData();
  const session = await getSessionUser();

  return (
    <>
      <Navbar trending={trending} communities={communities} />
      <div className='mx-auto flex w-full max-w-[1600px] gap-0 px-4'>
        <Suspense fallback={<aside className='hidden w-56 shrink-0 lg:block' />}>
          <LeftSidebar showCta={session === null} tags={tagCounts} communityLabel='Communities' />
        </Suspense>
        <main className='min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-6 lg:px-6 lg:pb-0'>
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </>
  );
};

export default PublicLayout;
