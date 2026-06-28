import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import Skeleton from 'react-loading-skeleton';

const UserProfileLoading = () => (
  <ContentWithSidebar sidebar={<ProfileSidebarSkeleton />}>
    <div role='status' aria-live='polite' aria-busy='true'>
      <section className='celestia-card relative mb-5 overflow-hidden'>
        <Skeleton height={256} borderRadius={0} />
        <div className='relative grid gap-5 border-t border-border/70 p-5 pt-16 md:grid-cols-[minmax(0,1fr)_10rem] md:p-6 md:pt-6'>
          <div className='absolute right-5 -top-16 z-20 size-24 overflow-hidden rounded-2xl border-4 border-card bg-card md:right-7 md:-top-28 md:size-32'>
            <Skeleton height='100%' />
          </div>
          <div>
            <Skeleton width='65%' />
            <Skeleton width='45%' />
          </div>
          <Skeleton height={40} />
        </div>
        <div className='grid grid-cols-3 gap-2 px-5 pb-5 md:px-6 md:pb-6'>
          {[0, 1, 2].map(item => (
            <Skeleton key={item} height={66} />
          ))}
        </div>
      </section>

      <nav className='mb-4 flex border-b border-border/80'>
        {[96, 64, 88, 84, 104].map(width => (
          <div key={width} className='px-4 py-2.5'>
            <Skeleton width={width} height={16} />
          </div>
        ))}
      </nav>

      <section className='space-y-3'>
        {[0, 1, 2].map(item => (
          <div key={item} className='celestia-card p-4'>
            <Skeleton width='35%' />
            <Skeleton width='70%' />
            <Skeleton count={2} />
          </div>
        ))}
      </section>
    </div>
    <span className='sr-only'>Loading profile</span>
  </ContentWithSidebar>
);

const ProfileSidebarSkeleton = () => (
  <div className='space-y-4'>
    <section className='celestia-card overflow-hidden'>
      <Skeleton height={8} borderRadius={0} />
      <div className='space-y-3 p-4'>
        <Skeleton width={112} />
        <Skeleton height={38} />
        <Skeleton height={38} />
      </div>
    </section>
    <section className='celestia-card p-4'>
      <Skeleton width={144} />
      <Skeleton count={3} />
    </section>
  </div>
);

export default UserProfileLoading;
