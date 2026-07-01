import LeftSidebar from '@/components/layout/left-sidebar';
import Navbar from '@/components/layout/navbar';
import { ChatWidget } from '@/components/chat/chat-widget';
import { MobileBottomNavDynamic } from '@/components/dynamic-import';
import { getPublicShellData } from '@/lib/public-data';
import { getSessionUser } from '@/lib/auth';
import { SessionProvider } from '@/hooks/useSession';
import type { MainLayoutProps } from '@/lib/types';
import { Suspense } from 'react';
import styles from './layout.module.scss';

const PublicLayout = async ({ children }: MainLayoutProps) => {
  const [{ communities, tagCounts, trending }, sessionUser] = await Promise.all([
    getPublicShellData(),
    getSessionUser(),
  ]);
  const initialUser = sessionUser
    ? { ...sessionUser, createdAt: sessionUser.createdAt.toISOString() }
    : null;

  return (
    <SessionProvider initialUser={initialUser}>
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
        <MobileBottomNavDynamic />
      </Suspense>
      <ChatWidget />
    </SessionProvider>
  );
};

export default PublicLayout;
