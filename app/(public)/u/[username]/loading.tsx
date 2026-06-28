import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import Skeleton from 'react-loading-skeleton';

const UserProfileLoading = () => (
  <ContentWithSidebar sidebar={<ProfileSidebarSkeleton />}>
    <div role='status' aria-live='polite' aria-busy='true'>
      <section className='celestia-card relative mb-5 overflow-hidden'>
        <Skeleton height={256} borderRadius={0} />
        <div className='relative grid gap-5 border-t border-border/70 p-5 pt-16 md:p-6 md:pt-6'>
          <div className='absolute right-5 -top-16 z-20 size-24 overflow-hidden rounded-2xl border-4 border-card bg-card md:right-7 md:-top-28 md:size-32'>
            <Skeleton height='100%' />
          </div>
          <div>
            <Skeleton width='65%' />
            <Skeleton width='45%' />
          </div>
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
      <Skeleton height={6} borderRadius={0} />
      <div className='space-y-4 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <Skeleton width='70%' height={22} />
            <Skeleton width='45%' height={14} />
          </div>
          <Skeleton circle width={36} height={36} />
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <Skeleton height={36} borderRadius={999} />
          <Skeleton height={36} borderRadius={999} />
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <Skeleton height={62} />
          <Skeleton height={62} />
          <div className='col-span-2'>
            <Skeleton height={62} />
          </div>
        </div>
      </div>
    </section>
    <section className='celestia-card p-4'>
      <Skeleton width={144} />
      <Skeleton count={3} />
    </section>
  </div>
);

export default UserProfileLoading;
