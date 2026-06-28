import LeftSidebar from '@/components/layout/left-sidebar';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import Navbar from '@/components/layout/navbar';
import { ChatWidget } from '@/components/chat/chat-widget';
import { getPublicShellData } from '@/lib/public-data';
import type { MainLayoutProps } from '@/lib/types';
import { Suspense } from 'react';
import styles from './layout.module.scss';

const PublicLayout = async ({ children }: MainLayoutProps) => {
  const { communities, tagCounts, trending } = await getPublicShellData();

  return (
    <>
      <Navbar trending={trending} communities={communities} />
      <div className={styles.shell}>
        <Suspense fallback={<aside className={styles.sidebarFallback} />}>
          <LeftSidebar tags={tagCounts} communityLabel='Communities' />
        </Suspense>
        <main className={styles.main}>
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
      <ChatWidget />
    </>
  );
};

export default PublicLayout;
